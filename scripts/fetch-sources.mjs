import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const pin = JSON.parse(await readFile(new URL("../upstream.json", import.meta.url)));
for (const [path, expected] of Object.entries(pin.files)) {
  const destination = new URL(`../.build/sdk/${path}`, import.meta.url);
  let bytes = await readFile(destination).catch(() => null);
  if (bytes && createHash("sha256").update(bytes).digest("hex") === expected) continue;
  const response = await fetch(`https://raw.githubusercontent.com/ip7z/7zip/${pin.commit}/${path}`);
  if (!response.ok) throw new Error(`Source download failed: ${path} (HTTP ${response.status})`);
  bytes = new Uint8Array(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== expected) {
    throw new Error(`Source checksum mismatch: ${path}`);
  }
  await mkdir(new URL("./", destination), { recursive: true });
  await writeFile(destination, bytes);
}
console.warn(`Verified ${Object.keys(pin.files).length} pinned SDK source files.`);
