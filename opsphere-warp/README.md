# Opsphere for Warp local

Use the [official generated Warp connection guide](guides/warp.md) for the endpoint, literal MCP configuration, OAuth, plan compatibility and troubleshooting. The guide and MCP resources are generated from one canonical connection contract, not maintained separately here.

## Obtain the package

Follow the public package availability check in the guide before downloading. MCP-only setup needs no package. This folder adds eight skills, AGENTS.md rules, an agent catalog, a recommended profile checklist and local examples. No credentials are included.

## Install in a project

Requires Node.js 20 or newer.

### Install from the public repo

Warp has no `github:` plugin install command, so fetch only this folder of `https://github.com/opsphere-io/opsphere-plugin` with a sparse checkout and run the installer from it:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/opsphere-io/opsphere-plugin.git
cd opsphere-plugin
git sparse-checkout set opsphere-warp
node opsphere-warp/install.mjs install /absolute/path/to/your-project
```

Do not run `npx skills add opsphere-io/opsphere-plugin`: the repo-root `skills/` catalog is for Cursor, Claude Code and Codex, not Warp.

### Install from an obtained copy

From this obtained package folder:

```sh
node install.mjs install /absolute/path/to/your-project
```

The installer merges the project MCP config, adds a marked AGENTS.md section, and installs skills and their references in .agents/skills/. It preserves other MCP entries and existing files; conflicting skills, competing WARP.md or a different opsphere server stop installation before changes. It records ownership in .agents/opsphere-warp-install.json.

Then follow the guide to enable the project MCP and complete browser OAuth. No authentication is performed by the installer. Global MCP-only configuration is an alternative documented in the guide; avoid adding both global and project entries unintentionally.

For manual installation, copy the selected skill directories (including references) into .agents/skills/, merge rules/AGENTS.md and configure MCP from the guide. Record the files you added; the uninstaller only manages its own manifest.

## Profile and first run

Use [the recommended profile checklist](profiles/recommended.md), then ask Warp to run opsphere-onboarding. See [local examples](examples/local.md). Skills are not an import of another host's plugin engine.

## Screenshots

### Sign in (common to all clients)

Every Opsphere client opens the same browser sign-in page during OAuth.

| | |
|---|---|
| ![OAuth login](../assets/screenshots/oauth-login.png) | ![OAuth signup](../assets/screenshots/oauth-signup.png) |
| *Sign in with your existing account — browser-based OAuth2.* | *New user? Create a free account in seconds — no credit card required.* |

### Warp in action

_Screenshots coming soon._

<!-- Template: save the files as assets/screenshots/warp-<name>.png, then uncomment.
| | |
|---|---|
| ![Install](../assets/screenshots/warp-install.png) | ![Sign in](../assets/screenshots/warp-oauth-login.png) |
| *`node install.mjs install` output.* | *Browser OAuth sign-in after enabling the project MCP.* |
| ![Connected](../assets/screenshots/warp-connected.png) | ![First tool call](../assets/screenshots/warp-first-call.png) |
| *Opsphere MCP enabled and running in Warp.* | *First Opsphere skill or tool call.* |
-->

## Uninstall or upgrade

```sh
node install.mjs uninstall /absolute/path/to/your-project
```

Uninstall removes only the unchanged MCP entry it introduced and its exact rules block. Unchanged owned skill files are moved to .agents/opsphere-warp-removed-<timestamp>/ for recovery. Edited files and pre-existing matching files are preserved and reported; remove or merge them manually after review. Empty directories and config files may remain. No recursive project deletion is used.

For upgrades, uninstall the old package, review preserved edits, then install the new package. Keep the old package available until uninstall finishes.

Local removal does not revoke the server session or delete your account, integrations, workspace or subscription. Revoke only the relevant session separately when desired, using Opsphere's authorized session-management flow; contact support if that surface is unavailable to your account. Removing a Warp Agent Profile is a separate optional action in Warp.

Warp/Oz cloud and Slack-triggered cloud agents remain outside this package's Opsphere support boundary.
