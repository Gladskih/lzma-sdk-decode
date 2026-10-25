import { loadDecoder } from "./load.js";

export async function createDecoder({ wasmBinary, wasmURL } = {}) {
  if (wasmBinary !== undefined) return loadDecoder(wasmBinary);
  const response = await fetch(wasmURL ?? new URL("./lzma-sdk-decode.wasm", import.meta.url));
  if (!response.ok) throw new Error(`Could not load LZMA SDK WASM: HTTP ${response.status}`);
  return loadDecoder(new Uint8Array(await response.arrayBuffer()));
}
