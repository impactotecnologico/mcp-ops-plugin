# Opsphere for GitHub Copilot CLI

Use the [official generated Copilot connection guide](guides/copilot.md) for the endpoint, Agent Plugins `mcp.json`, DCR OAuth, plan compatibility and troubleshooting. The guide is generated from the canonical connection catalog.

Package version **1.0.0**. This folder does not change the Cursor, Codex, Claude Code, Warp, OpenCode or Antigravity plugin bundles.

## Obtain the package

Follow the public package availability check in the guide before downloading. MCP-only setup needs no package. This folder adds Agent Plugins `plugin.json` and `mcp.json`, portable skills, and Copilot-specific agents, commands and rules under `com.github.copilot/`. No credentials are included.

## Install (plugin)

Choose **one** of:

```sh
copilot plugin install /absolute/path/to/opsphere-copilot
```

```sh
copilot plugin install opsphere-io/opsphere-plugin:opsphere-copilot
```

```sh
copilot plugin marketplace add opsphere-io/opsphere-plugin
copilot plugin install opsphere@opsphere
```

Then start a **new** Copilot CLI session. Confirm with `copilot plugin list` and `/skills list`. Do not enable a second MCP entry named `opsphere` while the plugin is installed.

Do not add a repo-root `marketplace.json`, `.github/mcp.json` or `.github/plugin/plugin.json` in this repository. Copilot's marketplace for this repo is `.github/plugin/marketplace.json` only.

## OAuth (DCR)

OAuth is client-managed. Copilot discovers authorization, uses PKCE S256 and attempts dynamic client registration. Sign in with the same email as your other Opsphere clients and choose a workspace. Do not configure `client_id`, callback, tokens or secrets in the plugin. Credentials stay in Copilot storage (`~/.copilot/mcp-oauth-config/`). Do not copy token files from another client.

## MCP-only (exclusive)

```sh
copilot mcp add --transport http opsphere https://mcp-cursor.opsphere.io/mcp
```

Do not install the plugin at the same time. Do not set a static bearer token or client secret.

## Package contents

- `plugin.json` (Agent Plugins 1.0)
- `mcp.json` (`type: streamable-http`, gateway `url` only)
- `skills/`
- `com.github.copilot/agents/` (`*.agent.md`)
- `com.github.copilot/commands/`
- `com.github.copilot/rules/`

There is no `hooks.json` and no `install.mjs`. Copilot reads agents, commands and rules from `com.github.copilot/`, not from a root `agents/` directory.

## Uninstall

```sh
copilot plugin uninstall opsphere
```

Local removal does not revoke the server session or delete your account.

## First run

See [local examples](examples/local.md). Copilot cloud agent remains outside this package's support boundary.

## Testing

Maintainer and reviewer steps: [docs/COPILOT-TEST-CASES.md](../docs/COPILOT-TEST-CASES.md). CI validates the package files. Live Copilot OAuth is a manual matrix and must not be marked passed without execution.
