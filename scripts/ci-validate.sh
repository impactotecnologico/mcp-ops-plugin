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
for f in .cursor-plugin/plugin.json .codex-plugin/plugin.json .mcp.json mcp.json README.md CHANGELOG.md LICENSE; do
  [[ -f "$f" ]] || { red "missing $f"; continue; }
  ok "$f exists"
done

# 2. Icon (PNG for marketplace; SVG for Cursor UI)
[[ -f assets/icon.png || -f assets/logo-icon.svg || -f assets/isotipo.png ]] \
  || red "no plugin icon (assets/icon.png or logo-icon.svg)"
[[ -f assets/icon.png ]] && ok "assets/icon.png"

# 3. JSON syntax
for j in .cursor-plugin/plugin.json .cursor-plugin/marketplace.json .codex-plugin/plugin.json .agents/plugins/marketplace.json .mcp.json mcp.json; do
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
ALLOWED_SCRIPTS=(ci-validate.sh codex-install.sh codex-mcp-config.sh)
EXTRA_SCRIPTS=()
while IFS= read -r script; do
  [[ -z "$script" ]] && continue
  base="$(basename "$script")"
  allowed=0
  for a in "${ALLOWED_SCRIPTS[@]}"; do
    [[ "$base" == "$a" ]] && { allowed=1; break; }
  done
  [[ "$allowed" -eq 0 ]] && EXTRA_SCRIPTS+=("$script")
done < <(find scripts -type f 2>/dev/null || true)
if [[ "${#EXTRA_SCRIPTS[@]}" -gt 0 ]]; then
  red "unexpected files in scripts/: ${EXTRA_SCRIPTS[*]}"
else
  ok "scripts/ contains only allowed maintainer scripts"
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
if search_quiet 'cursor-mcp' mcp.json && search_quiet '"scopes"' mcp.json; then
  ok "mcp.json bundles cursor-mcp CLIENT_ID and OAuth scopes"
else
  red "mcp.json must include auth.CLIENT_ID cursor-mcp and scopes (e.g. mcp:tools)"
fi
if search_quiet 'mcp-cursor\.opsphere\.io' .mcp.json; then ok ".mcp.json uses public gateway URL"; else red "unexpected .mcp.json URL"; fi
if search_quiet '"auth"[[:space:]]*:[[:space:]]*"oauth"' .mcp.json; then ok ".mcp.json uses oauth auth"; else red ".mcp.json must set auth oauth"; fi
if search_quiet 'codex-mcp' .mcp.json && search_quiet 'User-Agent' .mcp.json && search_quiet 'oauth_resource' .mcp.json; then
  ok ".mcp.json bundles Codex OAuth client_id, User-Agent, oauth_resource"
else
  red ".mcp.json must include oauth.client_id, http_headers.User-Agent, oauth_resource for ChatGPT desktop"
fi

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


# 11. Frontmatter name + description on commands/, skills/, and agents/
for pattern in ("commands/*.md", "skills/*/SKILL.md", "agents/*.md"):
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
    print("OK: commands/skills/agents frontmatter (name + description)")

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

# 15. Deployment catalog skills document Team plugin restriction
for skill in skills/set-work-context/SKILL.md skills/configure-deployment-catalog/SKILL.md; do
  if [[ -f "$skill" ]] && search_quiet 'WorkContextForbiddenError' "$skill"; then
    ok "$skill documents WorkContextForbiddenError"
  else
    red "$skill must document WorkContextForbiddenError for Team tenants"
  fi
done

# 16. Codex plugin manifest (independent version from Cursor)
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


codex_path = os.path.join(ROOT, ".codex-plugin/plugin.json")
if not os.path.isfile(codex_path):
    fail("missing .codex-plugin/plugin.json")
else:
    with open(codex_path, encoding="utf-8") as f:
        codex = json.load(f)
    version = codex.get("version")
    if not version or not re.match(r"^\d+\.\d+\.\d+", str(version)):
        fail(f".codex-plugin/plugin.json invalid version: {version!r}")
    else:
        print(f"OK: .codex-plugin/plugin.json version ({version})")
    skills_ref = codex.get("skills")
    if skills_ref != "./skills/":
        fail(f".codex-plugin/plugin.json skills must be ./skills/ (got {skills_ref!r})")
    mcp_ref = codex.get("mcpServers")
    if mcp_ref != "./.mcp.json":
        fail(f".codex-plugin/plugin.json mcpServers must be ./.mcp.json (got {mcp_ref!r})")
    iface = codex.get("interface") or {}
    icon = iface.get("composerIcon") or iface.get("logo")
    if icon and not os.path.isfile(os.path.join(ROOT, icon.lstrip("./"))):
        fail(f".codex-plugin composerIcon/logo not found: {icon}")
    elif icon:
        print(f"OK: .codex-plugin interface icon exists ({icon})")

codex_skills = {
    "incident-investigation",
    "endpoint-health",
    "ci-investigation",
    "postmortem-writer",
    "configure-integration",
    "set-work-context",
    "configure-deployment-catalog",
    "run-macro-workflows",
    "plan-and-usage",
}
for name in sorted(codex_skills):
  path = os.path.join(ROOT, "skills", name, "SKILL.md")
  if not os.path.isfile(path):
    fail(f"Codex skill missing: skills/{name}/SKILL.md")
    continue
  with open(path, encoding="utf-8") as f:
    content = f.read()
  if not content.startswith("---"):
    fail(f"Codex skill missing frontmatter: skills/{name}/SKILL.md")
    continue
  parts = content.split("---", 2)
  fm = parts[1]
  if not re.search(r"^name:\s*" + re.escape(name) + r"\s*$", fm, re.MULTILINE):
    fail(f"Codex skill name mismatch: skills/{name}/SKILL.md")
  if not re.search(r"^description:\s*\S", fm, re.MULTILINE):
    fail(f"Codex skill missing description: skills/{name}/SKILL.md")

if not failures:
  print("OK: Codex skills frontmatter (9 skills)")

sys.exit(1 if failures else 0)
PY
then
  :
else
  FAIL=1
fi

echo "=== done (failures: $FAIL) ==="
exit "$FAIL"
