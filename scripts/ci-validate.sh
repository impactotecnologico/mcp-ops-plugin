#!/usr/bin/env bash
# Pre-publish validation for the Opsphere Cursor plugin (no runtime deps).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0

red() { echo "FAIL: $*"; FAIL=1; }
ok() { echo "OK: $*"; }

HAS_RG=0
if command -v rg >/dev/null 2>&1; then
  HAS_RG=1
fi

search_quiet() {
  local pattern="$1"
  shift
  if [[ "$HAS_RG" -eq 1 ]]; then
    rg -q -- "$pattern" "$@"
  else
    grep -E -q -- "$pattern" "$@"
  fi
}

search_list_files() {
  local pattern="$1"
  shift
  if [[ "$HAS_RG" -eq 1 ]]; then
    rg -l -- "$pattern" "$@" 2>/dev/null
  else
    grep -E -l -- "$pattern" "$@" 2>/dev/null
  fi
}

tracked_match_exists() {
  local pattern="$1"
  shift || true
  if [[ "$#" -eq 0 ]]; then
    return 1
  fi
  search_list_files "$pattern" "$@" >/dev/null
}

echo "=== Opsphere plugin — public repo validation ==="

# 1. Required manifest files
for f in .cursor-plugin/plugin.json mcp.json README.md CHANGELOG.md LICENSE; do
  [[ -f "$f" ]] || { red "missing $f"; continue; }
  ok "$f exists"
done

# 2. Icon (PNG for marketplace; SVG for Cursor UI)
[[ -f assets/icon.png || -f assets/logo-icon.svg || -f assets/isotipo.png ]] \
  || red "no plugin icon (assets/icon.png or logo-icon.svg)"
[[ -f assets/icon.png ]] && ok "assets/icon.png"

# 3. JSON syntax
for j in .cursor-plugin/plugin.json .cursor-plugin/marketplace.json mcp.json hooks/hooks.json; do
  [[ -f "$j" ]] || continue
  python3 -m json.tool "$j" >/dev/null || red "invalid JSON: $j"
done
ok "JSON manifests parse"

# 4. No secrets / env in tree
if search_quiet '^\.env$|^\.env\..*|^\*\.env$' .gitignore; then ok ".env gitignored"; else red ".env not in .gitignore"; fi
[[ ! -f .env ]] || red ".env must not be committed"

# 5. Sensitive patterns in tracked files (not docs about env var *names*)
TRACKED="$(git ls-files 2>/dev/null || find . -type f ! -path './.git/*')"
mapfile -t TRACKED_FILES <<<"$TRACKED"
SCAN_FILES=()
for f in "${TRACKED_FILES[@]}"; do
  [[ "$f" == "scripts/ci-validate.sh" ]] && continue
  SCAN_FILES+=("$f")
done
if tracked_match_exists 'AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}' "${SCAN_FILES[@]}"; then
  red "possible secret material in tracked files"
else
  ok "no high-confidence secret patterns in tracked files"
fi

# 6. Private IP literals in tracked files
if tracked_match_exists '192\.168\.|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.' "${SCAN_FILES[@]}"; then
  red "private IP literals in tracked files"
else
  ok "no private IP literals in tracked tree"
fi

# 7. _internal must not be tracked
if git ls-files _internal 2>/dev/null | grep -q .; then
  red "_internal/ is tracked — must stay gitignored"
else
  ok "_internal/ not tracked"
fi

# 8. mcp.json public endpoint only
if search_quiet 'mcp-cursor\.opsphere\.io' mcp.json; then ok "mcp.json uses public gateway URL"; else red "unexpected mcp.json URL"; fi

echo "=== done (failures: $FAIL) ==="
exit "$FAIL"
