/** IPTC-IIM and IPTC Photo Metadata serialization entry point. */
export { IPTC_IIM_DATASETS, parseIptc, parseIptcMetadata, inspectIptc } from "./metadata/iptc.js";
export { IptcSerializationError, IptcSynchronizationError, serializeIptcIim, serializePhotoshopIptcResources, synchronizeIptcXmp } from "./metadata/serialization.js";
export type { IptcIimEncoding, IptcIimFieldInput, IptcIimSerializeOptions, IptcInvalidValuePolicy, IptcSynchronizationConflict, IptcSynchronizationPolicy, IptcXmpSynchronizationInput, IptcXmpSynchronizationOptions, IptcXmpSynchronizationResult, PhotoshopIptcResourceOptions } from "./metadata/serialization.js";
