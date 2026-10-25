# Initial release verification

Local verification on 2026-10-25, before the first attempted publication:

- Original LZMA SDK / 7-Zip 26.05 C decoders, unchanged and pinned by file hashes.
- 100% JavaScript wrapper line, branch and function coverage.
- All 13 focused safety mutations killed.
- 144 comparisons with the unchanged native SDK under ASan/UBSan, using raw
  liblzma-generated LZMA/LZMA2 streams and truncated/corrupted/trailing variants.
- Browser strict CSP, offline initialization and module Worker tests pass.
- The exact npm tarball passed Linux/Windows consumers on Node 22, 24 and 26.
- WASM: 20,283 bytes. Generated JS loader: 9,400 bytes. No runtime dependencies.

## GPU-Z comparison

GPU-Z.exe SHA-256:
`aa6495e40a1dc3b03b03b5b0c831c5fd8f2722c9cb71254d9a059ccf4c9ba578`.
Raw packed LZMA bytes: 11,470,502; unpacked bytes: 53,974,753.

Three alternating runs of each implementation (baseline/SDK/SDK/baseline/baseline/SDK):

| Measurement | Existing binary101 lzma-web adapter | SDK package |
| --- | ---: | ---: |
| Node 24.19.0, raw decode median | 6,691 ms | 423 ms |
| Chromium 156, whole binary101 analysis median | 5,380 ms | 867 ms |

The Node comparison includes production adapter work and SDK input/output copying;
the output SHA-256 matches in every run:
`9292b73cbc919555e473a7fd8891464ea33dd5c7cd24d95cb9cb6c5630fba912`.
SDK initialization took 1.13 ms separately. Browser comparison replaces only the
LZMA adapter in memory; it retains UPX consumed-input, size and both Adler-32
checks and does not change binary101 sources. Performance is specific to this
file and machine, not a general guarantee. The locally measured runtime files
were checked byte-for-byte against the tested GitHub CI artifact.

## Publication status

The v0.1.0 tagged artifact SHA-256 is
`892e33e4905369aa69565f47e1073528d67510eb55589eb1f20ab81b718d37e9`.
Build/consumer CI passed. npm publication is initially blocked until
2026-10-26T20:50:12.845Z: rejecting the only staged version of the new package
unpublished its placeholder and triggered npm's 24-hour republishing hold.
After a fresh interactive passkey challenge, the authenticated npm Trusted
Publishers lookup returned HTTP 404 for the package. This does not establish
whether npm physically erased its trust records, but usable OIDC authorization
is unverified. The initial scheduled retry was disabled and removed rather than
relying on that assumption. After the hold, restore package existence through
an authorized initial publish, then configure and verify Trusted Publishing.
The original tag and tested artifact remain unchanged. No npm release has been
confirmed. Registry publication and OIDC authorization require direct evidence
from successful operations; configuration alone is not proof.
