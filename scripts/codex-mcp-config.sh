#!/usr/bin/env bash
# Register Opsphere remote MCP in ~/.codex/config.toml (OAuth + required headers).
# See docs/TROUBLESHOOTING.md#codex--chatgpt-cli
set -euo pipefail

CONFIG="${HOME}/.codex/config.toml"
BLOCK=$(cat <<'TOML'

# --- Opsphere remote MCP (Codex CLI) ---
mcp_oauth_callback_port = 8787
mcp_oauth_callback_url = "http://localhost:8787/callback"

[mcp_servers.opsphere]
url = "https://mcp-cursor.opsphere.io/mcp"
auth = "oauth"
enabled = true
http_headers = { "User-Agent" = "codex-mcp/1.0" }
oauth_resource = "https://mcp-cursor.opsphere.io/mcp"

[mcp_servers.opsphere.oauth]
client_id = "codex-mcp"
TOML
)

if [[ -f "${CONFIG}" ]] && grep -q '^\[mcp_servers\.opsphere\]' "${CONFIG}" 2>/dev/null; then
  echo "OK: [mcp_servers.opsphere] already in ${CONFIG}"
  exit 0
fi

if [[ -f "${CONFIG}" ]]; then
  cp "${CONFIG}" "${CONFIG}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
fi

printf '%s\n' "${BLOCK}" >> "${CONFIG}"
echo "OK: appended opsphere MCP block to ${CONFIG}"
echo ""
echo "Next:"
echo "  npx @openai/codex mcp login opsphere"
echo "  # then verify with: ops_my_usage"
echo ""
