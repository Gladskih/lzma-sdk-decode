import createModule from "./lzma-sdk-decode.js";
import { createApi } from "./core.js";

export async function loadDecoder(wasmBinary) {
  return createApi(await createModule({ wasmBinary }));
}
