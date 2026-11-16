#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org --prefix .github/supply-chain-tools
node scripts/supply-chain/check.mjs
node --test scripts/supply-chain/supply-chain.test.mjs
node --test scripts/supply-chain/sign-release.test.mjs
node scripts/supply-chain/inventory.mjs