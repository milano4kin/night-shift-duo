#!/usr/bin/env bash
set -euo pipefail
rm -rf app
mkdir app
tar -xzf night_shift_duo_game_render.tar.gz -C app
cat v8patch/p00.b64 v8patch/p01.b64 | base64 -d | gzip -d > /tmp/night_shift_duo_v8.patch
cd app
git apply --check /tmp/night_shift_duo_v8.patch
git apply /tmp/night_shift_duo_v8.patch
npm ci --omit=dev
