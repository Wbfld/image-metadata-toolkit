import { describe, expect, it } from "vitest";

import { auditPrivacy, createMetadataRegistry, evaluatePrivacyPolicy, getPrivacyPolicy, getPrivacyPolicyRegistryCoverage, PRIVACY_POLICY_PRESETS, sanitizeMetadata } from "../src/index.js";
import { inspectSemanticPrivacyDetailed } from "../src/privacy/semantic.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";
import type { MetadataResult } from "../src/types.js";

const encoder = new TextEncoder();

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return Uint8Array.from([0xff, marker, length >>> 8, length & 0xff, ...payload]);
}

function jpegWithXmp(packet: string): Uint8Array {
  const xmp = Uint8Array.from([...encoder.encode("http://ns.adobe.com/xap/1.0/\0"), ...encoder.encode(packet)]);
  const sof = segment(0xc0, Uint8Array.of(8, 0, 1, 0, 1, 1, 1, 0x11, 0));
  const sos = segment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0));
  return Uint8Array.from([0xff, 0xd8, ...segment(0xe1, xmp), ...sof, ...sos, 0, 0, 0xff, 0xd9]);
}

describe("T01 semantic privacy inspection", () => {
  it("enumerates every required semantic category with exact source linkage", () => {
    const names = [
      ["GPSLatitude", "location"], ["PersonInImage", "person"], ["Creator", "creator"], ["ContactInfo", "contact"],
      ["BodySerialNumber", "serial-identifier"], ["LensModel", "device-identifier"], ["DateTimeOriginal", "timestamp"],
      ["DocumentID", "document-identifier"], ["ImageRegion", "region"], ["AIPromptInformation", "prompt"],
      ["AISystemUsed", "workflow"], ["JPEGInterchangeFormat", "embedded-preview"], ["CopyrightNotice", "descriptive"],
    ] as const;
    const result = {
      fields: names.map(([name], index) => ({
        id: `fixture:${index}`,
        ifd: "EXIF",
        tag: index,
        name,
        type: "ASCII",
        value: `sentinel-${index}`,
        raw: `sentinel-${index}`,
        known: true,
        source: { blockId: "fixture:block", valueOffset: 100 + index, valueLength: 10 },
      })),
      exif: null,
      iptcSemantic: null,
      xmp: null,
    } as unknown as MetadataResult;
    const inspection = inspectSemanticPrivacyDetailed(result, DEFAULT_LIMITS);
    const categories = new Set(inspection.findings.map((finding) => finding.category));
    for (const [, category] of names) expect(categories.has(category)).toBe(true);
    expect(inspection.findings).toHaveLength(names.length);
    for (const finding of inspection.findings) {
      expect(finding.state).toBe("decoded-finding");
      expect(finding.blockId).toBe("fixture:block");
      expect(finding.sourceOffset).toEqual(expect.any(Number));
      expect(finding.sourceLength).toBe(10);
      expect(finding.reason.length).toBeGreaterThan(0);
    }
  });

  it("reports exact decoded XMP identity and keeps raw values out of default serialization", async () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:private="https://private.example/ns/"><rdf:RDF><rdf:Description rdf:about=""><photoshop:City>Secret City</photoshop:City><private:WorkflowJSON>{&quot;token&quot;:&quot;do-not-leak&quot;}</private:WorkflowJSON></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const audit = await auditPrivacy(jpegWithXmp(packet));
    const serialized = JSON.stringify(audit);
    expect(audit.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ localName: "City", category: "location", state: "decoded-finding", namespaceUri: "http://ns.adobe.com/photoshop/1.0/" }),
      expect.objectContaining({ localName: "WorkflowJSON", category: "unknown-xmp", state: "decoded-finding", namespaceUri: "https://private.example/ns/" }),
    ]));
    const city = audit.findings.find((finding) => finding.localName === "City");
    expect(city?.sourceOffset).toEqual(expect.any(Number));
    expect(city?.sourceLength).toBeGreaterThan(0);
    expect(serialized).not.toContain("Secret City");
    expect(serialized).not.toContain("do-not-leak");
    const humanProjection = audit.findings.map(({ target, category, state, message }) => `| ${target} | ${category} | ${state} | ${message} |`).join("\n");
    const diagnostics = JSON.stringify({ gaps: audit.gaps, warnings: audit.warnings, reasonCodes: audit.reasonCodes });
    expect(humanProjection).not.toContain("Secret City");
    expect(humanProjection).not.toContain("do-not-leak");
    expect(diagnostics).not.toContain("Secret City");
    expect(diagnostics).not.toContain("do-not-leak");

    const explicit = await auditPrivacy(jpegWithXmp(packet), { includeRawValues: true });
    expect(JSON.stringify(explicit)).toContain("Secret City");
  });

  it("keeps opaque JPEG blocks as explicit high-risk findings", async () => {
    const base = jpegWithXmp(`<x:xmpmeta xmlns:x="adobe:ns:meta/"/>`);
    const opaque = new Uint8Array(base.length + 8);
    opaque.set(base.subarray(0, 2));
    opaque.set([0xff, 0xef, 0, 4, 1, 2], 2);
    opaque.set(base.subarray(2), 8);
    const audit = await auditPrivacy(opaque);
    expect(audit.findings).toContainEqual(expect.objectContaining({ category: "opaque-block", state: "opaque-risk", sensitivity: "high" }));
    expect(audit.safe).toBe(false);
  });
});

