#!/usr/bin/env bash
set -e
rm -rf app
mkdir app
tar -xzf night_shift_duo_game_render.tar.gz -C app
cd app
npm ci --omit=dev
