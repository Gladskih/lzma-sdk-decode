import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { npmCommand } from "./npm-command.mjs";

const pkg = JSON.parse(await readFile("package.json"));
const pack = JSON.parse(await readFile("pack-result.json"))[0];
const response = await fetch(`https://registry.npmjs.org/${pkg.name}/${pkg.version}`);
if (response.status === 404) {
  const [command, ...prefix] = npmCommand();
  execFileSync(command, [...prefix, "publish", pack.filename, "--ignore-scripts",
    "--access", "public", "--provenance"], { stdio: "inherit" });
} else {
  assert.equal(response.ok, true, `Registry HTTP ${response.status}`);
  const published = await response.json();
  assert.equal(published.dist.integrity, pack.integrity,
    "Published version differs from the tested artifact; never overwrite or silently skip it");
  console.warn("Identical version already exists in npm.");
}
