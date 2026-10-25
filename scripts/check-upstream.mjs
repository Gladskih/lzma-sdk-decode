import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const pin = JSON.parse(await readFile("upstream.json"));
const releases = JSON.parse(execFileSync("gh", ["api", "repos/ip7z/7zip/releases"], { encoding: "utf8" }));
const stable = releases.find(release => !release.prerelease && !release.draft && /^\d+\.\d+$/.test(release.tag_name));
assert.ok(stable, "No stable upstream release found");
if (stable.tag_name !== pin.tag) {
  const title = `Update LZMA SDK to ${stable.tag_name}`;
  const existing = JSON.parse(execFileSync("gh", ["issue", "list", "--search", `${title} in:title`,
    "--state", "open", "--json", "title"], { encoding: "utf8" }));
  if (!existing.some(issue => issue.title === title)) {
    execFileSync("gh", ["issue", "create", "--title", title, "--body",
      `Official upstream release: ${stable.html_url}\n\nUpdate the immutable source pin and hashes, then run native differential, wrapper, browser and exact-package checks before release.`], { stdio: "inherit" });
  }
} else console.warn(`Pinned SDK ${pin.tag} is the current stable release.`);
