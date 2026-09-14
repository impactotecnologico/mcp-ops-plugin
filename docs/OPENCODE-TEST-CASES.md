# OpenCode — test cases for Opsphere

**Package:** `opsphere-opencode/` 1.0.0  
**MCP gateway:** `https://mcp-cursor.opsphere.io/mcp`  
**Install:** project-only `node install.mjs` (does not modify Cursor, Codex or Claude Code).

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
