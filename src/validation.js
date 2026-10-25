export function validateBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Expected a Uint8Array.");
}

export function validateSize(size) {
  if (!Number.isInteger(size) || size < 0 || size > 0xffffffff) {
    throw new RangeError("Size is outside the wasm32 address space.");
  }
}

export function validateProperties(properties) {
  validateBytes(properties);
  if (properties.byteLength !== 5) throw new RangeError("LZMA properties must contain 5 bytes.");
}

export function validateProperty(property) {
  if (!Number.isInteger(property) || property < 0 || property > 255) {
    throw new RangeError("LZMA2 property must be a byte.");
  }
}
