import assert from "node:assert/strict";
import { test } from "node:test";
import { createDecoder } from "../src/node.js";
import { lzma, lzma2, plain, properties } from "./vectors.mjs";

test("original SDK decodes raw LZMA and LZMA2 with exact stream consumption", async () => {
  const api = await createDecoder();
  const first = api.decodeLzma(lzma, properties, plain.length);
  const second = api.decodeLzma2(lzma2, 0, plain.length);
  assert.deepEqual(first, { data: plain, bytesRead: lzma.length, resultCode: 0, status: 1 });
  assert.deepEqual(second, { data: plain, bytesRead: lzma2.length, resultCode: 0, status: 1 });
});

test("SDK reports trailing input without consuming it", async () => {
  const api = await createDecoder();
  assert.equal(api.decodeLzma(new Uint8Array([...lzma, 42]), properties, 4).bytesRead, lzma.length);
  assert.equal(api.decodeLzma2(new Uint8Array([...lzma2, 42]), 0, 4).bytesRead, lzma2.length);
});

test("SDK rejects truncated, invalid and undersized streams then remains reusable", async () => {
  const api = await createDecoder();
  assert.notEqual(api.decodeLzma(lzma.subarray(0, 3), properties, 4).resultCode, 0);
  assert.notEqual(api.decodeLzma(lzma, Uint8Array.of(255, 0, 0, 0, 0), 4).resultCode, 0);
  assert.notEqual(api.decodeLzma2(lzma2, 41, 4).resultCode, 0);
  assert.notEqual(api.decodeLzma2(lzma2.subarray(0, 4), 0, 4).resultCode, 0);
  assert.notEqual(api.decodeLzma2(lzma2, 0, 3).resultCode, 0);
  assert.deepEqual(api.decodeLzma2(lzma2, 0, 4).data, plain);
});

test("empty LZMA2 and binary output are preserved", async () => {
  const api = await createDecoder();
  assert.deepEqual(api.decodeLzma2(Uint8Array.of(0), 0, 0),
    { data: new Uint8Array(), bytesRead: 1, resultCode: 0, status: 1 });
  assert.deepEqual(api.decodeLzma2(Uint8Array.of(1, 0, 2, 255, 254, 253, 0), 0, 3).data,
    Uint8Array.of(255, 254, 253));
});
