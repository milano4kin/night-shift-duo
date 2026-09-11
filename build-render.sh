#!/usr/bin/env bash
set -euo pipefail
npm install --omit=dev --no-audit --no-fund
npm run build:prod
