# Opsphere for Antigravity

Use the [official generated Antigravity connection guide](guides/antigravity.md) for the endpoint, `serverUrl` MCP configuration, OAuth, plan compatibility and troubleshooting. The guide and MCP resources are generated from one canonical connection contract, not maintained separately here.

Package version **1.0.0**. This folder does not change the Cursor, Codex or Claude Code plugin bundles. There is no `hooks.json`.

## Obtain the package

Follow the public package availability check in the guide before downloading. MCP-only setup needs no package. This folder is a native Antigravity plugin (`plugin.json`, `mcp_config.json`, skills, rules, agents). No credentials are included.

## Install

Requires Node.js 20 or newer. From this obtained package folder:

Workspace (recommended for testing; do not install into the Opsphere plugin repository unless you intend that workspace to load the plugin):

```sh
node install.mjs install workspace /absolute/path/to/your-project
```

Global IDE:

```sh
node install.mjs install global
```

The workspace installer copies the plugin to `.agents/plugins/opsphere/` and records `.agents/opsphere-antigravity-install.json`. Global install uses `~/.gemini/config/plugins/opsphere/`. Colliding files or a divergent existing `opsphere` plugin stop installation before changes. Sibling plugins are never deleted.

Then reload the workspace or CLI and complete browser OAuth. No authentication is performed by the installer.

Do **not** also add `opsphere` to `~/.gemini/config/mcp_config.json` or `.agents/mcp_config.json` when this plugin already defines `serverUrl` — Antigravity would load the catalog twice.

Optional CLI staging (not required for IDE tests):

```sh
agy plugin install /absolute/path/to/opsphere-antigravity
```

That copies into `~/.gemini/antigravity-cli/plugins/opsphere/`. Prefer one install location.

There is no default `disabledTools` list. Authorization stays on the gateway. If a session hits context limits, hide unused provider prefixes locally — do not fork the published plugin to drop entitled tools.

## First run

See [local examples](examples/local.md). If the IDE ignores plugin `agents/`, use the matching skills. Do not copy OAuth files from Cursor, Codex, Claude Code, Warp or OpenCode.

## Uninstall, upgrade, rollback

```sh
node install.mjs uninstall workspace /absolute/path/to/your-project
node install.mjs uninstall global
```

Uninstall moves unchanged owned files to a timestamped recovery directory. Edited files are preserved and reported. Empty directories may remain.

For upgrades, uninstall the old package, review preserved edits, then install the new package. Keep the old package available until uninstall finishes. CLI users can `agy plugin disable opsphere` without deleting files.

Local removal does not revoke the server session or delete your account, integrations, workspace or subscription.

## Testing

Maintainer and reviewer steps: [docs/ANTIGRAVITY-TEST-CASES.md](../docs/ANTIGRAVITY-TEST-CASES.md).