describe("T02 immutable privacy policies", () => {
  it("publishes every named versioned preset as immutable data", () => {
    const ids = ["share-safe", "location-safe", "anonymous", "retain-rights", "publisher", "accessibility", "forensic-preserve"] as const;
    expect(Object.keys(PRIVACY_POLICY_PRESETS).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const policy = getPrivacyPolicy(id);
      expect(policy.id).toBe(id);
      expect(policy.version).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(Object.isFrozen(policy)).toBe(true);
      expect(Object.isFrozen(policy.removeCategories)).toBe(true);
      expect(Object.isFrozen(policy.reviewedSensitiveFieldIds)).toBe(true);
      expect(Object.isFrozen(policy.removalFieldIds)).toBe(true);
      expect(Object.isFrozen(policy.removalFamilies)).toBe(true);
      expect(Object.isFrozen(policy.removalNamespaceProperties)).toBe(true);
      expect(policy.changeLog.length).toBeGreaterThan(0);
      expect(getPrivacyPolicyRegistryCoverage(policy)).toMatchObject({ complete: true, reviewedRegistryHashMatches: true });
    }
  });

  it("returns a policy report with exact identity and refuses strict output on opaque coverage", async () => {
    const base = jpegWithXmp(`<x:xmpmeta xmlns:x="adobe:ns:meta/"/>`);
    const opaque = new Uint8Array(base.length + 8);
    opaque.set(base.subarray(0, 2));
    opaque.set([0xff, 0xef, 0, 4, 1, 2], 2);
    opaque.set(base.subarray(2), 8);
    const audit = await auditPrivacy(opaque);
    const policy = getPrivacyPolicy("share-safe");
    const report = evaluatePrivacyPolicy(audit, policy);
    expect(report.policyId).toBe("share-safe");
    expect(report.policyVersion).toBe(policy.version);
    expect(report.passed).toBe(false);
    expect(report.blockedFindings.some((finding) => finding.state === "policy-violation")).toBe(true);
    const result = await sanitizeMetadata(opaque, { policy: "share-safe" });
    expect(result.successful).toBe(false);
    expect(result.data).toBeNull();
    expect(result.policy).toMatchObject({ policyId: "share-safe", policyVersion: policy.version });
  });

  it("removes an exact sensitive XMP field under a named policy", async () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"><rdf:RDF><rdf:Description rdf:about=""><photoshop:City>Secret City</photoshop:City></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const result = await sanitizeMetadata(jpegWithXmp(packet), { policy: "location-safe" });
    expect(result.successful).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.policy).toMatchObject({ policyId: "location-safe", passed: true });
  });

  it("executes every named policy through its public report contract", async () => {
    const ids = ["share-safe", "location-safe", "anonymous", "retain-rights", "publisher", "accessibility", "forensic-preserve"] as const;
    const input = jpegWithXmp(`<x:xmpmeta xmlns:x="adobe:ns:meta/"/>`);
    for (const id of ids) {
      const result = await sanitizeMetadata(input, { policy: id });
      expect(result.policy?.policyId).toBe(id);
      expect(result.policy?.policyVersion).toBe("1.0.0");
      if (id === "forensic-preserve") {
        expect(result.successful).toBe(true);
        expect(result.data).toEqual(input);
      }
    }
  });

  it("proves each preset's removal/retention treatment through exact-field round trips", async () => {
    const packet = `<x:xmpmeta xmlns:x="adobe:ns:meta/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:RDF><rdf:Description rdf:about=""><photoshop:City>Secret City</photoshop:City><dc:creator>Creator Name</dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const ids = ["share-safe", "location-safe", "anonymous", "retain-rights", "publisher", "accessibility", "forensic-preserve"] as const;
    for (const id of ids) {
      const result = await sanitizeMetadata(jpegWithXmp(packet), { policy: id });
      expect(result.policy?.policyId).toBe(id);
      expect(result.policy?.passed).toBe(true);
      expect(result.successful).toBe(true);
      if (result.data === null) throw new Error(`Expected ${id} to produce output for the complete fixture.`);
      if (id === "forensic-preserve") {
        expect(result.data).toEqual(jpegWithXmp(packet));
        continue;
      }
      const reparsed = await auditPrivacy(result.data);
      expect(reparsed.findings.some((finding) => finding.localName === "City")).toBe(false);
      const creatorPresent = reparsed.findings.some((finding) => finding.localName === "creator");
      expect(creatorPresent).toBe(id === "location-safe" || id === "retain-rights" || id === "publisher");
    }
  });

  it("fails registry coverage when a newly recognized sensitive field is not explicitly reviewed", async () => {
    const input = jpegWithXmp(`<x:xmpmeta xmlns:x="adobe:ns:meta/"/>`);
    const audit = await auditPrivacy(input);
    const synthetic = createMetadataRegistry([{ id: "IFD0:0x9999", ifd: "IFD0", tag: 0x9999, name: "NewSensitiveField", sensitivity: "high" }]);
    const policy = getPrivacyPolicy("share-safe");
    const coverage = getPrivacyPolicyRegistryCoverage(policy, synthetic);
    expect(coverage.complete).toBe(false);
    expect(coverage.missingSensitiveFieldIds).toContain("IFD0:0x9999");
    const report = evaluatePrivacyPolicy(audit, policy, synthetic);
    expect(report.complete).toBe(false);
    expect(report.passed).toBe(false);
  });
});
