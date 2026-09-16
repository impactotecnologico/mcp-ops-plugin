# Multiclient support and recovery

The same account can connect independently from supported local clients. Global access is already enabled; there is no pending canary invitation. Use the [generated connection guide](../skills/connect-another-client/references/connect.md) and the optional packages ([Warp](../opsphere-warp/README.md), [OpenCode](../opsphere-opencode/README.md), [Antigravity](../opsphere-antigravity/README.md), [GitHub Copilot CLI](../opsphere-copilot/README.md)), not copied setup instructions from old conversations.

This repository is the **single distribution repo** (`opsphere-io/opsphere-plugin`). Do not split Cursor, Claude, Codex, Copilot, Antigravity, OpenCode or Warp into separate GitHub repositories. Each host has its own descriptor; do not nest Claude or Codex inside [`plugins/opsphere/`](../plugins/opsphere/) (that directory is the generated Cursor marketplace package).

## Verified GitHub install matrix

Official source: `https://github.com/opsphere-io/opsphere-plugin`. Step-by-step Cursor and Codex flows remain in [INSTALL.md](INSTALL.md). OAuth still completes in the destination client; shipping a plugin does not replace gateway allowlisting.

| Client | Install from this GitHub repo | Descriptor | Notes |
|---|---|---|---|
| **Cursor** | Customize → Add Marketplace → Import from GitHub → `https://github.com/opsphere-io/opsphere-plugin`, then install **opsphere** | [`.cursor-plugin/marketplace.json`](../.cursor-plugin/marketplace.json) (`pluginRoot: plugins`, `source: opsphere`) | Nested package is [`plugins/opsphere/`](../plugins/opsphere/). |
| **Claude Code** | `claude plugin marketplace add opsphere-io/opsphere-plugin` then `claude plugin install opsphere@opsphere` | [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json) (`source: ./`) | Plugin root is the **repository root** (`.claude.mcp.json`, `skills/`, `agents/`). Do not point Claude `source` at `./plugins/opsphere`. |
| **Codex / ChatGPT** | `npx @openai/codex plugin marketplace add opsphere-io/opsphere-plugin --ref main` | [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json) (`source: ./`) | Plugin root is the **repository root** (`.codex-plugin/plugin.json`, `.mcp.json`). Do not put `"source": "github"` in the marketplace file. |
| **GitHub Copilot CLI** | `copilot plugin install opsphere-io/opsphere-plugin:opsphere-copilot` **or** `copilot plugin marketplace add opsphere-io/opsphere-plugin` then `copilot plugin install opsphere@opsphere` | [`.github/plugin/marketplace.json`](../.github/plugin/marketplace.json) (`source: ./opsphere-copilot`) | Copilot must not use `.claude-plugin/marketplace.json`. Local: `copilot plugin install /absolute/path/to/opsphere-copilot`. |
| **Antigravity** | Clone or extract, then `agy plugin install /absolute/path/to/opsphere-antigravity` | [`opsphere-antigravity/plugin.json`](../opsphere-antigravity/plugin.json) | Live `agy` **1.2.3**: a GitHub tree URL is parsed (clone + subpath) but `opsphere-antigravity` is not on published `main` yet (`subpath not found`). Do **not** run `agy plugin install https://github.com/opsphere-io/opsphere-plugin` — that installs the Cursor/Claude repo root, not this package. Official path: `~/.gemini/config/plugins/opsphere/`. |
| **OpenCode** | Clone or extract, then from [`opsphere-opencode/`](../opsphere-opencode/README.md): `node install.mjs install /absolute/path/to/your-project` and `opencode mcp auth opsphere` | [`opsphere-opencode/opencode.json`](../opsphere-opencode/opencode.json) + installer | Not an OpenCode V2 JS plugin. Do not use `opencode plugin add github:…::path:opsphere-opencode` for this package. |
| **Warp local** | Clone or extract, then from [`opsphere-warp/`](../opsphere-warp/README.md): `node install.mjs install /absolute/path/to/your-project` | [`opsphere-warp/mcp/opsphere.json`](../opsphere-warp/mcp/opsphere.json) + installer | No `warp plugin install github:…`. Do not `npx skills add opsphere-io/opsphere-plugin` against root `skills/` (Cursor/Claude/Codex catalog). Warp/Oz cloud is out of support. |

## What to include in a support request

Email **contact@opsphere.io** with client name/version, plugin version, local versus cloud mode, approximate UTC timestamp, selected workspace label, operation name, and redacted error/status. Include whether the issue started after a reconnect, workspace change or upgrade. Never send access/refresh tokens, authorization codes, PKCE verifiers, credential files, provider secrets, or full unredacted logs. Share internal request/session identifiers only with private support when requested.

## Safe recovery

1. For a temporary MCP startup timeout, wait for the server to become ready and retry one read-only call. If it still fails, stop and collect the redacted error.
2. For authentication failures, use the client's normal OAuth flow. Do not copy another client's credentials or rewrite callback URLs.
3. After a requested workspace change, inspect the live tool catalog. A manual reconnect is a fallback, not proof that automatic catalog updates passed.
4. If usage breakdown is temporarily unavailable, the previous reader may be serving results because reconciliation failed. This must not change subscription limits or credentials.

## Removing a client and rolling back a package

Disconnecting MCP or deleting its configuration does **not** revoke server-side OAuth access. Removing an integration is also **not** client-session revocation. Ask support to identify and revoke only the intended client session; do not unlink a workspace to disconnect one application.

For Warp or OpenCode, run the explicit package uninstaller from the package version you installed; see that package README. For Antigravity, run `agy plugin uninstall opsphere`. For GitHub Copilot CLI, run `copilot plugin uninstall opsphere`. User-modified files are preserved where the client's uninstaller supports it. Keep other MCP entries and project rules. Uninstalling does not revoke OAuth or delete account data.

Plugin rollback means reinstalling a known published version using that client's supported installation flow. Do not copy cache folders or token files between clients. Gateway rollback and package rollback are separate operations; neither recovers usage events deleted by retention.

## Release verification boundary

Published manifests, downloadable sources and passing CI prove distribution, not an end-to-end pass for every client and plan. Warp cloud/Oz/Slack-triggered cloud agents remain outside this package's support scope. Copilot cloud agent remains outside the Copilot package's support scope. OpenCode and GitHub Copilot CLI continue to use DCR. Antigravity uses stable CIMD (`https://antigravity.google/oauth/client-metadata.json`, callback `https://antigravity.google/oauth-callback`); do not treat Antigravity as `dcr_*`. The operational release owner tracks the real-client matrix separately and must not mark unexecuted tests as passed.

Manual matrices: [OpenCode](OPENCODE-TEST-CASES.md), [Antigravity](ANTIGRAVITY-TEST-CASES.md), [Copilot](COPILOT-TEST-CASES.md), [Codex](CODEX-TEST-CASES.md).
