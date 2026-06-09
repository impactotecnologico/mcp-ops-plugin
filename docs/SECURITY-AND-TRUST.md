# Security & Trust — Marketplace submission text

Use the block below in the Cursor Marketplace **security review / submission notes** field.

---

## Copy-paste for reviewers

**Product model**

Opsphere is a **remote MCP SaaS gateway**. This repository contains only the Cursor plugin (MIT): rules, skills, commands, and `mcp.json` pointing to `https://mcp-cursor.opsphere.io/mcp`. The proprietary backend is not in this repo by design — same pattern as other remote MCP servers (hosted API + thin IDE client). Full architecture: [docs/REMOTE-MCP-ARCHITECTURE.md](REMOTE-MCP-ARCHITECTURE.md).

**Remote MCP + OAuth (reviewer note — Cursor flag #3)**

- **Intentional design:** thin client; **all tools run on Opsphere gateway** — not locally.
- **Single MCP endpoint:** `https://mcp-cursor.opsphere.io/mcp` (see `mcp.json`). OAuth on same host. No hidden URLs in the bundle.
- **No opaque code:** the submitted bundle is Markdown + JSON only — fully auditable on GitHub. No binaries, no install hooks, no embedded SDKs calling third parties from the client.
- **Trust model:** same class of risk as any **authenticated remote MCP** (or delegating to Datadog CLI / cloud APIs from an agent) — API access is centralized in one gateway with tenant isolation, rather than N separate local integrations.
- Provider APIs (Datadog, AWS, etc.) are contacted **server-side from the gateway only**, never from the plugin package.

**MCP governance (Cursor enterprise)**

The plugin declares a **single MCP server**; enterprise MCP blocklists apply as configured in Cursor — blocked servers cannot make calls.

**No auto shell on workspace open (reviewer note — Cursor flag #4)**

- Removed `hooks/hooks.json` and `scripts/check-auth.sh`. The plugin **never** executes shell on workspace open.
- Welcome content moved to user-invoked slash command **`/opsphere-welcome`** (Markdown only). Documented in README, INSTALL, and onboarding rule.
- Only `scripts/ci-validate.sh` remains (maintainer CI — not invoked by Cursor at runtime).

**What we store (server-side only)**

- OAuth refresh token hashes and session metadata (after user clicks Connect)
- Integration API credentials **only when the user explicitly configures a provider** via `ops_configure_integration`
- Optional work context and operational memory (tenant-scoped, redacted)
- Usage metadata for plan limits (tool name, tenant, timestamp — not source code)

We do **not** receive the user's workspace source code unless they paste it in chat.

**Integration credentials (reviewer note — Cursor flag #2)**

- Plugin rules instruct agents to collect provider keys **only** during `configure-integration` and transmit them **only** via MCP tool `ops_configure_integration` to the gateway — not into repo files, not into local plugin storage.
- Users should not paste secrets in free-form chat; onboarding rule enforces guided flow.
- **Gateway backend (not auditable in this repo):** credentials encrypted at rest; plaintext values never logged; `ops_list_integrations` masks values; audit trail records configure/delete events (tenant, user, provider — no secret payload).
- Plugin bundle contains **no** credential storage code — only markdown guidance pointing at the remote tool.

**Security controls**

- TLS for all client ↔ gateway traffic
- Credentials encrypted at rest; never logged in plaintext
- Strict **per-tenant isolation** — every DB query scoped by `tenant_id`; no cross-tenant credential or data access
- Fail-closed tool gating for free tier (deny-by-default matrix)
- OAuth 2.0 + PKCE; refresh token rotation with reuse detection
- User can revoke: disconnect MCP, `ops_remove_integration`, or email account deletion

**Retention & deletion**

- Credentials removed on user request or after account suspension cleanup
- Usage metadata purged on rolling schedule (~90 days)
- Full account deletion: contact@opsphere.io

**Clean bundle — positive (reviewer note — Cursor flags #5–6)**

> **Security agent confirmed no secrets, no install hooks, no exfiltration in bundle.**

The submitted plugin is **Markdown + JSON only** — fully auditable in the public repo. No binaries, no hidden network clients, no credential storage code.

**Automated checks (visible on GitHub):**

| Check | Where | What it validates |
|-------|--------|-------------------|
| **Manifest & hygiene** | [`scripts/ci-validate.sh`](../scripts/ci-validate.sh) · [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Required manifests, JSON syntax, commands/skills frontmatter (`name` + `description`), logo file exists, no `..`/absolute paths in manifests, version sync `plugin.json` ↔ `marketplace.json`, no `hooks/hooks.json` / `workspaceOpen`, no `.env` committed, no high-confidence secret patterns, no private IPs, `_internal/` not tracked, public MCP URL only, no npm install lifecycle hooks, only maintainer script in `scripts/` |
| **Secret scan (full history)** | Gitleaks in CI | No leaked tokens/keys in git history on every push/PR to `main` |

Run locally: `npm test` (same as CI validate job).

**Plugin bundle hygiene (summary)**

- No embedded secrets, no install hooks, **no `workspaceOpen` shell hooks**, **no exfiltration code**
- `package.json` has no `preinstall` / `postinstall` / `prepare` scripts; **zero npm runtime dependencies**
- Welcome via **`/opsphere-welcome`** (user-invoked Markdown command — no bash at runtime)
- Only `scripts/ci-validate.sh` in `scripts/` (maintainer CI — **not** invoked by Cursor at runtime)
- Public repo: https://github.com/impactotecnologico/mcp-ops-plugin

**Policies**

- Security policy: [SECURITY.md](../SECURITY.md)
- Privacy: [docs/PRIVACY.md](PRIVACY.md) · https://opsphere.io/privacy
- Terms: https://opsphere.io/terms
- Contact: contact@opsphere.io
- **No model training:** Opsphere does not use plugin data, tool parameters, or user credentials for AI model training (Publisher Terms §6.3).
- **Incident notification:** Publisher will notify Cursor at legal@cursor.com of security incidents affecting the plugin or plugin data.
- **User reports:** Marketplace users may report plugin issues to security-reports@cursor.com.

**Acknowledged risk**

Users who configure integrations delegate API access to Opsphere to proxy calls to Datadog, AWS, GitHub, etc. Blast radius is bounded by tenant isolation and encryption, but users should treat Opsphere like any SaaS that holds API keys — configure least-privilege keys and revoke when uninstalling.

---

## Short version (if character limit)

Thin client remote MCP (MIT). All tools on `mcp-cursor.opsphere.io`. No opaque bundle code. **Security agent confirmed no secrets, no install hooks, no exfiltration in bundle.** CI: `scripts/ci-validate.sh` + Gitleaks on every push ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)). OAuth PKCE. See REMOTE-MCP-ARCHITECTURE.md
