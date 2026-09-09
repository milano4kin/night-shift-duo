#!/usr/bin/env bash
set -euo pipefail
rm -rf app
mkdir app
tar -xzf night_shift_duo_game_render.tar.gz -C app
base64 -d v8patch/changes.patch.gz.b64 | gzip -d > /tmp/night_shift_duo_v8.patch
cd app
git apply --check /tmp/night_shift_duo_v8.patch
git apply /tmp/night_shift_duo_v8.patch
npm ci --omit=dev
