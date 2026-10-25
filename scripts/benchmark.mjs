import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createDecoder } from "../dist/node.js";

const [file, baselineModule, destination = ".build/benchmark.json"] = process.argv.slice(2);
if (!file || !baselineModule) throw new Error("Usage: benchmark.mjs GPU-Z.exe upx-lzma.ts [report.json]");
const original = await readFile(file);
// The benchmark harness reads UPX metadata; the distributed decoder never sees it.
const offset = original.indexOf(Buffer.from("UPX!"));
assert.equal(original[offset + 6], 14, "Expected an UPX LZMA fixture");
const size = original.readUInt32LE(offset + 16);
const packedSize = original.readUInt32LE(offset + 20);
const packed = original.subarray(offset + 32, offset + 32 + packedSize);
const dictionary = size; // GPU-Z uses UPX level 10: dictionary equals unpack size.
assert.equal(original[offset + 7] & 15, 10);
const properties = Uint8Array.of((packed[0] & 7) * 45 + (packed[1] >>> 4) * 9 +
  (packed[1] & 15), dictionary & 255, dictionary >>> 8 & 255,
  dictionary >>> 16 & 255, dictionary >>> 24);
const started = performance.now();
const decoder = await createDecoder();
const initializationMs = performance.now() - started;
const { decompressUpxLzma } = await import(pathToFileURL(baselineModule).href);
const runs = [];
let expectedHash;
for (const name of ["baseline", "sdk", "sdk", "baseline", "baseline", "sdk"]) {
  const start = performance.now();
  let data;
  if (name === "baseline") data = await decompressUpxLzma(packed, size, 10);
  else {
    const decoded = decoder.decodeLzma(packed.subarray(2), properties, size);
    assert.equal(decoded.resultCode, 0);
    assert.equal(decoded.bytesRead, packedSize - 2);
    assert.equal(decoded.status, 4); // UPX stream finishes without an end marker.
    data = decoded.data;
  }
  const ms = performance.now() - start;
  assert.equal(data.length, size);
  const sha256 = createHash("sha256").update(data).digest("hex");
  expectedHash ??= sha256;
  assert.equal(sha256, expectedHash);
  runs.push({ name, ms, sha256 });
  console.warn(`${name}: ${ms.toFixed(1)} ms; sha256=${sha256}`);
}
const report = { node: process.version, initializationMs, packedSize, unpackedSize: size,
  inputSha256: createHash("sha256").update(original).digest("hex"), runs };
await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
