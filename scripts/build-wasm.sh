#!/usr/bin/env bash
set -euo pipefail
export SOURCE_DATE_EPOCH=0
cd "$(dirname "$0")/.."
NODE=$(command -v node || command -v node.exe)
"$NODE" scripts/fetch-sources.mjs
readarray -t PINS < <("$NODE" --input-type=module -e '
  import fs from "node:fs";
  const pin = JSON.parse(fs.readFileSync("upstream.json"));
  console.log(pin.emsdkCommit); console.log(pin.emscriptenVersion);' | tr -d '\r')
SDK=${EMSDK_ROOT:-"$PWD/.build/emsdk"}
if [[ -n ${EMSDK_ROOT:-} ]]; then
  test "$(git -C "$SDK" rev-parse HEAD)" = "${PINS[0]}"
else
  if [[ ! -d "$SDK/.git" ]]; then
    git clone https://github.com/emscripten-core/emsdk.git "$SDK"
  fi
  git -C "$SDK" fetch origin "${PINS[0]}"
  git -C "$SDK" checkout --detach "${PINS[0]}"
  "$SDK/emsdk" install "${PINS[1]}"
  "$SDK/emsdk" activate "${PINS[1]}"
fi
set +u
source "$SDK/emsdk_env.sh"
set -u
emcc --version | head -1 | grep -F " ${PINS[1]} "
mkdir -p artifacts licenses
emcc -std=c11 "${LZMA_OPTIMIZATION:--O3}" -flto -DNDEBUG -I .build/sdk/C \
  -Wall -Wextra -Werror native/bridge.c .build/sdk/C/LzmaDec.c .build/sdk/C/Lzma2Dec.c \
  --no-entry -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node \
  -sDYNAMIC_EXECUTION=0 -sFILESYSTEM=0 -sALLOW_MEMORY_GROWTH=1 \
  -sINITIAL_MEMORY=1048576 -sMAXIMUM_MEMORY=4GB -sSTACK_SIZE=65536 \
  -sABORTING_MALLOC=0 -sASSERTIONS=0 \
  '-sEXPORTED_FUNCTIONS=["_malloc","_free","_decode_lzma","_decode_lzma2"]' \
  '-sEXPORTED_RUNTIME_METHODS=["HEAPU8"]' -o artifacts/lzma-sdk-decode.js
cp .build/sdk/DOC/lzma.txt licenses/LZMA-SDK.txt
cp "$SDK/upstream/emscripten/LICENSE" licenses/emscripten-LICENSE.txt
cp "$SDK/upstream/emscripten/system/lib/libc/musl/COPYRIGHT" licenses/musl.txt
cp "$SDK/upstream/emscripten/system/lib/compiler-rt/LICENSE.TXT" licenses/compiler-rt.txt
node scripts/build.mjs
