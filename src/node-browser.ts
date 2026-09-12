import { MetadataError, type MetadataResult } from "./types.js";
import type { NodeMetadataInput, NodeParseOptions } from "./node.js";

function unavailable(): MetadataError {
  return new MetadataError("UNSUPPORTED_FORMAT", "The browser-image-metadata/node entry is available only in Node.js.");
}

/** Browser-condition stub for the explicit Node-only entry point. */
export function parseMetadata(input: NodeMetadataInput, options?: NodeParseOptions): Promise<MetadataResult>;
export function parseMetadata(...args: [NodeMetadataInput?, NodeParseOptions?]): Promise<MetadataResult> {
  if (args.length === 0) return Promise.reject(unavailable());
  return Promise.reject(unavailable());
}

export const parseNodeMetadata = parseMetadata;
export const parseFileMetadata = parseMetadata;

export type { NodeByteStream, NodeFileHandle, NodeMetadataInput, NodeParseOptions, SeekableFileSource } from "./node.js";
