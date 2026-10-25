import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json"));
const info = JSON.parse(await readFile("dist/build-info.json"));
assert.equal(info.packageVersion, pkg.version);
assert.deepEqual(info.upstream, JSON.parse(await readFile("upstream.json")));
assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0, "No runtime dependencies");
for (const [file, expected] of Object.entries(info.files)) {
  const bytes = await readFile(`dist/${file}`);
  assert.equal(bytes.length, expected.bytes, file);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.sha256, file);
}
const { default: createModule } = await import("../dist/lzma-sdk-decode.js");
const native = await createModule({ wasmBinary: await readFile("dist/lzma-sdk-decode.wasm") });
assert.equal(typeof native._decode_lzma, "function");
assert.equal(typeof native._decode_lzma2, "function");
assert.ok(!Object.keys(native).some(name => /encode|archive|extract|fopen/i.test(name)));
for (const name of await readdir("dist")) {
  if (!name.endsWith(".js")) continue;
  assert.doesNotMatch(await readFile(`dist/${name}`, "utf8"), /data:application\/wasm;base64/);
}
for (const file of ["LICENSE", "THIRD_PARTY_NOTICES.md", "licenses/LZMA-SDK.txt",
  "licenses/emscripten-LICENSE.txt", "licenses/musl.txt", "licenses/compiler-rt.txt"]) {
  assert.ok((await readFile(file)).length > 0, file);
}
console.warn("Verified runtime-free package, native exports, artifact hashes and licenses.");
