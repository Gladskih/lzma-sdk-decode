import { readFile } from "node:fs/promises";
import { loadDecoder } from "./load.js";

export async function createDecoder({ wasmBinary, wasmURL } = {}) {
  return loadDecoder(wasmBinary ?? await readFile(
    wasmURL ?? new URL("./lzma-sdk-decode.wasm", import.meta.url)));
}
