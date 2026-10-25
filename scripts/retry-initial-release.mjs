import assert from "node:assert/strict";
import { appendFile } from "node:fs/promises";
import { initialReleaseState } from "./initial-release-state.mjs";

const response = await fetch("https://registry.npmjs.org/lzma-sdk-decode/0.1.0");
assert.ok(response.ok || response.status === 404, `Registry HTTP ${response.status}`);
if (response.ok) {
  const published = await response.json();
  assert.equal(published.dist.integrity,
    "sha512-UrbUjXT3d+0KnYANKFM0+Vff558dehw44BQ/2UIFsUvU295tWsPx003BBaUP9VqmEUeHePyVmDW8X90JRukO/w==",
    "The public version must match the tested tagged artifact");
}
const state = initialReleaseState(Date.now(), response.ok);
console.warn(`Initial release retry: ${state}. npm hold ends 2026-10-26T20:50:12.845Z.`);
if (state === "expired") throw new Error("Initial release recovery window expired; inspect npm authorization.");
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `ready=${state === "ready"}\n`);
}
