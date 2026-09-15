/* global document, location */
import data from "./generated/site-data.js";

const kind = location.pathname.match(/registry-([a-z]+)\.html/u)?.[1] ?? "exif";
const config = { exif: ["EXIF tags", "CIPA Exif 3.1 registry fields.", data.exif], iptc: ["IPTC datasets and properties", "IPTC Photo Metadata Standard 2025.1 properties and structured definitions.", data.iptc], xmp: ["XMP namespace mappings", "Mappings use namespace URI and local name; prefixes are display aliases only.", data.xmp], icc: ["ICC semantics", "Bounded ICC.1:2022 header and decoded semantic fields exposed by the package.", data.icc], policies: ["Privacy policies", "Named immutable policy outcomes and exact coverage requirements.", data.policies], selectors: ["Selectors", "Typed field, namespace, family, sensitivity, block, associated-image, and resource selectors.", data.selectors], capabilities: ["Capabilities", "Runtime, format, adapter, plugin, and security-limit capabilities from the checked-in manifest.", data.capabilities], formats: ["Formats", "Read, selection, redaction, and evidence boundaries from the capability manifest.", data.formats] };
const [title, description, entries] = config[kind] ?? config.exif;
document.title = `${title} · browser-image-metadata`;
document.querySelector("#page-title").textContent = title;
document.querySelector("#page-description").textContent = description;
const source = document.querySelector("#source-provenance");
if (source) {
  const lines = Object.entries(data.generatedFrom).map(([name, item]) => `${name}: ${item.edition ? `${item.edition}; ` : ""}${item.path}; sha256=${item.sha256}${item.url ? `; ${item.url}` : ""}`);
  source.textContent = lines.join("\n");
}
const list = document.querySelector("#registry-list"); const count = document.querySelector("#result-count"); const search = document.querySelector("#registry-search");
function display(entry) {
  const li = document.createElement("li"); const article = document.createElement("article"); const heading = document.createElement("h2");
  heading.id = `entry-${String(entry.id ?? entry.format).replace(/[^a-zA-Z0-9_-]/gu, "-")}`; const link = document.createElement("a"); link.href = `#${heading.id}`; link.textContent = entry.name ?? entry.format; heading.append(link); article.append(heading);
  const details = document.createElement("dl"); const values = [["Identity", entry.id ?? entry.format], ["Description", entry.description ?? entry.read ?? ""], ["Type", entry.type ?? entry.selectiveDecode ?? ""], ["Format", entry.format ?? entry.redaction ?? ""], ["Cardinality", entry.cardinality ?? ""], ["Version", entry.version ?? ""], ["Sensitivity", entry.sensitivity ?? ""], ["Namespace", entry.namespace ?? entry.container ?? ""], ["IIM mapping", entry.iim ?? ""], ["XMP mapping", entry.xmp ?? ""], ["Source", entry.source ?? entry.evidence?.positive ?? ""]];
  for (const [name, value] of values) { if (value === "" || value === null || value === undefined) continue; const dt = document.createElement("dt"); dt.textContent = name; const dd = document.createElement("dd"); dd.textContent = typeof value === "object" ? JSON.stringify(value) : String(value); details.append(dt, dd); } article.append(details); li.append(article); return li;
}
function render() { const query = search.value.trim().toLocaleLowerCase(); const visible = entries.filter((entry) => JSON.stringify(entry).toLocaleLowerCase().includes(query)); list.replaceChildren(...visible.map(display)); count.textContent = `${visible.length.toLocaleString()} of ${entries.length.toLocaleString()} entries`; }
search.addEventListener("input", render); document.querySelector("#clear-search").addEventListener("click", () => { search.value = ""; search.focus(); render(); }); render();
