---
name: connect-another-client
description: Connect the same Opsphere account to Cursor, Codex, Claude Code, Warp, or another MCP client without creating another account or sharing tokens.
---

# Connect another MCP client

Help the user reuse their existing Opsphere account in another supported client.

## Live preflight

1. If `ops_my_usage` is available, call it once to confirm authentication, plan and current workspace. If it is unavailable, explain that the current client must be connected first; do not guess account state.
2. Ask for exactly one destination client and whether configuration should be global or project-scoped when the destination supports both.
3. Show only that destination's instructions.
4. Treat the live MCP catalog as authoritative. Never promise a provider tool merely because it appears in documentation.

## Invariants

- MCP URL: `https://mcp-cursor.opsphere.io/mcp`.
- Sign in with the same email to recover the same Connection Hub, subscription and Personal Workspace.
- Each OAuth client receives its own revocable MCP session and keeps its workspace preference separately.
- Never ask the user to paste access tokens, refresh tokens, authorization codes or passwords in chat.
- Do not copy OAuth token files between applications. Complete OAuth independently in each client.
- Cursor, Codex and Claude Code are supported through their plugins. Warp local is canary-gated until Opsphere confirms availability for the account. Warp/Oz cloud does not currently support Opsphere OAuth MCP.
- Installing only the MCP provides tools and OAuth. Installing the plugin/package additionally provides guided skills, rules and agents.

## Instructions by client

- **Cursor:** install the Opsphere plugin, enable its remote MCP server and complete the browser sign-in.
- **Codex:** install the Opsphere plugin and complete MCP OAuth when Codex prompts. The plugin supplies the skills and server definition.
- **Claude Code:** install the Opsphere plugin, run `/mcp`, select `opsphere`, then use `claude mcp login opsphere` if login is not offered automatically.
- **Warp local:** first state that access is canary-gated. If available, add a remote Streamable HTTP MCP server named `opsphere` with the URL above. Global config is `~/.warp/.mcp.json`; project config is `<repo>/.warp/.mcp.json`. Use `{ "mcpServers": { "opsphere": { "url": "https://mcp-cursor.opsphere.io/mcp" } } }`, preserving other entries. Complete browser OAuth; Warp returns to `http://127.0.0.1:<port>/mcp/oauth2callback`.
- **Generic MCP client:** configure a remote Streamable HTTP server with the URL above. Prefer OAuth discovery, PKCE S256 and dynamic registration; do not configure a static bearer token.

After login, ask the client to call `ops_my_usage` and `ops_accounts_list`. Confirm the same Hub and Personal Workspace are visible; do not compare or expose internal IDs unless diagnosing a real mismatch.

If the user changes workspace with explicit consent, expect `notifications/tools/list_changed`. If the client does not refresh, reconnect the Opsphere MCP and call `tools/list` again. Never switch workspace merely to test the connection.

For revocation, revoke only the destination client's session. Never suggest unlinking a workspace or revoking another client's session as a reconnect shortcut.

Troubleshooting order: verify the canonical URL, complete OAuth in the destination client, reconnect once, call `ops_my_usage`, then use the Opsphere reconnect skill for `401`, `invalid_grant` or an expired session. Never copy token files between clients.

For Warp project guidance, place portable skills under `.agents/skills/` and use `AGENTS.md` as the canonical repository rule file. Warp-specific copies under `.warp/skills/` are optional. Do not promise that local MCP credentials are available to Warp cloud environments.
