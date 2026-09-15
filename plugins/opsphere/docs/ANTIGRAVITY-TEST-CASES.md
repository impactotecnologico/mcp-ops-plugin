# Antigravity — test cases for Opsphere

**Package:** `opsphere-antigravity/` 1.0.0  
**MCP gateway:** `https://mcp-cursor.opsphere.io/mcp`  
**Install:** `agy plugin install` (does not modify Cursor, Codex or Claude Code).

**Related:** [opsphere-antigravity/README.md](../opsphere-antigravity/README.md) · [guides/antigravity.md](../opsphere-antigravity/guides/antigravity.md) · [MULTICLIENT-SUPPORT.md](MULTICLIENT-SUPPORT.md)

Automated CI validates Agent Plugins `plugin.json` / `mcp.json` and generated guides. It does **not** run live `agy` OAuth. Do not mark unexecuted rows as passed.

## Prerequisites

1. Antigravity CLI (`agy`) and/or IDE.
2. The `opsphere-antigravity/` package from this repo.
3. An Opsphere account (same email as other clients). Do not copy token files.

## Plugin install (required)

```bash
agy plugin install /absolute/path/to/opsphere-antigravity
agy plugin list
```

Confirm:

- Install path is `~/.gemini/config/plugins/opsphere/`
- The plugin contains `plugin.json`, `mcp_config.json` (`serverUrl` only), `mcp.json` (`type: streamable-http`, `url` only), `skills/` and `agents/`
- `agy plugin validate` reports `mcpServers : 1 processed` (current 1.2.x also reports skills and agents processed)
- `agy plugin list` includes `mcpServers` among components
- Opsphere appears **once** in a **new** session MCP section
- There is no extra manual `opsphere` MCP entry alongside the plugin

Current agy ignores Agent Plugins `mcp.json`. If the plugin is listed but MCP is empty, `mcp_config.json` is missing. Do not use `.agents/plugins/opsphere/` or `~/.gemini/antigravity-cli/plugins/opsphere/` as the supported install.

## OAuth (CIMD + PKCE)

Expected (client-managed, not configured in the plugin):

- `client_id`: `https://antigravity.google/oauth/client-metadata.json`
- callback: `https://antigravity.google/oauth-callback`

Flow:

1. Antigravity discovers OAuth.
2. It uses the CIMD client_id and PKCE S256.
3. Browser opens. Sign in and choose a workspace.
4. If Antigravity asks for a code, paste the one-time authorization code into the terminal.
5. Antigravity completes token exchange.

The authorization code is single-use. Do not log, share or put it in this file. Do not configure client_id, callback, tokens or secrets. Workspace preference is bound to the stable CIMD client_id, not a new DCR client.

On `Unknown client_id` or `Token issuance failed`, report the redacted error. Do not register DCR or change Cursor/Codex/Claude client IDs.

## Live checks

1. Call `ops_my_usage` and `ops_accounts_list`. Do not assert a fixed tool count.
2. Run `opsphere-onboarding` without changing configuration.
3. Run `endpoint-health` against `https://example.com`.
4. Confirm skills are discovered. Current `agy` 1.2.x processes `agents/`. `rules/` are not reported by `agy plugin validate`. Invoke matching skills rather than expecting plugin `commands/`.

## Refresh and persistence

Restart Antigravity. Confirm the session refreshes and the same workspace remains selected without repeating OAuth.

## Uninstall

```bash
agy plugin uninstall opsphere
```

OAuth is **not** revoked by uninstall.

## MCP-only (optional, exclusive)

Native Antigravity MCP settings in `~/.gemini/config/mcp_config.json` (global) or `.agents/mcp_config.json` (workspace) with `serverUrl`, **without** the plugin. Do not combine with `agy plugin install`. Do not paste Agent Plugins `mcp.json` into that file.

## Cross-client regression

From `mcp-ops-plugin`:

```bash
npm test
```

Cursor, Codex, Claude Code, Warp and OpenCode must keep their existing plugin/MCP files. Completing Antigravity CIMD OAuth must not log out those clients. OpenCode continues to use DCR.
