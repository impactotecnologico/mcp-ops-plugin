---
name: connect-another-client
description: Connect the same Opsphere account to Cursor, Codex, Claude Code, Warp, or another MCP client without creating another account or sharing tokens.
---

# Connect another MCP client

Help the user reuse their existing Opsphere account in another supported client.

## Invariants

- MCP URL: `https://mcp-cursor.opsphere.io/mcp`.
- Sign in with the same email to recover the same Connection Hub, subscription and Personal Workspace.
- Each OAuth client receives its own revocable MCP session and keeps its workspace preference separately.
- Never ask the user to paste access tokens, refresh tokens, authorization codes or passwords in chat.
- Do not copy OAuth token files between applications. Complete OAuth independently in each client.
- Cursor, Codex, Claude Code and Warp local are supported. Warp/Oz cloud does not currently support Opsphere OAuth MCP.

## Instructions by client

- **Cursor:** install the Opsphere plugin, enable its remote MCP server and complete the browser sign-in.
- **Codex:** install the Opsphere plugin and complete MCP OAuth when Codex prompts. The plugin supplies the skills and server definition.
- **Claude Code:** install the Opsphere plugin, run `/mcp`, select `opsphere`, then use `claude mcp login opsphere` if login is not offered automatically.
- **Warp local:** add a remote Streamable HTTP MCP server named `opsphere` with the URL above. Complete the browser OAuth flow; Warp returns to `http://127.0.0.1:<port>/mcp/oauth2callback`.
- **Generic MCP client:** configure a remote Streamable HTTP server with the URL above. Prefer OAuth discovery, PKCE S256 and dynamic registration; do not configure a static bearer token.

After login, ask the client to call `ops_my_usage` and `ops_accounts_list`. Confirm the same Hub and Personal Workspace are visible; do not compare or expose internal IDs unless diagnosing a real mismatch.

For Warp project guidance, place portable skills under `.agents/skills/` and use `AGENTS.md` as the canonical repository rule file. Warp-specific copies under `.warp/skills/` are optional. Do not promise that local MCP credentials are available to Warp cloud environments.

