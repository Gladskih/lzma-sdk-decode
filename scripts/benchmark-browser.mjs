import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const [file, url = "http://127.0.0.1:4197", destination = ".build/benchmark-browser.json"] = process.argv.slice(2);
if (!file) throw new Error("Usage: benchmark-browser.mjs GPU-Z.exe [binary101-dev-URL] [report.json]");
const adapter = `
import {createDecoder} from "/__sdk/browser.js";
let decoder;
export async function decompressLzmaWithPropertiesTracked(properties, input, size) {
  decoder ??= createDecoder({wasmURL:"/__sdk/lzma-sdk-decode.wasm"});
  const result = (await decoder).decodeLzma(input, new Uint8Array(properties), Number(size));
  if (result.resultCode !== 0 || ![1,4].includes(result.status)) throw new Error("SDK decode failed");
  if (result.data.length !== Number(size)) throw new Error("SDK output size mismatch");
  return {bytes:result.data, consumedPackedBytes:result.bytesRead};
}
export async function decompressLzmaWithProperties(properties,input,size) {
  return (await decompressLzmaWithPropertiesTracked(properties,input,size)).bytes;
}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/__sdk/*", async route => {
    const name = new URL(route.request().url()).pathname.split("/").at(-1);
    assert.match(name, /^[a-z-]+\.(js|wasm)$/);
    await route.fulfill({ body: await readFile(`dist/${name}`),
      contentType: name.endsWith(".wasm") ? "application/wasm" : "text/javascript" });
  });
  const runs = [];
  for (const mode of ["baseline", "sdk", "sdk", "baseline", "baseline", "sdk"]) {
    await page.unroute("**/analyzers/sevenz/lzma.ts");
    if (mode === "sdk") await page.route("**/analyzers/sevenz/lzma.ts", route =>
      route.fulfill({ contentType: "text/javascript", body: adapter }));
    await page.goto(url);
    await page.setInputFiles("#fileInput", file);
    await page.waitForFunction(() => document.querySelector("#fileAnalysisDurationDetail")?.textContent?.length > 0);
    const duration = await page.locator("#fileAnalysisDurationDetail").textContent();
    assert.match(await page.locator("body").textContent(), /UPX executable packer/);
    const run = { mode, duration };
    runs.push(run);
    console.warn(JSON.stringify(run));
  }
  assert.deepEqual(errors, []);
  await writeFile(destination, `${JSON.stringify({ browser: browser.version(), runs }, null, 2)}\n`);
} finally {
  await browser.close();
}
