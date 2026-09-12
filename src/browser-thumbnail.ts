import { getThumbnail } from "./convenience.js";
import type { MetadataResult } from "./types.js";

export interface ThumbnailObjectUrl {
  readonly url: string;
  /** MIME type retained from the source thumbnail and used for Blob creation. */
  readonly mimeType: string;
  /** Explicit, idempotent lifecycle operation. The caller owns URL revocation. */
  revoke(): void;
}

/** Create a browser object URL for a retained EXIF thumbnail. This entry point is intentionally not exported by the core module. */
export function createThumbnailObjectUrl(result: MetadataResult): ThumbnailObjectUrl | null {
  const retained = (result.exif as { readonly thumbnail?: unknown } | null | undefined)?.thumbnail;
  if (retained === null || retained === undefined || typeof retained !== "object") return null;
  const candidate = retained as { readonly data?: unknown; readonly mimeType?: unknown };
  if (!(candidate.data instanceof Uint8Array) || typeof candidate.mimeType !== "string") return null;
  const thumbnail = getThumbnail(result);
  const urlApi = typeof globalThis.URL === "undefined" ? undefined : globalThis.URL;
  if (thumbnail === null || urlApi === undefined || typeof urlApi.createObjectURL !== "function" || typeof globalThis.Blob !== "function") return null;
  let url: string;
  try {
    const data = new Uint8Array(thumbnail.data).buffer;
    const created = urlApi.createObjectURL(new globalThis.Blob([data], { type: thumbnail.mimeType }));
    if (typeof created !== "string" || created.length === 0) return null;
    url = created;
  } catch {
    // Blob construction and object URL creation are host APIs; malformed or
    // unsupported browser implementations must fail closed without leaking.
    return null;
  }
  let revoked = false;
  return {
    url,
    mimeType: thumbnail.mimeType,
    revoke() {
      if (revoked) return;
      revoked = true;
      try { urlApi.revokeObjectURL(url); } catch { /* lifecycle remains idempotent */ }
    },
  };
}
