import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createDecoder } from "../dist/node.js";

const api = await createDecoder();
const cases = JSON.parse(await readFile(".build/corpus/index.json"));
let count = 0;
for (const { name, method, size } of cases) {
  const base = `.build/corpus/${name}`;
  const input = await readFile(`${base}.packed`);
  const properties = await readFile(`${base}.props`);
  const expected = await readFile(`${base}.plain`);
  const variants = [input, input.subarray(0, Math.max(0, input.length - 1)),
    new Uint8Array([...input, 42]), Uint8Array.from(input, (byte, i) => i === 2 ? byte ^ 128 : byte)];
  for (const bytes of variants) {
    await writeFile(".build/corpus/input.bin", bytes);
    const native = JSON.parse(execFileSync(".build/oracle", [method, ".build/corpus/input.bin",
      `${base}.props`, String(size), ".build/corpus/output.bin"], { encoding: "utf8" }));
    const wasm = method === "lzma" ? api.decodeLzma(bytes, properties, size)
      : api.decodeLzma2(bytes, properties[0], size);
    assert.deepEqual({ resultCode: wasm.resultCode, status: wasm.status,
      bytesRead: wasm.bytesRead, written: wasm.data.length }, native, name);
    assert.deepEqual(wasm.data, new Uint8Array(await readFile(".build/corpus/output.bin")), name);
    if (bytes === input) assert.deepEqual(wasm.data, new Uint8Array(expected), name);
    count++;
  }
}
console.warn(`${count} raw-stream comparisons match the unchanged ASan/UBSan SDK oracle.`);
