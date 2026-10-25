import { createDecoder } from "../dist/browser.js";
const decoder = await createDecoder();
postMessage(decoder.decodeLzma2(Uint8Array.of(1, 0, 3, 68, 65, 84, 65, 0), 0, 4));
