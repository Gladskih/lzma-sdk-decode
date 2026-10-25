import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test, mock } from "node:test";
import { createDecoder } from "../dist/node.js";
import { createDecoder as createBrowserDecoder } from "../dist/browser.js";
import { lzma2, plain } from "./vectors.mjs";

test("Node loads explicit binary bytes and an explicit WASM URL", async () => {
  const wasmURL = new URL("../dist/lzma-sdk-decode.wasm", import.meta.url);
  const wasmBinary = await readFile(wasmURL);
  assert.deepEqual((await createDecoder({ wasmBinary })).decodeLzma2(lzma2, 0, 4).data, plain);
  assert.deepEqual((await createDecoder({ wasmURL })).decodeLzma2(lzma2, 0, 4).data, plain);
});

test("browser loader uses local fetch and handles explicit bytes without fetch", async () => {
  const wasmBinary = await readFile(new URL("../dist/lzma-sdk-decode.wasm", import.meta.url));
  const fetch = mock.method(globalThis, "fetch", async () => new Response(wasmBinary));
  try {
    assert.deepEqual((await createBrowserDecoder()).decodeLzma2(lzma2, 0, 4).data, plain);
    assert.ok(fetch.mock.calls[0].arguments[0] instanceof URL);
    await createBrowserDecoder({ wasmURL: "custom.wasm" });
    assert.equal(fetch.mock.calls[1].arguments[0], "custom.wasm");
    await createBrowserDecoder({ wasmBinary });
    assert.equal(fetch.mock.callCount(), 2);
  } finally {
    fetch.mock.restore();
  }
});

test("browser loader rejects unsuccessful HTTP responses", async () => {
  const fetch = mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
  try {
    await assert.rejects(createBrowserDecoder(), /HTTP 404/);
  } finally {
    fetch.mock.restore();
  }
});
