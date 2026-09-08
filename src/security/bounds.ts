/** Byte order accepted by bounded multi-byte readers. */
export type ByteOrder = "little-endian" | "big-endian";

/** True when a value can safely be used as a non-negative byte offset or length. */
export function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Validate a half-open range without calculating `offset + length`, which could
 * overflow Number's safe-integer range.
 */
export function isValidRange(totalLength: number, offset: number, length: number): boolean {
  return (
    isNonNegativeSafeInteger(totalLength) &&
    isNonNegativeSafeInteger(offset) &&
    isNonNegativeSafeInteger(length) &&
    offset <= totalLength &&
    length <= totalLength - offset
  );
}

/** Assert that a half-open byte range is wholly contained in a buffer. */
export function assertRange(
  totalLength: number,
  offset: number,
  length: number,
  label = "byte range",
): void {
  if (!isValidRange(totalLength, offset, length)) {
    throw new RangeError(
      `${label} is out of bounds (offset ${offset}, length ${length}, available ${totalLength})`,
    );
  }
}

/** Add two non-negative integers, rejecting unsafe-integer overflow. */
export function checkedAdd(left: number, right: number, label = "integer addition"): number {
  if (!isNonNegativeSafeInteger(left) || !isNonNegativeSafeInteger(right)) {
    throw new RangeError(`${label} requires non-negative safe integers`);
  }

  const result = left + right;
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`${label} exceeds Number.MAX_SAFE_INTEGER`);
  }

  return result;
}

/** Multiply two non-negative integers, rejecting unsafe-integer overflow. */
export function checkedMultiply(left: number, right: number, label = "integer multiplication"): number {
  if (!isNonNegativeSafeInteger(left) || !isNonNegativeSafeInteger(right)) {
    throw new RangeError(`${label} requires non-negative safe integers`);
  }

  const result = left * right;
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`${label} exceeds Number.MAX_SAFE_INTEGER`);
  }

  return result;
}

/** Return a zero-copy, bounds-checked view into a byte array. */
export function subarrayChecked(
  bytes: Uint8Array,
  offset: number,
  length: number,
  label = "byte range",
): Uint8Array {
  assertRange(bytes.byteLength, offset, length, label);
  return bytes.subarray(offset, offset + length);
}

function littleEndian(byteOrder: ByteOrder): boolean {
  switch (byteOrder) {
    case "little-endian":
      return true;
    case "big-endian":
      return false;
    default:
      throw new TypeError("Unsupported byte order");
  }
}

function viewAt(bytes: Uint8Array, offset: number, length: number): DataView {
  assertRange(bytes.byteLength, offset, length, "binary read");
  const absoluteOffset = checkedAdd(bytes.byteOffset, offset, "binary read offset");
  return new DataView(bytes.buffer, absoluteOffset, length);
}

export function readUint8(bytes: Uint8Array, offset: number): number {
  return viewAt(bytes, offset, 1).getUint8(0);
}

export function readInt8(bytes: Uint8Array, offset: number): number {
  return viewAt(bytes, offset, 1).getInt8(0);
}

export function readUint16(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): number {
  return viewAt(bytes, offset, 2).getUint16(0, littleEndian(byteOrder));
}

export function readInt16(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): number {
  return viewAt(bytes, offset, 2).getInt16(0, littleEndian(byteOrder));
}

export function readUint32(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): number {
  return viewAt(bytes, offset, 4).getUint32(0, littleEndian(byteOrder));
}

export function readInt32(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): number {
  return viewAt(bytes, offset, 4).getInt32(0, littleEndian(byteOrder));
}

/** Read an unsigned 64-bit value exactly. */
export function readUint64(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): bigint {
  return viewAt(bytes, offset, 8).getBigUint64(0, littleEndian(byteOrder));
}

export function readFloat32(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): number {
  return viewAt(bytes, offset, 4).getFloat32(0, littleEndian(byteOrder));
}

export function readFloat64(bytes: Uint8Array, offset: number, byteOrder: ByteOrder): number {
  return viewAt(bytes, offset, 8).getFloat64(0, littleEndian(byteOrder));
}
