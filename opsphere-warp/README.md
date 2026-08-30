# Opsphere for Warp local

This package adds Opsphere's remote MCP plus portable operational skills and project rules to Warp local.

Warp access is initially canary-gated. Use the same email as your existing Opsphere account; each client receives an independent OAuth session. Never copy OAuth tokens from Cursor, Codex or Claude Code.

## Install

1. Merge `mcp/opsphere.json` into either `~/.warp/.mcp.json` (global) or `<repo>/.warp/.mcp.json` (project). Preserve existing MCP servers.
2. Copy the selected directories under `skills/` into `<repo>/.agents/skills/`.
3. Merge `rules/AGENTS.md` into the repository's `AGENTS.md`. Do not install a competing `WARP.md`.
4. Open the repository in Warp, select the detected `opsphere` MCP and complete browser OAuth.
5. Ask Warp to call `ops_my_usage` and `ops_accounts_list`.

The MCP URL is `https://mcp-cursor.opsphere.io/mcp` using remote HTTP transport. Local credentials are not available to Oz cloud agents. Slack-triggered Warp cloud agents are not supported by this package.

If tools do not refresh after an explicitly confirmed workspace change, reconnect the MCP and request `tools/list` again.
