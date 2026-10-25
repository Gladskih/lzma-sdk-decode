# lzma-sdk-decode

Minimal **raw LZMA and LZMA2 decoders** for browsers, Workers and Node.js.
The original Igor Pavlov C decoders from LZMA SDK / 7-Zip 26.05 are compiled
unchanged to WebAssembly. No runtime dependencies, encoder, filesystem or
archive parser. The WASM is a separate, locally loadable asset.

```sh
npm install lzma-sdk-decode
```

```js
import { createDecoder } from "lzma-sdk-decode";

const decoder = await createDecoder();
const result = decoder.decodeLzma(payload, properties, expectedSize);
// Or: decoder.decodeLzma2(payload, propertyByte, expectedSize)
if (result.resultCode !== 0) throw new Error(`LZMA SDK error ${result.resultCode}`);
```

`payload` and LZMA `properties` are Uint8Array values. LZMA properties contain
exactly five bytes; LZMA2 takes one numeric property byte. `expectedSize` is
the output capacity and the declared end of the raw stream. The SDK's
`LZMA_FINISH_END` is used. The returned `data` contains only produced bytes.

Results expose unchanged SDK `resultCode` (SRes), `status` (ELzmaStatus), and
`bytesRead`. Status values are 0 unspecified, 1 finished with marker, 2 not
finished, 3 needs more input, and 4 maybe finished without marker. Streams
without an end marker are supported when the output size is known. Consumers
must check the result code, appropriate completion status, output length,
consumed input and any external checksum. Trailing input is reported by
`bytesRead`; it is not silently incorporated into the decoded stream.

The package does **not** read 7z, ZIP, XZ, LZMA-alone, UPX or Inno headers.
Consumers parse those formats and pass only raw payloads and decoded properties.
LZMA2 chunk control bytes are intrinsic to the algorithm, not archive metadata.

Malformed streams return SDK results and any partial output. Invalid JavaScript
arguments throw TypeError/RangeError. Allocation failure throws; a native trap
quarantines that decoder instance. Each createDecoder() owns independent memory.
No arbitrary input caps are added; actual wasm32 address-space limits apply.

Both entry points accept `createDecoder({ wasmBinary })` for fully offline
initialization, or `{ wasmURL }` to customize loading. The default Node loader
reads the neighboring WASM file; the browser loader fetches it from the same
origin. Export `lzma-sdk-decode/lzma-sdk-decode.wasm` is available to bundlers.
Browser CSP needs `'wasm-unsafe-eval'`, with same-origin scripts and connections.
Decoding is synchronous; run the package in a module Worker for responsive UI.

## Build and verify

```sh
npm ci
npm run build:wasm
npm run test:native
npx playwright install --with-deps chromium
npm run verify
npm run pack:verified
```

Build scripts use Linux/macOS bash (or WSL), Python 3 and Clang. Emscripten and
all SDK files are pinned in upstream.json. EMSDK_ROOT may reuse a checkout only
at the exact pinned commit. Native differential tests use the unchanged SDK with
ASan/UBSan and independently generated raw liblzma streams. CI tests the packed
artifact on Linux and Windows. Publication uses the verified tarball.

MIT for the wrapper; upstream decoder code is public domain. See LICENSE,
THIRD_PARTY_NOTICES.md, licenses/ and the exported build-info.json provenance.
