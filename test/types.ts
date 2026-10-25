import { createDecoder, type DecodeResult } from "../dist/node.js";
const decoder = await createDecoder();
const result: DecodeResult = decoder.decodeLzma(new Uint8Array(), new Uint8Array(5), 0);
result.data.subarray(result.bytesRead);
decoder.decodeLzma2(new Uint8Array(), 8, 0).status.toFixed();
// @ts-expect-error only bytes, never strings
decoder.decodeLzma("text", new Uint8Array(5), 0);
// @ts-expect-error LZMA2 properties are a byte value
decoder.decodeLzma2(new Uint8Array(), new Uint8Array(1), 0);
// @ts-expect-error no container/header/archiver API
decoder.extract(new Uint8Array());
