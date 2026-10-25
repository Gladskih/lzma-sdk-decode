import { test, expect } from "@playwright/test";

test("raw LZMA2 loads under strict CSP using only local assets", async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on("request", request => requests.push(request.url()));
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/test/browser.html");
  const result = await page.evaluate(async () => {
    const { createDecoder } = await import("/dist/browser.js");
    const decoder = await createDecoder();
    const decoded = decoder.decodeLzma2(Uint8Array.of(1, 0, 3, 68, 65, 84, 65, 0), 0, 4);
    return { ...decoded, data: Array.from(decoded.data) };
  });
  expect(result).toEqual({ data: [68, 65, 84, 65], bytesRead: 8, resultCode: 0, status: 1 });
  expect(requests.filter(url => url.endsWith(".wasm"))).toHaveLength(1);
  expect(requests.every(url => url.startsWith("http://127.0.0.1:4198/"))).toBe(true);
  expect(errors).toEqual([]);
});

test("provided WASM bytes decode offline", async ({ page }) => {
  await page.goto("/test/browser.html");
  await page.evaluate(async () => {
    window.binary = new Uint8Array(await (await fetch("/dist/lzma-sdk-decode.wasm")).arrayBuffer());
    window.createDecoder = (await import("/dist/browser.js")).createDecoder;
  });
  await page.context().setOffline(true);
  const result = await page.evaluate(async () => (await window.createDecoder({ wasmBinary: window.binary }))
    .decodeLzma2(Uint8Array.of(0), 0, 0).resultCode);
  expect(result).toBe(0);
});

test("module Worker decodes raw bytes", async ({ page }) => {
  await page.goto("/test/browser.html");
  const result = await page.evaluate(() => new Promise((resolve, reject) => {
    const worker = new Worker("/test/worker.mjs", { type: "module" });
    worker.onerror = reject;
    worker.onmessage = event => { resolve(Array.from(event.data.data)); worker.terminate(); };
  }));
  expect(result).toEqual([68, 65, 84, 65]);
});
