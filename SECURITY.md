# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a vulnerability

**Do not** open public GitHub issues for security problems.

Email [contact@opsphere.io](mailto:contact@opsphere.io) with:

- Description of the issue and impact
- Steps to reproduce
- Affected plugin version and Cursor version (if relevant)

We aim to acknowledge within **2 business days** and provide a remediation timeline for confirmed issues.

**Cursor Marketplace users** may also report plugin security concerns to [security-reports@cursor.com](mailto:security-reports@cursor.com) ([Marketplace security](https://cursor.com/help/security-and-privacy/marketplace-security)).

**Publisher obligation (Cursor Marketplace):** we will notify Cursor at [legal@cursor.com](mailto:legal@cursor.com) of any security vulnerability, data breach, or other security incident affecting the plugin or plugin data, as required by the [Marketplace Publisher Terms](https://cursor.com/marketplace-publisher-terms).

---

## Security & Trust — Remote SaaS model

Opsphere is intentionally split into two parts:

| Component | Location | Auditable in this repo |
|-----------|----------|------------------------|
| **Cursor plugin** (this repo) | Your machine | Yes — MIT, manifest-only |
| **Opsphere gateway** (SaaS) | `https://mcp-cursor.opsphere.io` | No — proprietary backend |

The plugin bundle is **manifest-only** (markdown + JSON); **all MCP tool execution runs on the gateway**. See [docs/REMOTE-MCP-ARCHITECTURE.md](docs/REMOTE-MCP-ARCHITECTURE.md) for flow diagrams and the complete domain list.

**Blast radius if the remote service were compromised:** an attacker with full gateway access could, in the worst case, read stored integration credentials and invoke tools on behalf of tenants. We mitigate this with tenant isolation, encryption at rest, least-privilege tool gating, audit logging, and operational controls described below. Users who need zero third-party credential custody should not use remote MCP integrations.

---

## What Opsphere stores

| Data type | Stored server-side | Stored in plugin / Cursor |
|-----------|-------------------|---------------------------|
| OAuth access / refresh tokens | Hashed refresh tokens; JWT validation server-side | Managed by Cursor after Connect |
| Integration API keys (Datadog, AWS, GitHub, etc.) | Yes — encrypted at rest, scoped to one tenant | Never |
| Tool call parameters | Transient processing + usage metadata | Not persisted by plugin |
| Work context / operational memory (if enabled) | Yes — tenant-scoped, redacted before persist | Never |
| Your source code | No — unless you paste it in chat | Local workspace only |

Integration credentials are collected only when you explicitly configure a provider (via `ops_configure_integration` in chat). They are **not** written to disk by this plugin.

### Integration credential path

Third-party keys (AWS IAM, Datadog, GitHub PATs, etc.) follow a **single intake path**:

1. User starts setup (`Configure my [Provider]` / `configure-integration` skill).
2. Agent calls **`ops_configure_integration`** over HTTPS to `mcp-cursor.opsphere.io`.
3. Gateway validates keys against a whitelist, encrypts at rest, scopes to the user's tenant.

Credentials are **never** persisted in this Git repository, the Cursor plugin bundle, or local plugin files. Chat history may contain user-typed secrets if they paste outside the guided flow — the plugin rules instruct agents to avoid that and route through `ops_configure_integration` only.

**Gateway backend (proprietary, not in this repo):** encrypted storage per tenant; credential values omitted from application logs; `ops_list_integrations` returns masked previews only; audit events recorded for configure/remove actions (`credential.set`, `credential.deleted`) with tenant/user metadata but without secret payloads.

---

## Encryption & transport

- **In transit:** TLS 1.2+ for all traffic to `mcp-cursor.opsphere.io` and third-party provider APIs.
- **At rest:** Integration credentials and sensitive tenant data are encrypted before persistence in Opsphere's database (per-tenant encryption keys derived from platform secrets).
- **In logs:** Credential values are never logged. Tool responses returned to Cursor mask secrets where applicable.

---

## Tenant isolation (no cross-tenant access)

Every authenticated request is bound to a **single tenant** derived from the OAuth/JWT identity:

- Database queries always filter by `tenant_id`.
- Credential lookups, tool gating, rate limits, and memory retrieval are tenant-scoped.
- There is no shared "public pool" of credentials or data between accounts.
- Free-tier users each receive an auto-provisioned isolated tenant (`subscription_id = public_free`).

Cross-tenant access is architecturally denied by default (fail-closed tool matrix + tenant context on every subprocess).

---

## Retention & deletion

| Data | Retention | User-initiated deletion |
|------|-----------|-------------------------|
| Integration credentials | Until removed or account suspended | `ops_remove_integration` in chat |
| OAuth refresh tokens | Until logout, rotation, or reuse detection revoke | Disconnect MCP in Cursor |
| Daily usage counters | Rolling; purged after ~90 days | N/A (metadata) |
| Suspended trial accounts | Credentials/sessions cleaned after 7 days suspended | Upgrade or contact support |
| Operational memory (if enabled) | Until invalidated or account deletion | `memory_invalidate`; account deletion request |
| Work context | Until overwritten or account deletion | `ops_set_work_context` (replace); account deletion request |

**Full account deletion:** email [contact@opsphere.io](mailto:contact@opsphere.io). We delete tenant data including credentials, sessions, and memory within our published SLA.

See also [docs/PRIVACY.md](docs/PRIVACY.md#revoking-access) for revoke steps.

---

## Authentication

- **Cursor users:** OAuth 2.0 Authorization Code + PKCE (`CLIENT_ID: cursor-mcp`). Cursor stores tokens; the plugin bundle contains no secrets.
- **Access tokens:** Short-lived JWT (24h). Refresh tokens rotated on use; reuse detection revokes all sessions.
- **Legacy `/api/plugin/*` endpoints:** Still available for direct signup/login; OAuth is the primary Cursor path.

---

## Network diagnostic tools (`dns_lookup`, `http_check`, `cert_status`)

These built-in tools perform outbound network checks **from the Opsphere gateway only** — the plugin bundle contains no HTTP/DNS client code and never initiates network requests on the user's machine.

| Control | Detail |
|---------|--------|
| **Execution location** | Server-side gateway only; not from the Cursor plugin package |
| **Rate limits** | Subject to the same per-tenant daily tool limits as other MCP tools (free tier: 100 calls/day; resets midnight UTC). Abuse triggers `RATE_LIMIT_EXCEEDED`. |
| **Intended use** | Legitimate SRE / incident-response workflows: verify DNS propagation, HTTP availability, and TLS certificate expiry for domains the user owns or is authorized to test |
| **Not intended for** | Unauthorized scanning, harassment, or probing third-party infrastructure without permission |

Users are responsible for ensuring they have authorization to test target hostnames. Opsphere may suspend accounts that violate acceptable use (see [Terms of Service](https://opsphere.io/terms)).

---

## Plugin bundle (this repository)

What ships in the marketplace package:

- Markdown rules, skills, commands
- JSON manifests (`mcp.json`, `.cursor-plugin/`)
- One CI helper only (`scripts/ci-validate.sh`) — **no** hooks, **no** auto-run scripts on workspace open
- **No** `preinstall` / `postinstall` / `prepare` npm lifecycle hooks; **zero** npm runtime dependencies
- **No** embedded API keys, backend tool logic, or exfiltration/network client code

**Cursor security review (flags #5–6):** *"Security agent confirmed no secrets, no install hooks, no exfiltration in bundle."*

**Public CI (auditable on GitHub):**

| Job | File | Purpose |
|-----|------|---------|
| Validate | [`scripts/ci-validate.sh`](scripts/ci-validate.sh) | Manifests, frontmatter, logo paths, version sync, no secrets in tree, no `workspaceOpen` hooks, public MCP URL, hygiene |
| Gitleaks | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Full git history scan for leaked credentials on every push/PR to `main` |

Reproduce locally: `npm test`

---

## Scope

**In scope for vulnerability reports**

- This repository (plugin manifest, rules, skills, commands, docs)
- Public Opsphere gateway endpoints referenced in `mcp.json`
- OAuth2 / MCP authentication flow as exposed to Cursor users

**Out of scope**

- Proprietary Opsphere backend source (not published)
- Vulnerabilities in third-party provider APIs (Datadog, Vercel, AWS, etc.)

---

## Legal & policies

- **Terms of Service:** https://opsphere.io/terms
- **Privacy Policy:** https://opsphere.io/privacy
- **Status page:** https://status.opsphere.io

User-facing summary: [README.md — Security](README.md#security) · [docs/PRIVACY.md](docs/PRIVACY.md)

For marketplace reviewers: copy-paste trust summary in [docs/SECURITY-AND-TRUST.md](docs/SECURITY-AND-TRUST.md). Architecture: [docs/REMOTE-MCP-ARCHITECTURE.md](docs/REMOTE-MCP-ARCHITECTURE.md).
