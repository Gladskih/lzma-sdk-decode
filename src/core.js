import { validateBytes, validateProperties, validateProperty, validateSize } from "./validation.js";

function readResult(module, pointer, output, capacity, inputSize, resultCode) {
  const summary = new DataView(module.HEAPU8.buffer, pointer, 12);
  const bytesRead = summary.getUint32(0, true);
  const written = summary.getUint32(4, true);
  const status = summary.getUint32(8, true);
  if (bytesRead > inputSize || written > capacity || status > 4) {
    throw new Error("WASM returned an invalid decode result.");
  }
  return { data: module.HEAPU8.slice(output, output + written), bytesRead, resultCode, status };
}

export function createApi(module) {
  let failed = false;
  function run(input, properties, capacity, entry) {
    validateBytes(input);
    validateSize(capacity);
    const size = 12 + 5 + input.byteLength + capacity;
    validateSize(size);
    if (failed) throw new Error("Create a new decoder after a fatal WASM failure.");
    const pointer = module._malloc(size) >>> 0;
    if (!pointer) throw new Error("Unable to allocate WASM decode memory.");
    try {
      if (pointer > module.HEAPU8.byteLength - size) throw new Error("Invalid WASM memory range.");
      return invoke(module, pointer, input, properties, capacity, entry);
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      if (!failed) module._free(pointer);
    }
  }
  return Object.freeze({
    decodeLzma(input, properties, outputSize) {
      validateProperties(properties);
      return run(input, properties, outputSize, module._decode_lzma);
    },
    decodeLzma2(input, property, outputSize) {
      validateProperty(property);
      return run(input, property, outputSize, module._decode_lzma2);
    },
  });
}

function invoke(module, pointer, input, properties, capacity, entry) {
  const source = pointer + 17;
  const output = source + input.byteLength;
  module.HEAPU8.set(input, source);
  let argument = properties;
  if (properties instanceof Uint8Array) {
    argument = pointer + 12;
    module.HEAPU8.set(properties, argument);
  }
  const resultCode = entry(source, input.byteLength, argument, output, capacity, pointer);
  return readResult(module, pointer, output, capacity, input.byteLength, resultCode);
}
