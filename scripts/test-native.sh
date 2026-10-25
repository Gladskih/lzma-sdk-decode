#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .build
python3 scripts/generate-corpus.py
clang -std=c11 -g -O1 -fsanitize=address,undefined -fno-omit-frame-pointer \
  -Wall -Wextra -Werror -I .build/sdk/C native/oracle.c \
  .build/sdk/C/LzmaDec.c .build/sdk/C/Lzma2Dec.c -o .build/oracle
node scripts/test-differential.mjs
