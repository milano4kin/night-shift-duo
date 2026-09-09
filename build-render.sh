#!/usr/bin/env bash
set -e
rm -rf app
mkdir app
tar -xzf game.tar.gz -C app
cd app
npm ci --omit=dev
