#!/usr/bin/env bash
# Install Opsphere Codex plugin locally + personal marketplace entry.
# See docs/INSTALL.md#codex--chatgpt-cli
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_NAME="opsphere"
DEST="${HOME}/.codex/plugins/${PLUGIN_NAME}"
MARKETPLACE_DIR="${HOME}/.agents/plugins"
MARKETPLACE_FILE="${MARKETPLACE_DIR}/marketplace.json"

echo "=== Opsphere Codex plugin install ==="
echo "Source: ${ROOT}"
echo "Dest:   ${DEST}"

for f in .codex-plugin/plugin.json .mcp.json; do
  [[ -f "${ROOT}/${f}" ]] || { echo "FAIL: missing ${f} — run from the Opsphere plugin repository root"; exit 1; }
done

python3 -m json.tool "${ROOT}/.codex-plugin/plugin.json" >/dev/null
python3 -m json.tool "${ROOT}/.mcp.json" >/dev/null
echo "OK: Codex manifests parse"

mkdir -p "${DEST}"
rsync -a --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  "${ROOT}/" "${DEST}/"

mkdir -p "${MARKETPLACE_DIR}"

if [[ -f "${MARKETPLACE_FILE}" ]]; then
  cp "${MARKETPLACE_FILE}" "${MARKETPLACE_FILE}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
  echo "OK: backed up existing marketplace.json"
fi

python3 - "${MARKETPLACE_FILE}" <<'PY'
import json
import sys
from pathlib import Path

marketplace_path = Path(sys.argv[1])

entry = {
    "name": "opsphere",
    "source": {
        "source": "local",
        "path": "../.codex/plugins/opsphere",
    },
    "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL",
    },
    "category": "Developer Tools",
}

if marketplace_path.exists():
    data = json.loads(marketplace_path.read_text())
else:
    data = {
        "name": "personal-opsphere",
        "interface": {"displayName": "Personal (Opsphere)"},
        "plugins": [],
    }

plugins = data.setdefault("plugins", [])
plugins = [p for p in plugins if p.get("name") != "opsphere"]
plugins.append(entry)
data["plugins"] = plugins

marketplace_path.write_text(json.dumps(data, indent=2) + "\n")
print(f"OK: wrote {marketplace_path}")
PY

echo ""
echo "Next steps:"
echo "  1. ChatGPT desktop: restart → Settings → Security → Developer mode → Plugins → Opsphere → Connect"
echo "  2. Codex CLI: ./scripts/codex-mcp-config.sh && npx @openai/codex mcp login opsphere"
echo "  3. Verify: ask Codex to call ops_my_usage or use @configure-integration"
echo ""
