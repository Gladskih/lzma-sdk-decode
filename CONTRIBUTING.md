# Contributing

Compile the original C decoders from a pinned official LZMA SDK/7-Zip release.
Verify downloaded sources against committed SHA-256 hashes. Do not modify the
algorithm or parse 7z, XZ, ZIP, gzip, LZMA-alone or other container headers.
Properties, payload boundaries, output sizes and checksums belong to consumers.

Keep modules cohesive, use double quotes, const by default, descriptive names,
functions normally under 30 lines (never over 50), complexity below 10 and
100-column lines. Avoid boolean control parameters, argument-bag types,
redundant returned fields and repeated expensive work. Use imperative commits.
No runtime dependencies. No arbitrary resource caps; enforce real wasm32 bounds.
Quarantine a WASM instance after a fatal trap. Preserve the SDK's integer results.

Test new behavior with a red-green cycle. Cover meaningful valid, malformed,
truncated and boundary inputs. Keep tests flat. Require 100% JS line, branch and
function coverage, focused mutation checks, a native unchanged-SDK oracle with
ASan/UBSan, raw streams produced independently by liblzma, browser CSP/offline and
Worker checks, and installation of the exact packed artifact on Linux/Windows.

Before release run npm ci, npm run build:wasm, npm run test:native,
npm run verify and npm run pack:verified. Benchmark before the first publication.
Publish the tested tarball only. CI publication uses npm Trusted Publishing and
provenance, never a persistent npm token. Retain upstream provenance and licenses.
