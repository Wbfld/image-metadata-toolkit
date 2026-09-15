export function validateSourceUrl(value: string): URL;
export function safeTarget(rootDirectory: string, relativePath: string): string;
export function prepareReleaseCorpora(destinationRoot: string): Promise<{
  root: string;
  raw: { b04: string; b05: string; b08: string; fixtureCount: number; uniqueDownloads: number };
  svg: { svg: string; fixtureCount: number; archiveSha256: string };
  downloadedBytes: number;
}>;
