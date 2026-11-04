#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$repo_root"

node --version | grep -Eq '^v22\.'
echo "Repository root: ${repo_root}"
echo "No npm install (zero runtime deps); run npm test in agent tasks before PR."

echo "Plugin Cloud Environment install finished."
