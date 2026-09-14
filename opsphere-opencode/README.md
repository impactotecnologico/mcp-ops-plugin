# Opsphere for OpenCode

Use the [official generated OpenCode connection guide](guides/opencode.md) for the endpoint, literal MCP configuration, OAuth, plan compatibility and troubleshooting. The guide and MCP resources are generated from one canonical connection contract, not maintained separately here.

Package version **1.0.0**. This folder does not change the Cursor, Codex or Claude Code plugin bundles.

## Obtain the package

Follow the public package availability check in the guide before downloading. MCP-only setup needs no package. This folder adds portable skills, OpenCode agents and commands, AGENTS.md rules and local examples. No credentials are included.

## Install in a project

Requires Node.js 20 or newer. From this obtained package folder, in a **throwaway project** (do not install into the Opsphere plugin repository):

```sh
node install.mjs install /absolute/path/to/your-project
```

The installer merges `opencode.json`, adds a marked AGENTS.md section, and installs skills, agents and commands under `.opencode/`. It preserves other MCP entries and existing files; colliding skills or a different opsphere server stop installation before changes. It records ownership in `.opencode/opsphere-opencode-install.json`.

Then follow the guide: `opencode mcp auth opsphere` or `/mcps`. No authentication is performed by the installer. Global MCP-only configuration (`~/.config/opencode/opencode.json`) is documented in the guide; this installer is project-only. Avoid adding both global and project entries unintentionally.

For manual installation, merge [mcp/opsphere.json](mcp/opsphere.json) into `opencode.json`, copy `skills/`, `agents/` and `commands/` into `.opencode/`, and merge `rules/AGENTS.md`. Record the files you added; the uninstaller only manages its own manifest.

If your OpenCode build requires V2 `mcp.servers`, nest the same `opsphere` object under `mcp.servers` instead of `mcp.opsphere`. Keep `codemode` false and a catalog timeout of at least 60000 ms.

## First run

See [local examples](examples/local.md). Skills are not an import of another host's plugin engine. Do not copy `~/.local/share/opencode/mcp-auth.json` or any OAuth files from Cursor, Codex, Claude Code, Warp or Antigravity.

## Uninstall or upgrade

```sh
node install.mjs uninstall /absolute/path/to/your-project
```

Uninstall removes only the unchanged MCP entry it introduced and its exact rules block. Unchanged owned files are moved to `.opencode/opsphere-opencode-removed-<timestamp>/` for recovery. Edited files and pre-existing matching files are preserved and reported. Empty directories and config files may remain. No recursive project deletion is used.

For upgrades, uninstall the old package, review preserved edits, then install the new package. Keep the old package available until uninstall finishes.

Local removal does not revoke the server session or delete your account, integrations, workspace or subscription.

## Testing

Maintainer and reviewer steps: [docs/OPENCODE-TEST-CASES.md](../docs/OPENCODE-TEST-CASES.md).
