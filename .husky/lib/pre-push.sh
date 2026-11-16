#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
npm test
node --test opsphere-vscode/tests/package.test.mjs
bash "$ROOT/.husky/lib/run-supply-chain.sh"