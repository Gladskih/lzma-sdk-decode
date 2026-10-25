import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const mutations = [
  ["core.js", "bytesRead > inputSize", "false"],
  ["core.js", "written > capacity", "false"],
  ["core.js", "status > 4", "false"],
  ["core.js", "failed = true", "failed = false"],
  ["core.js", "if (failed)", "if (false)"],
  ["core.js", "if (!pointer)", "if (false)"],
  ["core.js", "pointer > module.HEAPU8.byteLength - size", "false"],
  ["core.js", "module._free(pointer);", "void pointer;"],
  ["validation.js", "size < 0", "false"],
  ["validation.js", "size > 0xffffffff", "false"],
  ["validation.js", "properties.byteLength !== 5", "false"],
  ["validation.js", "property > 255", "false"],
  ["browser.js", "if (!response.ok)", "if (false)"],
];
for (const [file, original, replacement] of mutations) {
  const path = `dist/${file}`;
  const source = await readFile(path, "utf8");
  assert.ok(source.includes(original), `Mutation no longer matches ${file}: ${original}`);
  try {
    await writeFile(path, source.replace(original, replacement));
    const result = spawnSync(process.execPath, ["--test", "test/core.test.mjs",
      "test/loading.test.mjs"], { encoding: "utf8", timeout: 15000 });
    assert.equal(result.signal, null, `Mutation timed out: ${file}: ${original}`);
    assert.notEqual(result.status, 0, `Survived: ${file}: ${original}`);
  } finally {
    await writeFile(path, source);
  }
}
console.warn(`Killed all ${mutations.length} focused wrapper safety mutations.`);
