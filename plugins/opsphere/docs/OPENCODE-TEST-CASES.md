# OpenCode — test cases for Opsphere

**Package:** `opsphere-opencode/` 1.0.0  
**MCP gateway:** `https://mcp-cursor.opsphere.io/mcp`  
**Install:** project or user-global `node install.mjs` (does not modify Cursor, Codex or Claude Code).

**Related:** [opsphere-opencode/README.md](../opsphere-opencode/README.md) · [guides/opencode.md](../opsphere-opencode/guides/opencode.md) · [MULTICLIENT-SUPPORT.md](MULTICLIENT-SUPPORT.md)

Automated CI covers install/uninstall only. OAuth and live tools are a manual matrix. Do not mark unexecuted rows as passed.

## Prerequisites

1. OpenCode CLI (or desktop) that can load `opencode.json` MCP remotes.
2. A **throwaway git repo**, not this `mcp-ops-plugin` checkout (avoids writing `.opencode/` here).
3. Node.js 20+.
4. An Opsphere account (same email as other clients). Do not copy token files.

## Install

```bash
cd /path/to/opsphere-plugin/opsphere-opencode
node install.mjs install /absolute/path/to/test-project
```

Confirm:

- `opencode.json` contains `mcp.opsphere` (or `mcp.servers.opsphere` on V2) with `type: "remote"`, `timeout: 60000`, `codemode: false`.
- Other MCP servers were preserved.
- Skills, agents and commands exist under `.opencode/`.
- `AGENTS.md` has `opsphere-opencode` markers, not Warp markers.

Optional MCP-only check (separate project, no installer): from the project directory run `opencode mcp add opsphere --url https://mcp-cursor.opsphere.io/mcp`, then set `timeout` `60000` and `codemode` `false`. Do not run `mcp add` from a random directory; current OpenCode 1.x can write `~/.config/opencode/` instead of project `opencode.json`.

## Global installation

From `opsphere-opencode/`:

```sh
node install.mjs install --global
```

Use an isolated, absolute `XDG_CONFIG_HOME` for installer verification; set it consistently for OpenCode and uninstall too. The target is `$XDG_CONFIG_HOME/opencode/`, or `~/.config/opencode/` by default. Do not mix this with a project Opsphere install or a custom `OPENCODE_CONFIG` / `OPENCODE_CONFIG_DIR` override during verification.

Confirm:

- `skills/`, `agents/` and `commands/` are directly in the global directory; no nested `.opencode/` is created.
- The global `AGENTS.md` retains existing rules and contains the marked Opsphere block.
- The global `opencode.json` or existing `opencode.jsonc` retains other settings, servers and comments and adds the same MCP entry as project mode.
- Both JSON and JSONC existing together, conflicting package files and incompatible servers fail before writes.
- From a separate project without local Opsphere configuration, start a new OpenCode session; verify discovery of `endpoint-health`, `@endpoint-health`, and `/opsphere-welcome`. Complete OAuth and use the live checks below. These live checks remain manual, not automated passes.
- `node install.mjs uninstall --global` preserves edited files, changed MCP entries and edited rule blocks; unchanged owned files go to a recoverable `opsphere-opencode-removed-<timestamp>/` backup.
- A separate project installation can still be uninstalled using its original project command. Global uninstall does not touch it, or revoke OAuth.

## Authenticate

```bash
cd /absolute/path/to/test-project
opencode mcp list
opencode mcp auth opsphere
```

Or in OpenCode: `/mcps` → opsphere → sign in.

Success: list shows connected (not `needs authentication`). Credentials stay in OpenCode storage (`~/.local/share/opencode/mcp-auth.json`). Never copy Cursor/Codex/Claude token files.

If `invalid_redirect_uri`, record the callback shape and stop. Do not change `cursor-mcp` / `codex-mcp` / `claude-mcp` client IDs. Optional: `opencode mcp debug opsphere`.

## Live checks

Ask OpenCode (do not assert a fixed tool count):

1. Call `ops_my_usage` and `ops_accounts_list`. Confirm the intended workspace.
2. Run `opsphere-onboarding` without changing configuration.
3. Run `endpoint-health` against `https://example.com` (network tools need no integration).
4. Optionally `/opsphere-setup` and `/integration-status`.

## Uninstall

```bash
node install.mjs uninstall /absolute/path/to/test-project
```

Other MCP servers and edited skills remain. OAuth is **not** revoked.

## Cross-client regression

From `mcp-ops-plugin`:

```bash
npm test
```

Cursor, Codex and Claude Code manifests and MCP files must be unchanged except the shared generated connect guide. Completing OpenCode OAuth must not log out those clients. Warp installer tests must still pass.

## V2 schema fallback

If `opencode mcp list` rejects `mcp.opsphere`, nest the same object under `mcp.servers.opsphere` as documented in the package README. Keep `codemode: false`.
