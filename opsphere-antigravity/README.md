# Opsphere for Antigravity

Use the [official generated Antigravity connection guide](guides/antigravity.md) for the endpoint, native `mcp_config.json`, Agent Plugins `mcp.json`, CIMD OAuth, plan compatibility and troubleshooting. The guide is generated from the canonical connection catalog.

Package version **1.0.0**. This folder does not change the Cursor, Codex or Claude Code plugin bundles.

## Why MCP can look empty after install

Current `agy` (1.2.x) loads plugin MCP from `mcp_config.json` with `serverUrl`. It does **not** ingest Agent Plugins `mcp.json`. If `agy plugin list` shows Opsphere but a new session has an empty MCP section, the installed plugin is missing `mcp_config.json`. Confirm with:

```sh
agy plugin validate /absolute/path/to/opsphere-antigravity
```

That output must include `mcpServers : 1 processed`. Then start a **new** `agy` session.

## Package contents

- `plugin.json`
- `mcp_config.json` (`serverUrl` only) — this is what current agy loads
- `mcp.json` (`type: streamable-http`, gateway `url` only) — Agent Plugins portable; ignored by agy 1.2.x
- `skills/`

OAuth, credentials, `client_id`, callback, tokens and secrets are **not** in the plugin. Antigravity discovers OAuth and uses stable CIMD.

`rules/` and `agents/` may exist in this folder for discovery testing. They are **not** portable plugin capabilities until Antigravity is confirmed to load them.

## Two independent modes

Choose **one**:

1. **Plugin:** `agy plugin install /absolute/path/to/opsphere-antigravity`
2. **MCP-only:** add the same gateway as `serverUrl` in `~/.gemini/config/mcp_config.json`. Do not use this package's Agent Plugins `mcp.json` there.

Do not enable the plugin and a manual MCP entry named `opsphere` at the same time. That duplicates the server.

## Install

```sh
agy plugin install /absolute/path/to/opsphere-antigravity
agy plugin validate ~/.gemini/config/plugins/opsphere
```

Official install path: `~/.gemini/config/plugins/opsphere/`. Validate must report `mcpServers` processed.

`.agents/plugins/opsphere/` and `~/.gemini/antigravity-cli/plugins/opsphere/` are experimental and unsupported.

## OAuth (CIMD)

Expected identity (do not configure these yourself):

- `client_id`: `https://antigravity.google/oauth/client-metadata.json`
- callback: `https://antigravity.google/oauth-callback`

Flow: Antigravity discovers OAuth, uses the CIMD client_id, starts PKCE S256, opens the browser. Sign in with the same email as your other Opsphere clients and choose a workspace. If Antigravity asks for a code, paste the **one-time** authorization code into the terminal. Do not log, share or document that code. Workspace preference is bound to this stable CIMD client_id; Antigravity does not create a new `dcr_*` client per install.

## Uninstall

```sh
agy plugin uninstall opsphere
```

Local removal does not revoke the server session or delete your account.

## First run

See [local examples](examples/local.md). Do not copy OAuth files from Cursor, Codex, Claude Code, Warp or OpenCode.

## Testing

Maintainer and reviewer steps: [docs/ANTIGRAVITY-TEST-CASES.md](../docs/ANTIGRAVITY-TEST-CASES.md). CI validates the package files. Live `agy` OAuth is a manual matrix and must not be marked passed without execution.
