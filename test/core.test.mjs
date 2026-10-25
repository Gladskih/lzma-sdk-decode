import assert from "node:assert/strict";
import { test } from "node:test";
import { createApi } from "../dist/core.js";
import { plain, properties } from "./vectors.mjs";

function fixture() {
  const module = { HEAPU8: new Uint8Array(1024), frees: [], _malloc: () => 32,
    _free: pointer => module.frees.push(pointer) };
  function decode(input, size, property, output, capacity, summary) {
    module.HEAPU8.set(plain.subarray(0, capacity), output);
    const view = new DataView(module.HEAPU8.buffer, summary, 12);
    view.setUint32(0, size, true);
    view.setUint32(4, Math.min(capacity, plain.length), true);
    view.setUint32(8, 1, true);
    return 0;
  }
  module._decode_lzma = decode;
  module._decode_lzma2 = decode;
  return { module, api: createApi(module) };
}

test("wrapper copies only actual output and frees its working allocation", () => {
  const { module, api } = fixture();
  assert.deepEqual(api.decodeLzma(plain, properties, 8).data, plain);
  assert.deepEqual(api.decodeLzma2(plain, 0, 8).data, plain);
  assert.deepEqual(module.frees, [32, 32]);
  assert.ok(Object.isFrozen(api));
});

for (const invalid of [null, "bytes", [], new DataView(new ArrayBuffer(1))]) {
  test(`rejects non-byte inputs ${String(invalid)}`, () => {
    const { api } = fixture();
    assert.throws(() => api.decodeLzma(invalid, properties, 0), TypeError);
    assert.throws(() => api.decodeLzma(plain, invalid, 0), TypeError);
  });
}

for (const invalid of [-1, 0.5, NaN, Infinity, 2 ** 32]) {
  test(`rejects invalid wasm32 output sizes ${invalid}`, () => {
    assert.throws(() => fixture().api.decodeLzma2(plain, 0, invalid), RangeError);
  });
}

for (const invalid of [-1, 0.5, NaN, Infinity, 256]) {
  test(`rejects non-byte LZMA2 property ${invalid}`, () => {
    assert.throws(() => fixture().api.decodeLzma2(plain, invalid, 0), RangeError);
  });
}

test("rejects LZMA property lengths and impossible combined address ranges", () => {
  const { api } = fixture();
  assert.throws(() => api.decodeLzma(plain, new Uint8Array(4), 0), RangeError);
  assert.throws(() => api.decodeLzma2(plain, 0, 0xffffffff), RangeError);
  assert.deepEqual(api.decodeLzma2(new Uint8Array(), 255, 0).data, new Uint8Array());
});

test("a normal allocation failure does not quarantine the decoder", () => {
  const { module, api } = fixture();
  module._malloc = () => 0;
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /allocate/);
  module._malloc = () => 32;
  assert.deepEqual(api.decodeLzma2(plain, 0, 4).data, plain);
});

test("invalid allocation ranges quarantine the instance", () => {
  const { module, api } = fixture();
  module._malloc = () => -1;
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /memory range/);
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /fatal WASM/);
  assert.deepEqual(module.frees, []);
});

for (const [field, value] of [[0, 5], [4, 5], [8, 5]]) {
  test(`invalid SDK summary field ${field} quarantines the instance`, () => {
    const { module, api } = fixture();
    const decode = module._decode_lzma2;
    module._decode_lzma2 = (...args) => {
      const result = decode(...args);
      new DataView(module.HEAPU8.buffer).setUint32(args[5] + field, value, true);
      return result;
    };
    assert.throws(() => api.decodeLzma2(plain, 0, 4), /invalid decode result/);
    assert.throws(() => api.decodeLzma2(plain, 0, 4), /fatal WASM/);
    assert.deepEqual(module.frees, []);
  });
}

test("native traps quarantine the decoder without invoking a possibly corrupt allocator", () => {
  const { module, api } = fixture();
  module._decode_lzma2 = () => { throw new WebAssembly.RuntimeError("trap"); };
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /trap/);
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /fatal WASM/);
  assert.deepEqual(module.frees, []);
});

test("allocation traps quarantine the decoder", () => {
  const { module, api } = fixture();
  module._malloc = () => { throw new WebAssembly.RuntimeError("allocation trap"); };
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /allocation trap/);
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /fatal WASM/);
});

test("release traps quarantine the decoder", () => {
  const { module, api } = fixture();
  module._free = () => { throw new WebAssembly.RuntimeError("release trap"); };
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /release trap/);
  assert.throws(() => api.decodeLzma2(plain, 0, 4), /fatal WASM/);
});
