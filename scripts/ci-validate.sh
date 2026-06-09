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
for j in .cursor-plugin/plugin.json .cursor-plugin/marketplace.json mcp.json; do
  [[ -f "$j" ]] || continue
  python3 -m json.tool "$j" >/dev/null || red "invalid JSON: $j"
done
if [[ -f hooks/hooks.json ]]; then
  python3 -m json.tool hooks/hooks.json >/dev/null || red "invalid JSON: hooks/hooks.json"
  if search_quiet 'workspaceOpen' hooks/hooks.json; then
    red "hooks/hooks.json must not define workspaceOpen (no auto shell on open)"
  else
    ok "hooks/hooks.json present without workspaceOpen"
  fi
else
  ok "no hooks/hooks.json (no auto shell on workspace open)"
fi
ok "JSON manifests parse"

# 4. No secrets / env in tree
if search_quiet '^\.env$|^\.env\..*|^\*\.env$' .gitignore; then ok ".env gitignored"; else red ".env not in .gitignore"; fi
[[ ! -f .env ]] || red ".env must not be committed"

# 5. package.json — no npm install lifecycle hooks
if [[ -f package.json ]]; then
  if python3 -c "
import json, sys
scripts = json.load(open('package.json')).get('scripts') or {}
bad = [k for k in scripts if k in ('preinstall', 'postinstall', 'prepare', 'install')]
sys.exit(1 if bad else 0)
"; then
    ok "package.json has no install lifecycle hooks"
  else
    red "package.json must not define preinstall/postinstall/prepare/install"
  fi
fi

# 6. scripts/ — maintainer CI only (no runtime shell in bundle)
EXTRA_SCRIPTS="$(find scripts -type f ! -name 'ci-validate.sh' 2>/dev/null | head -1 || true)"
if [[ -n "$EXTRA_SCRIPTS" ]]; then
  red "unexpected files in scripts/ (only ci-validate.sh allowed): $EXTRA_SCRIPTS"
else
  ok "scripts/ contains only ci-validate.sh"
fi

# 7. Sensitive patterns in tracked files (not docs about env var *names*)
TRACKED="$(git ls-files 2>/dev/null || find . -type f ! -path './.git/*')"
SCAN_FILES=()
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ "$f" == "scripts/ci-validate.sh" ]] && continue
  SCAN_FILES+=("$f")
done <<<"$TRACKED"
if tracked_match_exists 'AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}' "${SCAN_FILES[@]}"; then
  red "possible secret material in tracked files"
else
  ok "no high-confidence secret patterns in tracked files"
fi

# 8. Private IP literals in tracked files
if tracked_match_exists '192\.168\.|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.' "${SCAN_FILES[@]}"; then
  red "private IP literals in tracked files"
else
  ok "no private IP literals in tracked tree"
fi

# 9. _internal must not be tracked
if git ls-files _internal 2>/dev/null | grep -q .; then
  red "_internal/ is tracked — must stay gitignored"
else
  ok "_internal/ not tracked"
fi

# 10. mcp.json public endpoint only
if search_quiet 'mcp-cursor\.opsphere\.io' mcp.json; then ok "mcp.json uses public gateway URL"; else red "unexpected mcp.json URL"; fi

# 11–14. Cursor submission checklist (frontmatter, logo, paths, version sync)
if ROOT="$ROOT" python3 <<'PY'
import glob
import json
import os
import re
import sys

ROOT = os.environ.get("ROOT", ".")
failures: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)
    print(f"FAIL: {msg}")


# 11. Frontmatter name + description on commands/ and skills/
for pattern in ("commands/*.md", "skills/*/SKILL.md"):
    for path in sorted(glob.glob(os.path.join(ROOT, pattern))):
        rel = os.path.relpath(path, ROOT)
        with open(path, encoding="utf-8") as f:
            content = f.read()
        if not content.startswith("---"):
            fail(f"missing YAML frontmatter: {rel}")
            continue
        parts = content.split("---", 2)
        if len(parts) < 3:
            fail(f"invalid frontmatter delimiters: {rel}")
            continue
        fm = parts[1]
        if not re.search(r"^name:\s*\S", fm, re.MULTILINE):
            fail(f"frontmatter missing name: {rel}")
        if not re.search(r"^description:\s*\S", fm, re.MULTILINE):
            fail(f"frontmatter missing description: {rel}")

if not failures:
    print("OK: commands/skills frontmatter (name + description)")

# 12. Logo referenced in manifests exists
with open(os.path.join(ROOT, ".cursor-plugin/plugin.json"), encoding="utf-8") as f:
    plugin = json.load(f)
logo = plugin.get("logo")
if not logo:
    fail("plugin.json missing logo field")
elif not os.path.isfile(os.path.join(ROOT, logo)):
    fail(f"plugin.json logo not found: {logo}")
else:
    print(f"OK: plugin.json logo exists ({logo})")

with open(os.path.join(ROOT, ".cursor-plugin/marketplace.json"), encoding="utf-8") as f:
    marketplace = json.load(f)
for i, entry in enumerate(marketplace.get("plugins") or []):
    entry_logo = entry.get("logo")
    if not entry_logo:
        fail(f"marketplace.json plugins[{i}] missing logo")
    elif not os.path.isfile(os.path.join(ROOT, entry_logo)):
        fail(f"marketplace.json plugins[{i}].logo not found: {entry_logo}")
    else:
        print(f"OK: marketplace.json plugins[{i}] logo exists ({entry_logo})")

# 13. No parent-segment or absolute paths in JSON manifests
MANIFESTS = (
    ".cursor-plugin/plugin.json",
    ".cursor-plugin/marketplace.json",
    "mcp.json",
)


def walk_strings(obj, label: str, trail: str = "") -> None:
    if isinstance(obj, str):
        key = f"{label}{trail}"
        if "/.." in obj or obj.startswith("..") or "/../" in obj:
            fail(f"{key}: path contains '..': {obj!r}")
        if re.match(r"^/[A-Za-z]", obj):
            fail(f"{key}: absolute filesystem path: {obj!r}")
    elif isinstance(obj, dict):
        for k, v in obj.items():
            walk_strings(v, label, f"{trail}.{k}" if trail else f".{k}")
    elif isinstance(obj, list):
        for idx, v in enumerate(obj):
            walk_strings(v, label, f"{trail}[{idx}]")


for manifest in MANIFESTS:
    manifest_path = os.path.join(ROOT, manifest)
    with open(manifest_path, encoding="utf-8") as f:
        data = json.load(f)
    before = len(failures)
    walk_strings(data, manifest)
    if len(failures) == before:
        print(f"OK: {manifest} has no .. or absolute paths")

# 14. Version sync plugin.json ↔ marketplace.json
plugin_version = plugin.get("version")
metadata_version = (marketplace.get("metadata") or {}).get("version")
if plugin_version != metadata_version:
    fail(
        f"version mismatch: plugin.json={plugin_version!r} vs "
        f"marketplace metadata={metadata_version!r}"
    )
else:
    print(f"OK: plugin.json and marketplace metadata version ({plugin_version})")

for i, entry in enumerate(marketplace.get("plugins") or []):
    entry_version = entry.get("version")
    if entry_version != plugin_version:
        fail(
            f"version mismatch: plugin.json={plugin_version!r} vs "
            f"marketplace plugins[{i}]={entry_version!r}"
        )
    else:
        print(f"OK: plugin.json and marketplace plugins[{i}] version ({plugin_version})")

sys.exit(1 if failures else 0)
PY
then
  :
else
  FAIL=1
fi

echo "=== done (failures: $FAIL) ==="
exit "$FAIL"
