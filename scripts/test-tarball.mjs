import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { npmCommand } from "./npm-command.mjs";

const pack = JSON.parse(await readFile("pack-result.json"))[0];
const tarball = resolve(pack.filename);
const temporary = await mkdtemp(join(tmpdir(), "lzma-sdk-decode-"));
async function removeTemporary() {
  if (dirname(await realpath(temporary)) !== await realpath(tmpdir())) {
    throw new Error("Refusing to delete outside the temporary root");
  }
  await rm(temporary, { recursive: true, force: true });
}
try {
  const [command, ...prefix] = npmCommand();
  execFileSync(command, [...prefix, "install", "--offline", "--ignore-scripts", "--no-audit",
    "--no-fund", tarball], { cwd: temporary, stdio: "pipe" });
  await writeFile(join(temporary, "smoke.mjs"), `
    import assert from "node:assert/strict";
    import { createDecoder } from "lzma-sdk-decode";
    import { readFile } from "node:fs/promises";
    const asset = import.meta.resolve("lzma-sdk-decode/lzma-sdk-decode.wasm");
    const info = JSON.parse(await readFile(new URL(import.meta.resolve("lzma-sdk-decode/build-info.json"))));
    assert.equal(info.upstream.version, "26.05");
    const api = await createDecoder();
    const input = Uint8Array.of(1, 0, 3, 68, 65, 84, 65, 0);
    const expected = {data:Uint8Array.of(68,65,84,65),bytesRead:8,resultCode:0,status:1};
    assert.deepEqual(api.decodeLzma2(input, 0, 4), expected);
    assert.deepEqual((await createDecoder({wasmBinary:await readFile(new URL(asset))}))
      .decodeLzma2(input,0,4), expected);
  `);
  execFileSync(process.execPath, ["smoke.mjs"], { cwd: temporary, stdio: "pipe" });
  assert.ok(pack.files.some(file => file.path === "dist/index.d.ts"));
  assert.ok(pack.files.some(file => file.path === "licenses/LZMA-SDK.txt"));
  assert.ok(!pack.files.some(file => /^(native|test|scripts|\.build)\//.test(file.path)));
} finally {
  await removeTemporary();
}
console.warn(`Installed and tested the exact tarball: ${pack.filename}`);
