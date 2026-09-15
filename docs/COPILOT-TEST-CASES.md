# GitHub Copilot CLI — test cases for Opsphere

**Package:** `opsphere-copilot/` 1.0.0  
**MCP gateway:** `https://mcp-cursor.opsphere.io/mcp`  
**Install:** `copilot plugin install` (does not modify Cursor, Codex, Claude Code, Warp, OpenCode or Antigravity).

**Related:** [opsphere-copilot/README.md](../opsphere-copilot/README.md) · [guides/copilot.md](../opsphere-copilot/guides/copilot.md) · [MULTICLIENT-SUPPORT.md](MULTICLIENT-SUPPORT.md)

Automated CI validates Agent Plugins `plugin.json` / `mcp.json`, Copilot marketplace isolation and generated guides. It does **not** run live Copilot OAuth. Do not mark unexecuted rows as passed.

## Prerequisites

1. GitHub Copilot CLI that can install Agent Plugins 1.0.
2. The `opsphere-copilot/` package from this repo (or GitHub subdirectory / this repo as a Copilot marketplace).
3. An Opsphere account (same email as other clients). Do not copy token files.

## Plugin install (required)

Local:

```bash
copilot plugin install /absolute/path/to/opsphere-copilot
copilot plugin list
```

GitHub subdirectory (no marketplace):

```bash
copilot plugin install opsphere-io/opsphere-plugin:opsphere-copilot
```

Marketplace:

```bash
copilot plugin marketplace add opsphere-io/opsphere-plugin
copilot plugin install opsphere@opsphere
```

Confirm:

- Install path is under `~/.copilot/installed-plugins/`
- The plugin contains `plugin.json`, `mcp.json` (`type: streamable-http`, `url` only), `skills/` and `com.github.copilot/`
- There is no `hooks.json`, no `install.mjs`, and no root `agents/` directory
- Opsphere appears **once** in a **new** session
- `/skills list` shows portable skills
- There is no extra manual `opsphere` MCP entry alongside the plugin

This repo's Copilot marketplace file is `.github/plugin/marketplace.json` with `source: ./opsphere-copilot`. Do not treat `.claude-plugin/marketplace.json` (`source: ./`) as the Copilot catalog.

## OAuth (DCR + PKCE)

Expected: Copilot discovers authorization, uses PKCE S256 and attempts dynamic client registration. Do not configure `client_id`, callback, tokens or secrets in the plugin. Credentials stay in `~/.copilot/mcp-oauth-config/`.

Flow:

1. Start a new Copilot CLI session.
2. Open `/mcp`, select **opsphere**, and sign in.
3. Browser opens. Sign in and choose a workspace.
4. Copilot completes token exchange.

Do not copy token files from Cursor, Codex, Claude Code, Warp, OpenCode or Antigravity. A new DCR registration can have a fresh workspace preference.

On `invalid_redirect_uri` or 401, report the redacted error. Do not change `cursor-mcp` / `codex-mcp` / `claude-mcp` client IDs.

## Live checks

1. Call `ops_my_usage` and `ops_accounts_list`. Do not assert a fixed tool count.
2. Run `opsphere-onboarding` without changing configuration.
3. Run `endpoint-health` against `https://example.com`.
4. Confirm skills under `skills/` and Copilot agents/commands under `com.github.copilot/`.

## Refresh and persistence

Restart Copilot CLI. Confirm the session refreshes and the same workspace remains selected without repeating OAuth (unless this was a new DCR client).

## Uninstall

```bash
copilot plugin uninstall opsphere
```

OAuth is **not** revoked by uninstall.

## MCP-only (optional, exclusive)

```bash
copilot mcp add --transport http opsphere https://mcp-cursor.opsphere.io/mcp
```

Do not combine with `copilot plugin install`. Do not set a static bearer token or client secret.

## Cross-client regression

From `mcp-ops-plugin`:

```bash
npm test
```

Cursor, Codex, Claude Code, Warp, OpenCode and Antigravity must keep their existing plugin/MCP files. Completing Copilot DCR OAuth must not log out those clients. Claude marketplace `source` remains `./`. Copilot cloud agent remains outside this package's support boundary.
