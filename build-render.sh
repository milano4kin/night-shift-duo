#!/usr/bin/env bash
set -euo pipefail
npm ci --omit=dev --no-audit --no-fund
npm run build:prod
