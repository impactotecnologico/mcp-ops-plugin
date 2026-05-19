# MCP-Ops Plugin — Cursor Marketplace: Technical Inventory & Execution Plan

> **Date**: 2026-05-07 (updated 2026-05-19)  
> **Author**: Architecture / Security / Platform Review  
> **Status**: Draft v2.1 — Updated after tool enforcement gap closure  
> **Scope**: Public plugin layer for Cursor Marketplace. Private IP must remain in backend.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Ecosystem Overview — What We Have Today](#2-ecosystem-overview)
3. [Authentication Audit](#3-authentication-audit)
4. [MCP Architecture Audit](#4-mcp-architecture-audit)
5. [Tools Inventory — Public vs Private](#5-tools-inventory)
6. [Public vs Private Boundary](#6-public-vs-private-boundary)
7. [Proposed Public Repository Structure](#7-proposed-public-repository-structure)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Marketplace Checklist](#9-marketplace-checklist)
10. [Risk Assessment](#10-risk-assessment)
11. [Decision Log](#11-decision-log)
12. [Next Steps](#12-next-steps)

---

## 1. Executive Summary

MCP-Ops is a mature internal DevOps operations platform with **207+ tools** across **22 modules** (AWS, K8s, Datadog, Vercel, ArgoCD, Cloudflare, Sentry, Jira, Azure, Pingdom, Contentful, EKS/ECS sync, etc.), a multi-tenant backend (PostgreSQL), HTTP gateway, web chat with LLM agents, and an admin portal.

The goal is to extract a **thin public plugin** for the Cursor Marketplace that:
- Authenticates users via API key against our private backend
- Proxies MCP tool calls through our HTTP gateway
- Exposes a **curated subset of max 2 tools per provider** (the most useful, read-only)
- Keeps all proprietary logic (orchestration, LLM agents, correlation engine, premium features, tenant management) private
- Is commercially viable as a SaaS product (free tier + paid plans)

**The plugin is a client. The intelligence stays in the backend.**

### Multi-Tenant Architecture (current state)

The platform now operates with three tenants, each with a discriminated `TenantType`:

| Tenant | Slug | Type | Purpose |
|--------|------|------|---------|
| **Breitling** | `breitling` | `client` | Customer tenant — users, cloud accounts, credentials, tools |
| **Opsphere** | `opsphere` | `platform_admin` | Operators with cross-tenant visibility |
| **Opsphere Platform** | `opsphere-platform` | `platform_infra` | Opsphere's own infrastructure (future) |

`TenantType` is a discriminated union: `'client' | 'platform_admin' | 'platform_infra'`. The gateway resolves it from the API key and passes it through to the session pool and MCP subprocess.

### Key Architectural Decision: Multi-Tenant Isolation for Public Users

Each public plugin user gets their **own auto-provisioned tenant** (not a shared "PublicPlugin" tenant). This is critical because `tenant_credentials` are scoped per-tenant — a shared tenant would mean all users share the same Vercel/Datadog/etc. tokens. Auto-provisioned tenants with `subscription_id = 'public_free'` provide total isolation with zero schema changes. See [Section 5.3](#53-tenant-model-for-public-plugin-critical-architecture-decision) for the full analysis.

### Security Pre-requisites Completed (2026-05-19)

The following security hardening was implemented and deployed before this plan update:

- **Deny-by-default tool loading**: `tools-config-loader.ts` now treats modules missing from `tenant_tools` DB as `enabled: false` — JSON carry-over eliminated
- **Fail-closed on Postgres failure**: When `USE_POSTGRES_TOOLS_CONFIG=true` and DB loading fails, the MCP server registers ZERO tools (not the full JSON catalog)
- **Full DB matrix**: 22 modules × 2 profiles = complete `tenant_tools` coverage verified in production
- **Session pool hardening**: Session key is now `${userId}|${tenantId}|${tenantType}|${runtimeProfile}` (4 components). `MCP_API_KEY` stripped from subprocess env
- **Tenant rename**: Opsphere → Breitling (client tenant). Seed scripts renamed (`seed-breitling.ts`, `seed-breitling-tenant-data.ts`)

These fixes close the tool enforcement gap identified during the marketplace planning audit. See `mcp-ops-b/openspec/changes/close-tool-enforcement-gap/` for full implementation details.

---

## 2. Ecosystem Overview

### Repositories Audited

| Repository | Role | Tech |
|------------|------|------|
| **mcp-ops-b** | Core MCP server (207+ tools, 22 modules, prompts, resources) | TypeScript, @modelcontextprotocol/sdk, Express gateway |
| **mcp-ops-web-admin-api** | Admin/BFF REST API | Express, Zod, mcp-ops-db, Helmet |
| **mcp-ops-web-admin** | Admin portal (tenant/user/tool management) | Next.js 16, React 19, Tailwind, shadcn |
| **mcp-ops-web-chat** | Chat interface with LLM agent | Next.js 16, React 18, Tailwind, MCP client |
| **mcp-ops-db** | Database layer (migrations, repos, seeds) — published to CodeArtifact as npm package | PostgreSQL, pg driver, 39+ migrations, v1.17.2+ |
| **mcp-ops-infra** | Infrastructure as Code | Terraform (AWS ECS/ALB/RDS/WAF, Cloudflare) |
| **mcp-ops-plugin** | **EMPTY** — Target repo for public plugin | N/A (placeholder) |

### Current Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRIVATE BACKEND                          │
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│  │ Admin API │   │ HTTP Gateway │   │  MCP Server (stdio)  │   │
│  │ (Express) │   │  (Express)   │──▶│  207 tools, prompts  │   │
│  └─────┬─────┘   └──────┬───────┘   └──────────────────────┘   │
│        │                │                                       │
│  ┌─────▼─────────────────▼───────────────────────┐             │
│  │            PostgreSQL (mcp-ops-db)             │             │
│  │  tenants, users, api_keys, tools, sessions,   │             │
│  │  usage_events, token_usage, audit, cloud_accts │             │
│  └───────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
  ┌──────┴───────┐    ┌──────┴──────────┐
  │ Admin Portal │    │ Web Chat + LLM  │
  │  (Next.js)   │    │   (Next.js)     │
  └──────────────┘    └─────────────────┘

         ▲ ← NEW
         │
  ┌──────┴──────────────────┐
  │  Cursor Plugin (PUBLIC) │
  │  Auth + MCP Client      │
  │  → HTTP Gateway         │
  └─────────────────────────┘
```

---

## 3. Authentication Audit

### 3.1 What Exists Today

| Mechanism | Where | How It Works |
|-----------|-------|-------------|
| **API Keys (SHA-256 hashed)** | mcp-ops-db `tenant_api_keys` | Raw key prefixed `mcp_`, stored as SHA-256 hash. Lookup via `lookupByHash`. Active/expired check. Optional user-scoped (`user_id` FK). |
| **JWT (jsonwebtoken)** | Gateway `auth.ts`, Web Chat | Signed with `JWT_SECRET`. Claims: `userId`, `tenantId`, `tenantSlug`, `tenantType`, `username`, `isAdmin`. 24h expiry in web-chat. Gateway resolves `runtimeProfile` as `'web'` for JWT, `'cursor'` for API keys. |
| **Bcrypt passwords** | mcp-ops-db `tenant_users.password_hash` | Cost 12. Used for web-chat login. |
| **Cognito/ALB OIDC** | Admin API `require-auth.ts` | ALB-injected `x-amzn-oidc-data` header. Base64 decoded (no signature verification in app — ALB validates). |
| **Internal shared token** | Admin API `require-internal-token.ts` | `ADMIN_INTERNAL_TOKEN` (min 32 chars), constant-time comparison. BFF between admin-web and admin-api. |
| **AWS SSO sessions** | mcp-ops-db `user_aws_sessions` | Encrypted SSO tokens (AES-256-GCM via `AWS_SESSION_ENCRYPTION_KEY`). Refresh support. Per-user per-profile. |
| **Azure sessions** | mcp-ops-db `user_azure_sessions` | Same encryption pattern. Per-user per-tenant. Device code flow. |
| **Tenant identification** | `tenant-context.ts` | Via `OPS_TENANT_ID` env or `MCP_API_KEY` hash lookup. Resolved at process start. Exports `TenantType = 'client' \| 'platform_admin' \| 'platform_infra'`. |
| **Caller identity** | `caller-identity.ts` | Trusted boundary from env vars (`MCP_CALLER_USER_ID`, `MCP_CALLER_TENANT_ID`, `MCP_CALLER_TENANT_TYPE`, etc.). Local Cursor = admin. |
| **Role-based access** | `tenant_users.role` | `member` \| `tenant_admin`. Plus `allowed_tools` / `allowed_environments` JSONB arrays. |
| **Runtime profiles** | `tenant_tools.runtime_profile` | `default` \| `cursor` \| `web`. Tool enablement per profile. |
| **Tool gating (DB-authoritative)** | `tools-config-loader.ts` | Deny-by-default: modules missing from `tenant_tools` DB are disabled. Fail-closed: if Postgres fails and `USE_POSTGRES_TOOLS_CONFIG=true`, zero tools registered. |

### 3.2 Reusability Assessment

| Component | Reusable for Plugin? | Notes |
|-----------|---------------------|-------|
| API Key authentication | **YES — primary mechanism** | Plugin sends `Authorization: Bearer mcp_xxx`. Gateway resolves tenant. Perfect for Marketplace. |
| JWT (gateway internal) | **YES — transparent** | Gateway creates internal JWT after API key validation. Plugin doesn't need to know. |
| Bcrypt passwords | **NO** | Web-chat only. Plugin uses API key, not username/password. |
| Cognito/ALB OIDC | **NO** | Admin portal only. |
| Internal token | **NO** | BFF pattern, not for external clients. |
| AWS/Azure sessions | **Indirect** | Session lifecycle is per-user. Plugin user triggers SSO via tool calls. Backend manages tokens. |
| Tenant/caller context | **YES — transparent** | Gateway injects tenant context into child MCP process. Plugin user gets their tenant scope automatically. |
| Role/permissions | **YES — enforcement backend** | `allowed_tools` and `allowed_environments` filter tool availability. Backend enforces, plugin doesn't need to know. |

### 3.3 What Must Stay Private

- Password hashing logic and user management
- Session encryption keys and token storage
- Cognito/ALB integration
- Internal token mechanism
- Tenant resolution internals
- Role enforcement logic (backend enforces; plugin never sees)

### 3.4 What Plugin Needs

- **API Key storage**: Cursor settings / secure config
- **Bearer token header**: `Authorization: Bearer mcp_xxx`
- **Gateway URL**: Configurable endpoint
- **No secrets embedded**: API key entered by user, not in code

---

## 4. MCP Architecture Audit

### 4.1 Transport

| Mode | Transport | Protocol | Used By |
|------|-----------|----------|---------|
| **Local Cursor** | stdio | JSON-RPC (line-delimited) | Current internal usage |
| **HTTP Gateway** | HTTP POST `/mcp` | JSON-RPC over HTTP | Web Chat, **future plugin** |
| SSE | **NOT SUPPORTED** | Returns 405 | N/A |

**Decision for Plugin**: Use **HTTP transport** (`StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk`). The gateway already supports this. SSE is explicitly rejected (405) — design aligns with request/response over HTTP.

### 4.2 Server Boot Sequence (stdio mode)

1. Console shim (stdout → file only, stderr preserved)
2. `McpServer({ name: 'mcp-ops', version })` — version from package.json
3. Load tools config (JSON file)
4. Initialize tenant context (`initTenantContext`)
5. Populate Vercel brand prefix map from catalog
6. Load credentials from Postgres (`loadConfigFromPostgres`)
7. Load tools config from Postgres — **deny-by-default, fail-closed** (`loadToolsConfigFromPostgres`)
8. **Monkey-patch `registerTool`** for usage tracking + output enrichment
9. Register all tools, prompts, resources with effective config
10. Connect stdio transport + init MCP logging
11. Start EKS/ECS sync cron jobs

### 4.3 Gateway Architecture

```
Client (POST /mcp + Bearer token)
    │
    ▼
Express Gateway (port from GATEWAY_PORT)
    │
    ├─ GET /health → { status, activeSessions, uptime }
    ├─ GET /mcp → 405 (SSE not supported)
    └─ POST /mcp + authMiddleware
         │
         ├─ Token prefix "mcp_" → API key lookup (partner key) → runtimeProfile='cursor'
         ├─ Otherwise → JWT verification → runtimeProfile='web'
         │
         ▼
    Session Pool (key = userId|tenantId|tenantType|runtimeProfile)
         │
         ├─ Get or create child process
         ├─ Inject env: MCP_CALLER_USER_ID, MCP_CALLER_TENANT_ID,
         │              MCP_CALLER_TENANT_TYPE, MCP_CALLER_IS_ADMIN,
         │              MCP_RUNTIME_PROFILE, OPS_TENANT_ID
         ├─ MCP_API_KEY stripped from subprocess env (security)
         ├─ Pipe JSON-RPC to child stdin
         ├─ Read response from child stdout (60s timeout)
         └─ Return response to client
```

### 4.4 Key Patterns

| Pattern | Implementation | Plugin Impact |
|---------|---------------|---------------|
| **Tool gating** | `withModuleRegistration` + Postgres `tenant_tools` (deny-by-default, fail-closed) | Transparent — backend filters tools, DB-authoritative |
| **Usage tracking** | `insertUsageEvent` (fire-and-forget) | Transparent — backend tracks |
| **Output enrichment** | Post-processing tool results | Transparent — backend enriches |
| **Error handling** | Tools return error in `text` content (not throw) | Plugin receives normal MCP responses |
| **Logging** | File + `sendLoggingMessage` to client | Plugin can display MCP log messages |
| **Progress** | `reportProgress` callback | Plugin can show progress indicators |
| **Schemas** | Zod → JSON Schema (via MCP SDK) | Plugin gets schemas from `listTools` |
| **Retries** | Integration-specific (Datadog 429, AWS SSO refresh) | Backend handles; plugin just waits |

### 4.5 Best Pattern for Plugin

The plugin should be a **thin MCP client** that:
1. Connects to gateway via HTTP POST
2. Sends `Authorization: Bearer mcp_xxx` header
3. Uses MCP SDK `Client` to call `listTools`, `callTool`, `listPrompts`, `getPrompt`
4. Displays tool results in Cursor
5. Handles MCP notifications (logging, progress)

**No tool logic in the plugin. No orchestration. No LLM. Just transport + auth + UX.**

---

## 5. Tools Inventory

### 5.1 Public Plugin Tool Selection (max 2 per provider)

The public plugin exposes a **curated subset**: maximum 2 tools per provider/category, selecting the most universally useful, read-only operations. This creates a natural free-tier ceiling and upsell path to premium (full catalog).

#### Public Plugin Tool Catalog (Free Tier)

| Provider | Tool 1 (primary) | Tool 2 (secondary) | Rationale |
|----------|-----------------|--------------------|-----------| 
| **AWS** | `aws_sso_login_remote` | `aws_sts_whoami` | Remote login essential for cloud access + identity verification |
| **AWS** (extra) | `aws_cli_query` | — | Generic read-only query covers many use cases in one tool |
| **Azure** | `azure_user_login_start` | `azure_user_login_poll` | Remote login essential for Azure access |
| **Azure** (extra) | `azure_cli_query` | — | Generic read-only query |
| **K8s** | `k8s_pods_list` | `k8s_logs` | Most common K8s operations: find pods + read logs |
| **Vercel** | `vercel_deploys_latest` | `vercel_project_status` | Deploy monitoring is the #1 Vercel use case |
| **Datadog** | `dd_logs_search` | `dd_errors_by_service` | Log search + error overview cover 80% of monitoring needs |
| **Cloudflare** | `cf_quick_status` | `cf_dns_records` | Zone health + DNS are the most universal CF queries |
| **Sentry** | `sentry_issues_list` | `sentry_issues_search` | Error tracking essentials |
| **GitHub** | `ghe_repo_summary` | `ghe_repo_prs` | Repo overview + PR listing |
| **Bitbucket** | `bb_pipelines_latest` | `bb_pipeline_diagnose` | Pipeline status + failure diagnosis |
| **Jira** | `jira_issue_get` | `jira_issues_search` | Issue lookup + search |
| **Diagnostics** | `dns_lookup` | `http_check` | Network diagnostics (no credentials needed) |
| **Diagnostics** (extra) | `cert_status` | — | TLS certificate check (no credentials needed) |
| **Plugin config** | `ops_configure_integration` | `ops_list_integrations` | **NEW** — credential management from Cursor |

**Total Public Plugin: ~33 tools** (vs 207 internal)

> **Note**: Diagnostics tools (`dns_lookup`, `http_check`, `cert_status`) require NO user credentials — they work out of the box. This provides immediate value before the user configures any integration.

#### Free Tier Limits

| Constraint | Value | Enforcement Point |
|-----------|-------|-------------------|
| **Trial duration** | **30 days** from signup | `tenant_api_keys.expires_at` (DB-enforced in `lookupByHash`) + `tenants.status` → `suspended` via cron |
| **Tools available** | ~33 (max 2 per provider) | `tenant_tools` in DB (FULL matrix — see Security section below) |
| **Rate limit** | TBD (e.g., 100 calls/hour) | Gateway middleware per API key |
| **Re-signup** | Allowed with different email | Creates a new tenant — accepted trade-off for MVP |

After 30 days without upgrading, the tenant's API key expires and tenant status is set to `suspended`. The gateway returns **401** on every request. User sees a clear message: "Free trial expired. Upgrade at dashboard.opsphere.io".

#### Upsell Path (Premium Tiers)

| Tier | Tools per Provider | Duration | Additional Features |
|------|-------------------|----------|-------------------|
| **Free** | 2 per provider (~33 tools) | **30 days** | Basic diagnostics, rate limited |
| **Pro** | 5 per provider (~80 tools) | Unlimited | Higher rate limits, all read-only tools |
| **Enterprise** | Full catalog (207+ tools) | Unlimited | Write operations, orchestration, LLM agent, custom prompts |

### 5.2 Full Internal Tool Catalog (reference)

The complete 207-tool catalog remains available for internal/enterprise tenants. Categorized here for reference:

```
Cloudflare .......... 35 tools (20 read + 15 write)
Azure ............... 23 tools (all read/session)
AWS ................. 20 tools (12 read + 8 auth)
GitHub Enterprise ... 15 tools (14 read + 1 write)
K8s ................. 14 tools (all read)
Bitbucket ........... 12 tools (all read)
Sentry .............. 11 tools (all read)
Repos ............... 9 tools (all read)
Contentful .......... 8 tools (all read)
Pingdom ............. 8 tools (all read)
Akamai .............. 8 tools (7 read + 1 write)
Diagnostics ......... 7 tools (all read)
Vercel .............. 7 tools (all read)
Datadog ............. 6 tools (all read)
Jira ................ 6 tools (all read)
Observability ....... 6 tools (all read)
EKS sync ............ 4 tools (context management)
ArgoCD .............. 4 tools (all read)
Confluence .......... 2 tools (all read)
Ops ................. 2 tools (1 read + 1 admin)
ECS sync ............ 1 tool (metadata sync)

Modules (tools-config-full.json): 22
Total tools: ~211
```

### 5.3 Tenant Model for Public Plugin (CRITICAL ARCHITECTURE DECISION)

#### The Problem: Credential Isolation

Current `tenant_credentials` table schema:
```sql
UNIQUE(tenant_id, tool_id, credential_key)  -- NO user_id column
```

`config-loader.ts` loads ALL credentials for a `tenantId` into the MCP process environment:
```typescript
const credentials = await getCredentialsForTenant(ctx.tenantId);
// Maps to process.env — shared by all users of that tenant
```

**If we use ONE shared "PublicPlugin" tenant:**
- User A's Vercel token = User B's Vercel token (SAME tenant_credentials row)
- User A could query User B's Datadog logs
- **TOTAL SECURITY FAILURE** — unacceptable

#### Options Evaluated

| | Option A: 1 Shared Tenant | Option B: 1 Tenant + user_credentials | Option C: Auto-Provisioned Tenant per User |
|---|---|---|---|
| Credential isolation | **NONE** — broken | Requires new table + schema + config-loader rewrite | **AUTOMATIC** — already works |
| Schema changes | None | `user_credentials` table, ALTER `config-loader`, ALTER `tools-config-loader` | None |
| Tool enablement | Works (`tenant_tools`) | Works | Works — seed template on signup |
| Session isolation | Works (pool key = `userId`) | Works | Works |
| Config-loader | No changes | **SIGNIFICANT rewrite** | No changes |
| Usage/billing | Hard (1 tenant) | Possible | **Natural** (per-tenant usage) |
| Signup flow | Create user in existing tenant | Create user + per-user creds | Create tenant + user + API key + seed tools |
| Scalability | Simple | Medium complexity | Thousands of tenants (needs automation) |

#### Decision: Option C — Auto-Provisioned Tenant per User

**Each public plugin user gets their own tenant**, auto-created on signup. The concept of "PublicPlugin" becomes a `subscription_id` value (e.g., `public_free`, `public_pro`), not a single tenant.

**Why this wins:**
1. **Zero schema changes** in mcp-ops-db
2. **Zero code changes** in config-loader, session-pool, tools-config-loader
3. **Total credential isolation** — each user's Vercel/Datadog/etc. tokens are in their own tenant
4. **Natural billing** — `usage_events` and `token_usage` already per-tenant
5. **Tool gating works** — `tenant_tools` already controls per-tenant; seed the 33-tool free set on signup
6. **Upgrade path** — changing `subscription_id` from `public_free` to `public_pro` and re-seeding `tenant_tools` unlocks more tools

**What we need to build:**
1. **Auto-signup endpoint** — `POST /api/public/signup` → creates tenant (slug auto-generated) + user + API key + seeds limited `tenant_tools`
2. **Tenant template** — Predefined `tenant_tools` seed for `public_free` plan (~33 tools, `runtime_profile = 'cursor'`)
3. **Credential registration tools** — See next section

#### How Users Register Their Credentials (Vercel, Datadog, etc.)

Since each user has their own isolated tenant, they need a way to store their API tokens.

**Primary: New MCP Tools (from Cursor directly)**

Two new backend tools (registered in the MCP server, not in the plugin):

| Tool | Parameters | Action |
|------|-----------|--------|
| `ops_configure_integration` | `provider: string, credential_key: string, credential_value: string` | Upserts into `tenant_credentials` for the caller's tenant. Restarts the MCP process to reload creds. |
| `ops_list_integrations` | — | Lists configured integrations for the caller's tenant (provider names + masked values, never raw tokens). |

**Flow from Cursor:**
```
User: "I want to connect my Vercel account"
Cursor AI: calls ops_configure_integration(provider="vercel", credential_key="VERCEL_TOKEN", credential_value="xxx")
Backend: stores in tenant_credentials for user's tenant → restarts MCP child process → new env loaded
User: "Show me my latest deploys"
Cursor AI: calls vercel_deploys_latest → works with user's own Vercel token
```

**Secondary: Web Dashboard (future)**

A lightweight dashboard at `dashboard.opsphere.io` where users can:
- Sign up and get their API key
- Configure integrations via UI (CRUD on `tenant_credentials`)
- View usage stats
- Upgrade plan

**Security for credential registration:**
- `ops_configure_integration` validates `credential_key` against a whitelist (only known env var names from `CREDENTIAL_MAP`)
- Values are stored encrypted at rest (PostgreSQL column encryption or application-level)
- Caller identity is verified via the API key → tenant resolution chain
- Credential values never appear in `listTools` responses or logs

#### SECURITY: Tool Enforcement Gap — CLOSED (implemented 2026-05-19)

> **Status: RESOLVED** — All 3 layers deployed. See `mcp-ops-b/openspec/changes/close-tool-enforcement-gap/` for implementation details.

The MCP server enforces tool access at **registration time** (not at call time). Tools are gated via `withModuleRegistration` and `registerToolIfEnabled`. If a tool is not registered, it cannot be called.

A critical carry-over vulnerability was identified and closed via a 3-layer defense:

| Layer | Fix | Status |
|-------|-----|--------|
| **1. Full DB matrix** | All 22 modules seeded in `tenant_tools` with explicit `is_enabled` flags. `verifyCoverage()` function in seed scripts validates completeness. | **DEPLOYED** |
| **2. Deny-by-default loader** | `tools-config-loader.ts` now disables modules missing from `tenant_tools` DB instead of carrying over from JSON. | **DEPLOYED** |
| **3. Fail-closed** | When `USE_POSTGRES_TOOLS_CONFIG=true` and Postgres fails, `index.ts` registers ZERO tools instead of falling back to full JSON. | **DEPLOYED** |

**Backward compatibility**: Ensured by seeding full `tenant_tools` coverage for all existing tenants (`breitling`, `opsphere`, `opsphere-platform`) before deploying the deny-by-default change.

**For future public_free tenants**: The full module matrix template (below) will be seeded on auto-signup:

```
Module              | is_enabled | runtime_profile
--------------------|------------|----------------
aws                 | true       | cursor          ← free pack
azure               | true       | cursor          ← free pack  
k8s                 | true       | cursor          ← free pack
vercel              | true       | cursor          ← free pack
datadog             | true       | cursor          ← free pack
cloudflare          | true       | cursor          ← free pack
sentry              | true       | cursor          ← free pack
github              | true       | cursor          ← free pack
bitbucket           | true       | cursor          ← free pack
jira                | true       | cursor          ← free pack
diagnostics         | true       | cursor          ← free pack
ops                 | true       | cursor          ← free pack (configure_integration)
akamai              | false      | cursor          ← BLOCKED
argocd              | false      | cursor          ← BLOCKED
confluence          | false      | cursor          ← BLOCKED
contentful          | false      | cursor          ← BLOCKED
observability       | false      | cursor          ← BLOCKED
repos               | false      | cursor          ← BLOCKED
repo                | false      | cursor          ← BLOCKED
pingdom             | false      | cursor          ← BLOCKED
eks-sync            | false      | cursor          ← BLOCKED
ecs-sync            | false      | cursor          ← BLOCKED
```

Plus `disabledTools` within enabled modules to limit to 2 tools per provider:

```json
{
  "aws": {
    "enabled": true,
    "disabledTools": [
      "aws_sso_login", "aws_sso_login_device_start", "aws_sso_login_device_poll",
      "aws_sso_login_global_start", "aws_sso_login_global_poll",
      "aws_sso_logout", "aws_session_revoke", "aws_session_status",
      "aws_ecr_repos", "aws_ecr_images", "aws_secretsmanager_list",
      "aws_secretsmanager_describe", "aws_codeartifact_packages",
      "aws_codeartifact_versions", "check_aws_session_for_env",
      "aws_cloudwatch_logs_search", "aws_cloudwatch_logs_groups"
    ]
  }
}
```

#### 30-Day Trial Enforcement

**Mechanism 1: API key expiration (already implemented)**

`tenant_api_keys.expires_at` is checked in `lookupByHash`:
```sql
WHERE ak.key_hash = $1
  AND ak.is_active = true
  AND t.status = 'active'
  AND (ak.expires_at IS NULL OR ak.expires_at > now())
```

On signup, set `expires_at = now() + interval '30 days'`. After expiry, every gateway request returns **401** — the key simply stops resolving.

**Mechanism 2: Tenant suspension (belt + suspenders)**

A daily cron job (in `mcp-ops-b/src/cron/` or external):
```sql
UPDATE tenants
SET status = 'suspended', updated_at = now()
WHERE subscription_id = 'public_free'
  AND created_at < now() - interval '30 days'
  AND status = 'active'
  AND id NOT IN (
    SELECT tenant_id FROM tenants WHERE subscription_id IN ('public_pro', 'enterprise')
  );
```

`tenants.status = 'suspended'` blocks:
- API key lookup (`t.status = 'active'` in query) → **401 at gateway**
- `initTenantContext` (`tenant.status !== 'active'` → skips context) → **MCP process has no tenant = no tools if Layer 3 is active**

**Mechanism 3: Clear user messaging**

When the gateway returns 401 for an expired key, the error response should include:
```json
{
  "error": "trial_expired",
  "message": "Your 30-day free trial has expired. Upgrade at https://dashboard.opsphere.io/upgrade",
  "code": "TRIAL_EXPIRED"
}
```

The plugin should detect this specific error code and show a helpful message in Cursor.

#### Isolation Guarantees Summary

```
┌─────────────────────────────────────────────────────────┐
│                   USER A (Tenant: usr_a_xxxxx)          │
│                                                         │
│  API Key: mcp_aaaa...  → Tenant A                      │
│  Credentials: { VERCEL_TOKEN: "user_a_token" }         │
│  Tools: 33 (public_free tier)                           │
│  MCP Process: isolated (session pool key = userId_A)    │
│  Usage: tracked under tenant_id_A                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   USER B (Tenant: usr_b_yyyyy)          │
│                                                         │
│  API Key: mcp_bbbb...  → Tenant B                      │
│  Credentials: { VERCEL_TOKEN: "user_b_token" }         │
│  Tools: 33 (public_free tier)                           │
│  MCP Process: isolated (session pool key = userId_B)    │
│  Usage: tracked under tenant_id_B                       │
└─────────────────────────────────────────────────────────┘

  ↑ ZERO shared state between User A and User B ↑
```

---

## 6. Public vs Private Boundary

### 6.1 Clear Separation

```
┌──────────────────────────────────────────────────────────────┐
│                    PUBLIC PLUGIN REPO                         │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Auth Client │  │  MCP Client  │  │  Config / Settings │ │
│  │  (API key    │  │  (HTTP POST  │  │  (gateway URL,     │ │
│  │   storage,   │  │   transport, │  │   API key input,   │ │
│  │   bearer     │  │   listTools, │  │   integration      │ │
│  │   header)    │  │   callTool)  │  │   preferences)     │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Tool Bridge │  │   Prompts    │  │   Docs / README    │ │
│  │  (thin proxy │  │  (list +     │  │   (install guide,  │ │
│  │   no logic)  │  │   display)   │  │   onboarding)      │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐                         │
│  │  Manifest    │  │   Tests      │                         │
│  │  (Cursor     │  │  (unit +     │                         │
│  │   plugin)    │  │   e2e mock)  │                         │
│  └─────────────┘  └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    PRIVATE BACKEND                            │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Tool Logic   │  │ Orchestration│  │  Correlation Engine │ │
│  │ (207 impls,  │  │ (multi-tool  │  │  (cross-tool        │ │
│  │  vendor SDKs,│  │  workflows,  │  │   analysis,         │ │
│  │  retries)    │  │  agent loop) │  │   enrichment)       │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Tenant Mgmt  │  │ Credentials  │  │  Usage / Billing   │ │
│  │ (DB, users,  │  │ (encrypted   │  │  (events, token    │ │
│  │  roles,      │  │  per-tenant  │  │   costs, monthly   │ │
│  │  permissions)│  │  storage)    │  │   views)           │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ LLM Agents   │  │ Session Mgmt │  │  Telemetry         │ │
│  │ (chat agent,  │  │ (AWS/Azure   │  │  (audit events,    │ │
│  │  summarizers, │  │  SSO tokens, │  │   request logs)    │ │
│  │  streaming)   │  │  encryption) │  │                    │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Premium Logic│  │  Infra / IaC │  │  Admin Portal      │ │
│  │ (enrichment, │  │  (Terraform, │  │  (web-admin,       │ │
│  │  auto-diag,  │  │   Docker,    │  │   web-admin-api)   │ │
│  │  digests)    │  │   ECS/ALB)   │  │                    │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Detailed Boundary Matrix

| Component | Public Plugin | Private Backend | Notes |
|-----------|:---:|:---:|-------|
| API key input + storage | **X** | | User enters key in Cursor settings |
| API key validation + tenant lookup | | **X** | Gateway does hash lookup |
| Bearer header construction | **X** | | `Authorization: Bearer mcp_xxx` |
| MCP HTTP transport | **X** | | `@modelcontextprotocol/sdk` client |
| Gateway server | | **X** | Express + session pool |
| Tool implementations | | **X** | All 207 tool handlers |
| Tool listing (from server) | **X** | | `listTools()` + display |
| Tool schemas | | **X** | Generated from Zod, served by MCP |
| Prompt listing + usage | **X** | | `listPrompts()` + `getPrompt()` |
| Prompt definitions | | **X** | 19 prompt templates |
| Resource listing | **X** | | `listResources()` + `readResource()` |
| Resource content | | **X** | Rules, catalogs, policies |
| Orchestration / correlation | | **X** | Output enrichment, auto-diag |
| LLM agent loop | | **X** | Chat agent, summarizers |
| Session management (AWS/Azure) | | **X** | Encrypted token storage |
| Usage tracking | | **X** | Events, token costs |
| Billing/licensing | | **X** | Subscription tiers (future) |
| Tenant/user management | | **X** | Admin portal |
| Credential storage | | **X** | Per-tenant encrypted creds |
| Error formatting | **X** | | Display error responses |
| Plugin manifest | **X** | | Cursor marketplace |
| Onboarding UI/config | **X** | | Settings page |
| Docs / README | **X** | | Public-facing |
| Telemetry (optional) | **X** | | Anonymous usage stats |

---

## 7. Proposed Public Repository Structure

```
mcp-ops-plugin/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Lint, test, typecheck
│   │   ├── release.yml         # Version bump + publish
│   │   └── security.yml        # Dependency audit
│   └── CODEOWNERS
├── src/
│   ├── index.ts                # Plugin entry point
│   ├── auth/
│   │   ├── api-key.ts          # API key storage (Cursor secrets API)
│   │   ├── auth-header.ts      # Bearer token construction
│   │   └── validate.ts         # Client-side key format validation
│   ├── mcp/
│   │   ├── client.ts           # MCP Client wrapper (HTTP transport)
│   │   ├── transport.ts        # HTTP transport config + retry
│   │   ├── types.ts            # MCP response types for plugin use
│   │   └── health.ts           # Gateway health check
│   ├── tools/
│   │   ├── registry.ts         # Local tool metadata cache
│   │   ├── formatter.ts        # Tool result formatting for Cursor
│   │   └── categories.ts       # Tool categorization for UI
│   ├── config/
│   │   ├── settings.ts         # Plugin settings schema
│   │   ├── defaults.ts         # Default gateway URL, timeouts
│   │   └── env.ts              # Environment detection
│   └── utils/
│       ├── errors.ts           # Error types + user-friendly messages
│       ├── logger.ts           # Plugin logging (debug mode)
│       └── version.ts          # Version checking
├── docs/
│   ├── INSTALL.md              # Installation guide
│   ├── CONFIGURATION.md        # Configuration reference
│   ├── TOOLS.md                # Available tools catalog
│   ├── TROUBLESHOOTING.md      # Common issues + fixes
│   └── SECURITY.md             # Security model explanation
├── tests/
│   ├── unit/
│   │   ├── auth/
│   │   ├── mcp/
│   │   └── config/
│   ├── integration/
│   │   └── gateway-mock.test.ts
│   └── fixtures/
│       └── mock-responses.ts
├── assets/
│   ├── icon.png                # 512x512 plugin icon
│   ├── icon-dark.png           # Dark theme variant
│   └── screenshots/            # Marketplace screenshots
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── .prettierrc
├── .gitignore
├── .env.example                # ONLY: MCP_OPS_GATEWAY_URL (no secrets)
├── LICENSE                     # Commercial / proprietary
├── README.md                   # Professional marketplace README
├── CHANGELOG.md
└── cursor-plugin.json          # Cursor Marketplace manifest
```

### 7.1 File Responsibilities

| File | Purpose |
|------|---------|
| `src/index.ts` | Registers MCP server config for Cursor. Reads settings, builds transport, exposes server. |
| `src/auth/api-key.ts` | Reads/writes API key from Cursor's secure storage. Prompts user on first use. |
| `src/auth/auth-header.ts` | Constructs `Authorization: Bearer mcp_xxx` for every request. |
| `src/mcp/client.ts` | Wraps `@modelcontextprotocol/sdk` Client with HTTP transport, auto-reconnect, timeout handling. |
| `src/mcp/transport.ts` | Configures `StreamableHTTPClientTransport` with auth headers and gateway URL. |
| `src/mcp/health.ts` | `GET /health` check before connecting. Shows connection status to user. |
| `src/tools/registry.ts` | Caches `listTools` results locally for fast lookup. Refreshes periodically. |
| `src/config/settings.ts` | Zod schema for plugin settings (gateway URL, API key ref, timeout, debug mode). |
| `cursor-plugin.json` | Marketplace manifest: name, version, description, MCP server config, settings schema. |

---

## 8. Implementation Roadmap

### Phase 0: Foundation (Week 1)

**Goal**: Repo scaffolding + CI + minimal structure

- [ ] Initialize `mcp-ops-plugin` repo with `package.json`, TypeScript, ESLint, Prettier, Vitest
- [ ] Create `cursor-plugin.json` manifest (minimal valid)
- [ ] Set up GitHub Actions: lint, test, typecheck
- [ ] Create `.env.example` with `MCP_OPS_GATEWAY_URL`
- [ ] Write initial `README.md` (professional, marketplace-ready)
- [ ] Design and create plugin icon/assets
- [ ] Add `LICENSE` file (commercial/proprietary)

### Phase 1A: Backend — Security Hardening (COMPLETED 2026-05-19)

**Goal**: Close tool enforcement gap before public launch

- [x] **[SECURITY]** Modify `tools-config-loader.ts` — deny-by-default: modules missing from DB are disabled
- [x] **[SECURITY]** Modify `index.ts` — fail-closed: register ZERO tools if Postgres config fails when expected
- [x] **[SECURITY]** Full DB matrix: 22 modules × 2 profiles seeded for all tenants with `verifyCoverage()`
- [x] **[SECURITY]** Session pool key: 4 components (`userId|tenantId|tenantType|runtimeProfile`)
- [x] **[SECURITY]** Strip `MCP_API_KEY` from subprocess environment
- [x] Tenant rename: Opsphere → Breitling (client). Seed scripts renamed (`seed-breitling.ts`, `seed-breitling-tenant-data.ts`)
- [x] Backward-compatible: all existing tenants verified with full `tenant_tools` coverage

### Phase 1B: Backend — Auto-Signup + Credential Management (Week 1-2)

**Goal**: Enable 30-day trials and self-registration

**In mcp-ops-db:**
- [ ] Create seed script for public_free tenant template — FULL module matrix (all modules in DB, only free pack enabled, all others `is_enabled: false`)
- [ ] Include `disabledTools` in `config_json` for enabled modules (limit to 2 tools per provider)
- [ ] Add index on `tenants.subscription_id` for plan-based queries
- [ ] Create cron SQL for 30-day trial expiration (suspend tenants with `subscription_id = 'public_free'` older than 30 days)

**In mcp-ops-web-admin-api (or new public API):**
- [ ] Create `POST /api/public/signup` endpoint (email + password → auto-creates tenant + user + API key with `expires_at = now() + 30 days`)
- [ ] Seed full `tenant_tools` matrix on signup (from public_free template)
- [ ] Add rate limiting on signup endpoint (5 per IP per hour)
- [ ] Add email verification flow (optional for MVP, required for launch)
- [ ] Return `TRIAL_EXPIRED` error code (403, distinct from generic 401) in `auth.ts`

**In mcp-ops-b (new MCP tools):**
- [ ] Implement `ops_configure_integration` tool — upserts `tenant_credentials` for caller's tenant
- [ ] Implement `ops_list_integrations` tool — lists configured providers with masked values
- [ ] Add credential key whitelist validation (only known keys from `CREDENTIAL_MAP`)
- [ ] Handle MCP process restart after credential change (kill + respawn subprocess)
- [ ] Write tests for credential isolation between tenants

**In mcp-ops-b (cron):**
- [ ] Add daily cron job: suspend `public_free` tenants older than 30 days
- [ ] Add daily cron job: cleanup expired sessions for suspended tenants

### Phase 2: Plugin — Authentication (Week 2)

**Goal**: API key entry + validation + secure storage

- [ ] Implement `src/auth/api-key.ts` — Cursor secure settings integration
- [ ] Implement `src/auth/auth-header.ts` — Bearer header construction
- [ ] Implement `src/auth/validate.ts` — Format validation (`mcp_` prefix, length)
- [ ] Write unit tests for auth module
- [ ] Test with real API key against gateway

### Phase 3: Plugin — MCP Client + Gateway Connection (Week 2-3)

**Goal**: Working MCP connection to backend

- [ ] Implement `src/mcp/transport.ts` — HTTP transport with auth headers
- [ ] Implement `src/mcp/client.ts` — Client wrapper with connect/disconnect/reconnect
- [ ] Implement `src/mcp/health.ts` — Gateway health check
- [ ] Handle gateway errors gracefully (401, 502, timeout, network)
- [ ] Write integration tests with mock gateway
- [ ] Test `listTools`, `callTool` end-to-end with limited tool set

### Phase 4: Plugin — Configuration + UX (Week 3)

**Goal**: User-friendly settings + error messages + onboarding

- [ ] Implement `src/config/settings.ts` — Settings schema with Zod
- [ ] Implement first-run onboarding flow (prompt for API key + gateway URL)
- [ ] Implement connection status indicator
- [ ] Implement helpful error messages (missing credentials → guide to `ops_configure_integration`)
- [ ] Write `docs/INSTALL.md`, `docs/CONFIGURATION.md`, `docs/TOOLS.md`

### Phase 5: Gateway Hardening (Week 3-4)

**Goal**: Gateway ready for public internet traffic

- [ ] Add per-API-key rate limiting (in-memory or Redis)
- [ ] Review and harden WAF rules for public traffic
- [ ] Add `GATEWAY_MAX_SESSIONS` autoscaling plan (ECS)
- [ ] Add monitoring/alerting for gateway metrics (sessions, latency, errors)
- [ ] Load test with simulated public traffic (100+ concurrent users)

### Phase 6: Packaging + Marketplace (Week 4)

**Goal**: Published on Cursor Marketplace

- [ ] Finalize `cursor-plugin.json` manifest
- [ ] Create marketplace screenshots
- [ ] Write professional `README.md` with badges, install instructions, screenshots
- [ ] Security audit (no secrets, no proprietary code, dependency audit)
- [ ] Write `CHANGELOG.md` for v1.0.0
- [ ] Write `docs/SECURITY.md`, `docs/TROUBLESHOOTING.md`
- [ ] Beta test with 5-10 external users
- [ ] Publish v1.0.0 to Cursor Marketplace

### Phase 7: Post-Launch (Week 5+)

- [ ] Monitor usage + errors per public tenant
- [ ] Implement telemetry (anonymous, opt-in)
- [ ] Build web dashboard (`dashboard.opsphere.io`) for integration management
- [ ] Implement free tier vs paid tier tool gating (change `subscription_id` + re-seed `tenant_tools`)
- [ ] Add Stripe billing integration to admin-api
- [ ] Add support for multiple gateway environments (staging, production)

---

## 9. Marketplace Checklist

### 9.1 Manifest Requirements

- [ ] Valid `cursor-plugin.json` with all required fields
- [ ] `name`: `mcp-ops` (or `opsphere`)
- [ ] `displayName`: Human-readable (e.g., "MCP-Ops — DevOps Operations")
- [ ] `version`: Semantic versioning (start at `1.0.0`)
- [ ] `description`: Concise, compelling (< 200 chars)
- [ ] `publisher`: Organization name
- [ ] `icon`: 512x512 PNG, light + dark variants
- [ ] `repository`: Public GitHub URL
- [ ] `license`: Specified (commercial or MIT with service terms)
- [ ] `engines.cursor`: Minimum supported version
- [ ] MCP server configuration (transport type, command/URL)
- [ ] Settings schema (API key, gateway URL)

### 9.2 README Quality

- [ ] Clear value proposition in first 3 lines
- [ ] Feature list with integration logos/badges
- [ ] Quick start (< 5 steps to first tool call)
- [ ] Screenshots / GIFs of plugin in action
- [ ] Configuration reference table
- [ ] Link to full docs
- [ ] Support / issues link
- [ ] Badge: version, license, CI status

### 9.3 Security

- [ ] **ZERO secrets in codebase** (verified by CI scan)
- [ ] API key stored in Cursor secure settings (never in `.env` or plain config)
- [ ] No proprietary business logic exposed
- [ ] No backend URLs hardcoded (configurable)
- [ ] `npm audit` clean (no critical/high vulnerabilities)
- [ ] `.gitignore` covers all sensitive patterns
- [ ] No `console.log` leaking sensitive data
- [ ] HTTPS enforced for gateway communication
- [ ] License file present

### 9.4 Error Handling

- [ ] Invalid/missing API key → clear message + link to get one
- [ ] Gateway unreachable → retry + helpful message
- [ ] 401 Unauthorized → "API key expired or invalid"
- [ ] 502 Bad Gateway → "Backend temporarily unavailable"
- [ ] Timeout → "Operation timed out, try again"
- [ ] Network error → "Check internet connection"
- [ ] Tool error → Display error content from response

### 9.5 Versioning

- [ ] Semantic versioning enforced
- [ ] `CHANGELOG.md` maintained
- [ ] Git tags for releases
- [ ] GitHub Releases with notes
- [ ] Version check against minimum gateway version (optional)

### 9.6 User Experience

- [ ] First-run setup takes < 2 minutes
- [ ] No CLI commands required for basic setup
- [ ] Connection status visible
- [ ] Tool discovery intuitive (categories, search)
- [ ] Error messages are actionable (not cryptic)
- [ ] Works offline gracefully (cached tool list, clear offline message)

### 9.7 Documentation

- [ ] `INSTALL.md` — Step-by-step installation
- [ ] `CONFIGURATION.md` — All settings explained
- [ ] `TOOLS.md` — Available tools with descriptions
- [ ] `TROUBLESHOOTING.md` — Common issues + solutions
- [ ] `SECURITY.md` — Security model + data handling
- [ ] In-plugin help links

---

## 10. Risk Assessment

### 10.1 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gateway SSE not supported | Medium | HTTP POST is sufficient for MCP. Monitor MCP SDK evolution for Streamable HTTP improvements. |
| 60s timeout for long tools | Medium | Add client-side timeout handling + progress indicators. Consider async pattern for very long operations. |
| Session pool scaling (GATEWAY_MAX_SESSIONS) | **High** | Default is 10 sessions. Public plugin could have 100s of concurrent users. Must implement per-gateway-instance limits + ECS autoscaling. Consider Redis-backed session routing for multi-instance. |
| Thousands of auto-provisioned tenants | **High** | DB queries on `tenants` and `tenant_tools` must scale. Add indexes on `subscription_id`. Implement cleanup for inactive tenants (no usage in 90 days). |
| MCP process restart after credential change | Medium | `ops_configure_integration` must gracefully terminate and respawn the user's MCP child process. Session pool already handles process lifecycle. |
| MCP SDK breaking changes | Low | Pin SDK version. Test against beta releases. |
| Cursor Marketplace API changes | Medium | Follow Cursor changelog. Maintain compatibility layer. |

### 10.2 Business Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| IP exposure via plugin | **Critical** | Plugin is a thin client. All logic stays in backend. Code review every PR. |
| Free tier abuse (mass signups) | **High** | Rate limiting on signup endpoint. Email verification. Usage quotas per `subscription_id`. Auto-suspend after abuse detection. |
| Credential storage liability | **High** | Users store their own third-party API tokens in our DB. Must encrypt at rest. Clear ToS that we store tokens only for service delivery. SOC 2 consideration for trust. |
| Competitor reverse engineering | Medium | Plugin has no tool logic to reverse engineer. Backend is the moat. |
| Support burden | Medium | Self-service docs, troubleshooting guide, community Discord. |
| Billing not implemented | Medium | Start with free tier. Add Stripe integration to admin-api before paid launch. |

### 10.3 Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| API key leakage | High | Cursor secure storage. Never log keys. Documentation warns users. |
| Cross-tenant credential leakage | **Critical** | Mitigated by design: each user = own tenant. `config-loader` loads only `ctx.tenantId` credentials. Session pool isolates by `userId`. No shared state. |
| Credential values in logs | High | `ops_configure_integration` must NEVER log credential values. Audit event stores masked value only. |
| Man-in-the-middle | Low | HTTPS enforced. Gateway behind ALB + TLS. |
| Plugin supply chain | Medium | Minimal dependencies. `npm audit` in CI. Lockfile committed. |
| Unauthorized tool access (outside free pack) | **CLOSED** | 3-layer defense deployed: (1) deny-by-default in `tools-config-loader.ts`, (2) fail-closed in `index.ts`, (3) full DB matrix with `verifyCoverage()`. See Section 5.3. |
| Trial bypass via re-signup | Low | Different email = new tenant = new 30 days. Accepted for MVP. Future: device fingerprinting or payment for signup. |
| Zombie tenants with stored credentials | Medium | Daily cron suspends `public_free` tenants after 30 days. Separate cron purges credentials for suspended tenants after 90 days. |

---

## 11. Decision Log

| Decision | Rationale | Status |
|----------|-----------|--------|
| **HTTP transport, not stdio** | Plugin runs in Cursor (not local terminal). HTTP gateway already exists. | Decided |
| **API key auth, not OAuth** | Simpler UX. Already implemented in backend. OAuth adds complexity for v1. | Decided |
| **Thin client, no tool logic** | Protects IP. Single source of truth for tool implementations. Easier updates. | Decided |
| **Backend enforces permissions** | Plugin doesn't need to know about tiers/roles. `listTools` returns only allowed tools. | Decided |
| **No LLM in plugin** | LLM agent is premium backend feature. Plugin users get Cursor's built-in AI + our tools. | Decided |
| **Max 2 tools per provider (free)** | Creates natural upsell path. Enough to demonstrate value. Limits support surface. | Decided |
| **30-day free trial** | `tenant_api_keys.expires_at` set on signup + daily cron suspends expired tenants. Re-signup with different email creates new tenant (accepted for MVP). | **Decided** |
| **Deny-by-default tool loading** | `tools-config-loader.ts` no longer carries over JSON modules missing from DB. Backward-compatible: all existing tenants have full `tenant_tools` coverage. | **Implemented** |
| **Full module matrix in DB** | 22 modules × 2 profiles seeded in `tenant_tools` for all tenants. `verifyCoverage()` validates completeness in seed scripts. | **Implemented** |
| **3-layer tool enforcement** | 1) Full DB matrix, 2) deny-by-default in loader, 3) fail-closed on Postgres error. No single point of failure. | **Implemented** |
| **4-component session key** | `userId\|tenantId\|tenantType\|runtimeProfile` ensures isolation across all dimensions. `MCP_API_KEY` stripped from subprocess env. | **Implemented** |
| **Tenant rename: Opsphere → Breitling** | Primary client tenant reflects actual customer. `opsphere` reserved for platform admin. Seed scripts and data scripts renamed. | **Implemented** |
| **3 tenant types** | `client`, `platform_admin`, `platform_infra` — discriminated union enables future multi-tenant scaling with proper access control. | **Implemented** |
| **mcp-ops-db as npm package** | Published to CodeArtifact (v1.17.2+). Shared dependency across mcp-ops-b, web-admin-api, web-chat. | **Implemented** |
| **Auto-provisioned tenant per user** | `tenant_credentials` is per-tenant only. Shared tenant = shared credentials = security disaster. One tenant per user gives total isolation with zero schema changes. | **Decided** |
| **`subscription_id` as plan identifier** | "PublicPlugin" is a plan, not a tenant. `subscription_id = 'public_free'` on each auto-created tenant. Enables plan-based tool gating via existing `tenant_tools`. | **Decided** |
| **MCP tools for credential registration** | `ops_configure_integration` lets users set their Vercel/DD/etc. tokens from Cursor directly. Stored in their isolated tenant. No web UI needed for MVP. | **Decided** |
| **Diagnostics tools without credentials** | `dns_lookup`, `http_check`, `cert_status` work immediately (no tokens needed). Provides instant value before integration setup. | Decided |
| **Start with free tier** | Build audience first. Monetize with premium tool sets + higher rate limits. | Decided |
| **Separate repo from monorepo** | Clean open-source repo. No risk of private code leakage. CI independent. | Decided |

---

## 12. Next Steps

### Immediate (This Week)
1. **Review this document** — Validate decisions, especially auto-provisioned tenant model
2. **Decide on branding** — `mcp-ops` vs `opsphere` for marketplace name
3. **Decide on license** — MIT (community goodwill) vs proprietary (control)
4. **Design signup flow** — Endpoint spec for auto-provisioned tenants

### Short Term (Weeks 1-2)
5. **Phase 0** — Scaffold plugin repo, CI, manifest
6. **Phase 1** — Backend: auto-signup endpoint + `ops_configure_integration` + `ops_list_integrations` tools
7. **Phase 2** — Plugin auth client
8. **Prepare gateway** — Rate limiting, `GATEWAY_MAX_SESSIONS` scaling plan, WAF rules

### Medium Term (Weeks 3-4)
9. **Phases 3-5** — Plugin MCP client + UX + gateway hardening
10. **Beta test** — Internal team + 5-10 external users
11. **Phase 6** — Marketplace submission

### Long Term (Month 2+)
12. **Web dashboard** — `dashboard.opsphere.io` for integration management and usage stats
13. **Billing integration** — Stripe in admin-api, plan enforcement via `subscription_id`
14. **Landing page** — Marketing site with signup
15. **SDK** — Optional TypeScript SDK for programmatic access (separate from plugin)
16. **Partner program** — API key management for resellers/MSPs
17. **Tenant lifecycle** — Auto-cleanup of inactive tenants (>90 days no usage)

---

## Appendix A: Environment Variables (Plugin Only)

The plugin should require **minimal** configuration:

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `MCP_OPS_API_KEY` | Yes | Cursor secure settings | API key (`mcp_` prefix) |
| `MCP_OPS_GATEWAY_URL` | No | Settings (default: production URL) | Gateway endpoint |
| `MCP_OPS_TIMEOUT` | No | Settings (default: 60000) | Request timeout (ms) |
| `MCP_OPS_DEBUG` | No | Settings (default: false) | Enable debug logging |

---

## Appendix B: Gateway Compatibility Requirements

For the plugin to work, the gateway (`mcp-ops-b/src/gateway`) needs:

| Feature | Current Status | Action Needed |
|---------|---------------|---------------|
| API key auth | **Ready** | None |
| POST /mcp | **Ready** | None |
| GET /health | **Ready** | None |
| Tool enforcement (deny-by-default) | **Ready** | None — 3-layer defense deployed |
| Session pool isolation | **Ready** | None — 4-component key + env stripping deployed |
| `TenantType` propagation | **Ready** | None — Gateway resolves and passes `tenantType` to session pool and MCP subprocess |
| CORS headers | **Not implemented** | Add if plugin calls gateway directly from browser context (unlikely for Cursor) |
| Rate limiting | **Not implemented at gateway** | **CRITICAL** — Add per-API-key rate limiting before public launch |
| Session pool scaling | **Default 10 sessions** | **CRITICAL** — Increase `GATEWAY_MAX_SESSIONS`, implement ECS autoscaling |
| Public WAF rules | **Partial** (WAF exists on ALB) | Review and harden rules for public internet traffic |
| Auto-signup endpoint | **Not implemented** | **CRITICAL** — Build `POST /api/public/signup` with tenant auto-provisioning |
| `TRIAL_EXPIRED` error code | **Not implemented** | Add specific 403 response in `auth.ts` for expired trial API keys (currently returns generic 401) |
| Credential management tools | **Not implemented** | **CRITICAL** — Build `ops_configure_integration` + `ops_list_integrations` |
| Process restart on cred change | **Not implemented** | After `ops_configure_integration`, kill+respawn the user's MCP child |
| Trial expiration cron | **Not implemented** | Daily cron: `tenants.status = 'suspended'` for expired `public_free` tenants |

## Appendix D: Tenant Auto-Provisioning Flow (Draft)

```
POST /api/public/signup
Body: { email, password }

1. Validate email format, password strength
2. Check email not already registered (across all tenants — query tenant_users.username)
3. Create tenant:
   - name: "user-{sanitized_email}"
   - slug: auto-generated (e.g., "pub-{nanoid}")
   - subscription_id: "public_free"
   - status: "active"
4. Create tenant_user:
   - username: email
   - password_hash: bcrypt(password, cost=12)
   - role: "tenant_admin"
   - allowed_tools: null (all tenant tools allowed — restricted by tenant_tools matrix)
5. Seed tenant_tools (FULL module matrix):
   - Insert rows for ALL modules in tools_catalog
   - Free pack modules: is_enabled=true, with disabledTools in config_json (limit to 2 per provider)
   - All other modules: is_enabled=false
   - runtime_profile: "cursor"
6. Create API key:
   - user_id: new user's ID
   - Generate raw key (mcp_pub_{random})
   - Store hash in tenant_api_keys
   - expires_at: now() + interval '30 days'    ← 30-DAY TRIAL
7. Return:
   - { apiKey: "mcp_pub_xxxxx", gatewayUrl: "https://mcp.opsphere.io", expiresAt: "2026-06-06T..." }
   - (raw key shown ONCE, never stored in plaintext)

Rate limit: 5 signups per IP per hour

DAILY CRON (trial expiration):
  UPDATE tenants SET status = 'suspended'
  WHERE subscription_id = 'public_free'
    AND status = 'active'
    AND created_at < now() - interval '30 days';
  -- Belt + suspenders: even if API key expires_at is bypassed somehow,
  -- tenant suspension blocks all access paths (API key lookup + tenant context init)
```

## Appendix E: Credential Registration Whitelist

The `ops_configure_integration` tool only accepts these known credential keys (from `CREDENTIAL_MAP` in `config-loader.ts`):

| Provider | Credential Key | Description |
|----------|---------------|-------------|
| Vercel | `VERCEL_TOKEN` | Vercel personal access token |
| Vercel | `VERCEL_TEAM_ID` | Vercel team ID |
| Datadog | `DD_API_KEY` | Datadog API key |
| Datadog | `DD_APP_KEY` | Datadog application key |
| Datadog | `DD_SITE` | Datadog site (e.g., datadoghq.eu) |
| Sentry | `SENTRY_AUTH_TOKEN` | Sentry auth token |
| Cloudflare | `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| GitHub | `GHE_TOKEN` | GitHub personal access token |
| GitHub | `GHE_BASE_URL` | GitHub Enterprise base URL |
| Bitbucket | `BB_USERNAME` | Bitbucket username |
| Bitbucket | `BB_APP_PASSWORD` | Bitbucket app password |
| Jira | `JIRA_HOST` | Jira instance URL |
| Jira | `JIRA_EMAIL` | Jira user email |
| Jira | `JIRA_API_TOKEN` | Jira API token |
| AWS | `AWS_ACCESS_KEY_ID` | AWS access key (for IAM static) |
| AWS | `AWS_SECRET_ACCESS_KEY` | AWS secret key (for IAM static) |
| Azure | `AZURE_TENANT_ID` | Azure tenant ID |

Any key NOT in this whitelist is rejected with a clear error message.

---

## Appendix C: Cursor Marketplace Manifest (Draft)

```json
{
  "name": "mcp-ops",
  "displayName": "MCP-Ops — DevOps Operations",
  "version": "1.0.0",
  "description": "30+ DevOps tools in your IDE. Query AWS, K8s, Vercel, Datadog, Cloudflare, Sentry, GitHub, Jira and more — directly from Cursor. Bring your own API tokens.",
  "publisher": "Opsphere",
  "icon": "assets/icon.png",
  "repository": "https://github.com/opsphere/mcp-ops-plugin",
  "license": "SEE LICENSE",
  "engines": {
    "cursor": ">=0.50.0"
  },
  "mcpServers": {
    "mcp-ops": {
      "transport": "http",
      "url": "${MCP_OPS_GATEWAY_URL}",
      "headers": {
        "Authorization": "Bearer ${MCP_OPS_API_KEY}"
      }
    }
  },
  "settings": {
    "mcp-ops.apiKey": {
      "type": "string",
      "description": "Your MCP-Ops API key (starts with mcp_)",
      "secret": true
    },
    "mcp-ops.gatewayUrl": {
      "type": "string",
      "description": "MCP-Ops gateway URL",
      "default": "https://mcp.opsphere.io"
    }
  },
  "keywords": ["devops", "kubernetes", "aws", "monitoring", "datadog", "vercel", "cloudflare", "mcp"]
}
```

> **Note**: The manifest format above is illustrative. Final format must comply with Cursor Marketplace specifications at time of submission. Research the exact schema before Phase 5.
