import { source } from "./makernote-pack.js";

export const makerNoteReference = source(
  "exiv2-makernote-reference",
  "https://www.exiv2.org/makernote.html",
  "retrieved-2026-09-13",
  "GPL-2.0-or-later / Exiv2 documentation; corroborating reference only",
  "166c17756e3dcc5b501eb57adea9541ccd154d3ee125c8d237ba41d20f55cba4",
  "vendor",
);

export const rawPixlsIndex = source(
  "raw-pixls-us-filelist",
  "https://raw.pixls.us/data/filelist.sha256",
  "2026-09-13 index",
  "CC0-1.0 / contributor public-domain dedication as declared by raw.pixls.us",
  "768df432528714bc7e2d66666e4cb2ef33e8ba66b0f5d7408cb54fad94f028d8",
  "fixture",
);

export const rawPixlsLicense = "https://creativecommons.org/public-domain/cc0/";

export const fixtureSource = (id: string, url: string, sha256: string) => source(
  id,
  url,
  "raw.pixls.us filelist 2026-09-13",
  "CC0-1.0 / contributor public-domain dedication as declared by raw.pixls.us",
  sha256,
  "fixture",
);
