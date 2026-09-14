# Antigravity — test cases for Opsphere

**Package:** `opsphere-antigravity/` 1.0.0  
**MCP gateway:** `https://mcp-cursor.opsphere.io/mcp`  
**Install:** workspace or global plugin copy (does not modify Cursor, Codex or Claude Code).

**Related:** [opsphere-antigravity/README.md](../opsphere-antigravity/README.md) · [guides/antigravity.md](../opsphere-antigravity/guides/antigravity.md) · [MULTICLIENT-SUPPORT.md](MULTICLIENT-SUPPORT.md)

Automated CI covers install/uninstall only. OAuth and live tools are a manual matrix. Do not mark unexecuted rows as passed.

## Prerequisites

1. Antigravity IDE and/or CLI (`agy`).
2. A throwaway project for workspace install.
3. Node.js 20+.
4. An Opsphere account (same email as other clients). Do not copy token files.

## Workspace install (IDE)

```bash
cd /path/to/opsphere-plugin/opsphere-antigravity
node install.mjs install workspace /absolute/path/to/test-project
```

Confirm `.agents/plugins/opsphere/` contains `plugin.json`, `mcp_config.json` with `serverUrl` (not `url` / `httpUrl`), skills, `rules/opsphere.md` and agents. There is no `hooks.json` and no default `disabledTools`.

Reload the workspace. Customizations / MCP Servers should list `opsphere`. Complete browser OAuth.

Confirm there is **no** duplicate `opsphere` entry in `~/.gemini/config/mcp_config.json` or `.agents/mcp_config.json`.

## Live checks

1. Call `ops_my_usage` and `ops_accounts_list`. Do not assert a fixed tool count.
2. Run `opsphere-onboarding` without changing configuration.
3. Run `endpoint-health` against `https://example.com`.
4. If IDE ignores plugin agents, the matching skills still cover the same intents.

If `invalid_redirect_uri`, report the callback shape. Do not change existing static OAuth client IDs for Cursor, Codex or Claude Code.

## Global IDE install (optional)

Use a profile you can reset:

```bash
node install.mjs install global
```

Plugin path: `~/.gemini/config/plugins/opsphere/`. Reload Antigravity, authenticate, then:

```bash
node install.mjs uninstall global
```

## CLI

```bash
agy plugin install /absolute/path/to/opsphere-antigravity
```

1. `/mcp` overlay: server connected after OAuth.
2. `/skills` lists Opsphere skills. Run onboarding + endpoint-health.
3. `agy plugin disable opsphere` / `agy plugin enable opsphere` without deleting files.

CLI staging uses `~/.gemini/antigravity-cli/plugins/opsphere/`. Prefer one location (IDE plugin **or** CLI staging), not both plus a raw `mcp_config.json` entry.

## Uninstall

```bash
node install.mjs uninstall workspace /absolute/path/to/test-project
```

Edited plugin files are preserved; unchanged owned files move to a recovery directory. OAuth is **not** revoked.

## Cross-client regression

From `mcp-ops-plugin`:

```bash
npm test
```

Cursor, Codex and Claude Code must keep their existing plugin/MCP files. Completing Antigravity OAuth must not log out those clients. Warp and OpenCode installer tests must still pass.
