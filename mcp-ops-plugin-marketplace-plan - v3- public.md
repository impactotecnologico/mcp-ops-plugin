MCP-Ops Plugin — Cursor Marketplace: Public SaaS Plugin Architecture & Execution Plan

Date: 2026-05-19
Author: Architecture / Security / Platform Review
Status: Draft v3.0 — SaaS-Native Remote MCP Architecture
Scope: Public Cursor Marketplace plugin with self-managed onboarding, automatic remote MCP configuration, isolated multi-tenant backend architecture, protected proprietary backend logic, and enterprise-ready scaling model.

⸻

Table of Contents

1. Executive Summary
2. Ecosystem Overview — Current Platform
    2.1.1 Current Multi-Tenant Architecture
3. Authentication Architecture
    3.8 Refresh Token Storage Architecture
    3.9 Gateway Dual-Auth Model
4. MCP Architecture Audit
5. Public Plugin Tool Strategy
6. Tenant Isolation Model (Critical Security Architecture)
    6.7 Public Free Tenant — DB Matrix Template
    6.8 Full Internal Tool Catalog (reference)
7. Credential Registration Architecture
8. Public vs Private Boundary
9. Public Plugin Repository Structure
10. Implementation Roadmap
    10.1 Still-Pending Backend Work
11. Marketplace Checklist (9 sub-sections)
12. Risk Assessment (Technical / Business / Security)
13. Decision Log
14. Next Steps
15. Appendix A — Plugin Environment Variables
16. Appendix B — Gateway Compatibility Requirements
17. Appendix C — Cursor Marketplace Manifest (Draft)
18. Appendix D — Tenant Auto-Provisioning Flow
19. Appendix E — Core Product Philosophy

⸻

1. Executive Summary

MCP-Ops is a mature internal DevOps operational intelligence platform composed of:

* 207+ MCP tools
* 22 provider modules
* PostgreSQL multi-tenant backend
* HTTP MCP gateway
* MCP subprocess session pools
* internal LLM agents
* observability pipelines
* operational enrichment
* usage tracking
* tenant-aware permissions
* runtime profiles
* secure credential storage
* infrastructure integrations

Current providers include:

* AWS
* Kubernetes
* Datadog
* Vercel
* Cloudflare
* Akamai
* Azure
* GitHub Enterprise
* Bitbucket
* Sentry
* Jira
* Pingdom
* Contentful
* ArgoCD
* Confluence
* Observability
* Diagnostics
* Repositories
* EKS/ECS sync

The goal is to launch Opsphere as a public Cursor Marketplace product without exposing proprietary backend logic.

The public plugin will:

* onboard users directly inside Cursor
* auto-configure remote MCP access
* authenticate against the backend
* expose a curated tool catalog
* manage sessions automatically
* provide self-service integration registration
* behave like a SaaS platform inside Cursor

The plugin is NOT the product.

The backend is the product.

The plugin is the distribution layer.

⸻

2. Ecosystem Overview — Current Platform

2.1 Repositories Audited

Repository	Role	Tech
mcp-ops-b	Core MCP server + gateway + tools	TypeScript, @modelcontextprotocol/sdk, Express
mcp-ops-web-admin-api	Admin/BFF REST API	Express, Zod, Helmet
mcp-ops-web-admin	Admin portal	Next.js 16, React 19
mcp-ops-web-chat	Web chat frontend	Next.js 16
mcp-ops-db	PostgreSQL layer	pg driver, migrations, repos
mcp-ops-infra	Infrastructure as Code	Terraform
mcp-ops-plugin	NEW public plugin repo	TypeScript

2.1.1 Current Multi-Tenant Architecture

The platform operates with three tenants, each with a discriminated `TenantType`:

| Tenant | Slug | Type | Purpose |
|--------|------|------|---------|
| **Breitling** | `breitling` | `client` | Customer tenant — users, cloud accounts, credentials, tools |
| **Opsphere** | `opsphere` | `platform_admin` | Operators with cross-tenant visibility |
| **Opsphere Platform** | `opsphere-platform` | `platform_infra` | Opsphere's own infrastructure (future) |

`TenantType` is a discriminated union: `'client' | 'platform_admin' | 'platform_infra'`.

The gateway resolves `TenantType` from the API key / JWT and passes it through to the session pool and MCP subprocess. Public plugin users will be `TenantType = 'client'`.

Key technical details:

* `mcp-ops-db`: 39+ migrations, published to CodeArtifact as npm package (v1.17.2+)
* Seed scripts: `seed-breitling.ts`, `seed-breitling-tenant-data.ts`
* Session pool key: `${userId}|${tenantId}|${tenantType}|${runtimeProfile}` (4 components)
* `MCP_API_KEY` stripped from subprocess environment

⸻

2.2 Current Runtime Architecture

Cursor Plugin
    ↓
HTTP Remote MCP
    ↓
Express Gateway
    ↓
Session Pool
    ↓
Child MCP Process
    ↓
207+ Internal Tools
    ↓
AWS / K8s / Datadog / etc.

⸻

3. Authentication Architecture

3.1 IMPORTANT CHANGE FROM PREVIOUS PLAN

The previous architecture relied on:

manual API key onboarding

This is now deprecated as the primary user experience.

The new architecture is:

plugin-managed authentication

with optional API key compatibility for advanced use cases.

⸻

3.2 New SaaS-Native Authentication Flow

Final User Experience

1. Install plugin from Cursor Marketplace
2. Open plugin settings
3. Sign up or login directly inside Cursor
4. Plugin calls backend APIs
5. Backend auto-provisions tenant + user
6. Backend returns session tokens
7. Plugin stores tokens securely
8. Plugin auto-configures remote MCP
9. User immediately starts using Opsphere

No manual MCP registration.

No manual API key copy/paste.

No external onboarding website required for MVP.

⸻

3.3 Backend Authentication APIs

New APIs Required

POST /api/plugin/signup
POST /api/plugin/login
POST /api/plugin/refresh
POST /api/plugin/logout
GET  /api/plugin/me

⸻

3.4 Token Model

Access Token

Short-lived JWT:

* 15 minutes
* signed with JWT_SECRET
* includes:
    * tenantId
    * tenantType
    * userId
    * subscriptionId
    * runtimeProfile

Refresh Token

Long-lived secure token:

* stored hashed
* revocable
* rotated
* plugin auto-refreshes silently

⸻

3.5 API Keys (Compatibility Layer)

The existing API key system remains supported:

Authorization: Bearer mcp_xxx

for:

* SDKs
* automation
* internal tooling
* advanced users
* backward compatibility

But API keys are no longer the primary onboarding mechanism for Marketplace users.

⸻

3.6 Secure Storage

The plugin stores:

* access token
* refresh token
* gateway URL

inside Cursor secure settings storage.

Never:

* .env
* plaintext config
* logs
* local files

⸻

3.7 Future Compatibility

The architecture must remain compatible with future:

* OAuth
* Google login
* GitHub login
* SSO
* enterprise auth
* SCIM
* SAML

even if not implemented in MVP.

⸻

3.8 Refresh Token Storage Architecture

The new plugin-managed authentication model introduces refresh tokens in addition to legacy `mcp_` API keys.

Refresh tokens MUST NOT reuse `tenant_api_keys`.

The existing `tenant_api_keys` table is designed for long-lived API keys (`mcp_xxx`) and lacks:

* token rotation semantics
* session tracking
* device/session metadata
* revocation lifecycle
* refresh token family management

Using `tenant_api_keys` for refresh tokens would mix:

* infrastructure/API auth
* user interactive sessions

This would create operational ambiguity and security risks.

**Decision: New `tenant_user_sessions` Table**

A dedicated table will be created:

```sql
CREATE TABLE tenant_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'cursor_plugin',
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Storage Rules**

* refresh tokens stored hashed only
* never stored plaintext
* bcrypt or SHA-256 + pepper acceptable
* revocable independently
* rotation supported
* multiple active sessions per user supported

**Session Lifecycle**

| Action | Behavior |
|--------|----------|
| Login | creates session row |
| Refresh | rotates refresh token |
| Logout | sets `revoked_at` |
| Trial expiration | invalidates refresh flow |
| Password reset | revokes all sessions |
| Suspended tenant | blocks refresh and access |

⸻

3.9 Gateway Dual-Auth Model

The gateway already supports dual authentication behavior via prefix inspection.

This MUST remain and become formally documented architecture.

Current behavior in `auth.ts`:

```
Authorization: Bearer mcp_xxx
```

→ treated as API key authentication

Any other bearer token:

```
Authorization: Bearer eyJ...
```

→ treated as JWT access token

**Final Gateway Auth Strategy**

| Token Type | Used By | Validation |
|-----------|---------|------------|
| `mcp_xxx` | legacy clients, SDKs, automation | SHA-256 lookup in `tenant_api_keys` |
| JWT access token | Cursor plugin sessions | JWT verification via `JWT_SECRET` |

**Existing Middleware Logic**

Current middleware already distinguishes by prefix:

```typescript
if (token.startsWith('mcp_')) {
  // API key flow
} else {
  // JWT flow
}
```

No major rewrite required.

**Runtime Profiles**

| Auth Type | runtimeProfile |
|-----------|---------------|
| API key | `cursor` |
| JWT plugin session | `cursor` |
| web-chat JWT | `web` |

Plugin JWTs must still resolve:

`runtimeProfile = 'cursor'`

to ensure:

* tool gating
* session isolation
* free-tier restrictions
* public plugin policies

remain enforced.

**JWT Claims**

Plugin access tokens should include:

```json
{
  "userId": "...",
  "tenantId": "...",
  "tenantType": "client",
  "subscriptionId": "public_free",
  "runtimeProfile": "cursor"
}
```

⸻

4. MCP Architecture Audit

4.1 Current Transport Modes

Mode	Transport	Protocol
Local Cursor	stdio	JSON-RPC
HTTP Gateway	POST /mcp	JSON-RPC over HTTP
SSE	NOT SUPPORTED	405

⸻

4.2 Plugin MCP Strategy

The plugin becomes a:

self-managed remote MCP client

The plugin automatically:

* registers MCP
* manages headers
* manages auth
* refreshes sessions
* reconnects
* performs health checks

The user never edits:

* mcp.json
* .cursor/mcp.json
* headers
* transport config

⸻

4.3 Gateway Architecture

Client (POST /mcp)
    ↓
Gateway auth middleware
    ↓
Session Pool
    ↓
Child MCP Process
    ↓
Tool Execution

⸻

4.4 Existing Session Isolation

Already implemented:

userId|tenantId|tenantType|runtimeProfile

and:

MCP_API_KEY stripped from subprocess env

⸻

4.5 Tool Registration Security

Already implemented:

* deny-by-default
* fail-closed
* DB-authoritative tool matrix
* full module coverage

Security gap CLOSED.

⸻

5. Public Plugin Tool Strategy

5.1 Public Free Tier Tool Catalog

Public free tenants receive:

maximum 2 useful tools per provider.

Excluded from free tier: Azure, Akamai, K8s, ArgoCD, Contentful, Repos, Observability, Confluence, Pingdom, EKS-sync, ECS-sync.

Selected tools (max 2 per provider, AWS = login + 2):

| Provider | Tool 1 | Tool 2 | Tool 3 |
|----------|--------|--------|--------|
| **AWS** | `aws_sso_login_remote` | `aws_sts_whoami` | `aws_cli_query` |
| **Vercel** | `vercel_deploys_latest` | `vercel_project_status` | — |
| **Datadog** | `dd_logs_search` | `dd_errors_by_service` | — |
| **Cloudflare** | `cf_quick_status` | `cf_dns_records` | — |
| **Sentry** | `sentry_issues_list` | `sentry_issues_search` | — |
| **GitHub** | `ghe_repo_summary` | `ghe_actions_latest` | — |
| **Bitbucket** | `bb_pipelines_latest` | `bb_pipeline_diagnose` | — |
| **Jira** | `jira_issue_get` | `jira_issues_search` | — |
| **Diagnostics** | `dns_lookup` | `http_check` | `cert_status` |
| **Ops (plugin)** | `ops_configure_integration` | `ops_list_integrations` | `ops_remove_integration` |
| **Ops (plugin)** | `ops_test_integration` | — | — |

**Total public free catalog: 24 tools**

⸻

5.2 Diagnostics Without Credentials

The following work immediately:

* dns_lookup
* http_check
* cert_status

This provides instant value before users configure integrations.

⸻

5.3 Premium Tiers

| Tier | Providers | Tools |
|------|-----------|-------|
| Free | 9 providers + diagnostics + ops | ~24 tools |
| Pro | All providers | ~80 tools |
| Enterprise | Full catalog | ~211 tools |

⸻

6. Tenant Isolation Model (Critical Security Architecture)

6.1 Critical Existing Constraint

Current schema:

UNIQUE(tenant_id, tool_id, credential_key)

No user_id.

Therefore:

shared public tenant = shared credentials

which is unacceptable.

⸻

6.2 Final Decision

Each public user gets:

their own auto-provisioned tenant

No shared public tenant exists.

⸻

6.3 Tenant Creation Flow

On signup:

* tenant created
* tenant user created
* tenant tools seeded
* subscription assigned
* credentials isolated
* usage isolated

⸻

6.4 Subscription Model

subscription_id becomes the plan identifier:

Examples:

public_free
public_pro
enterprise

⸻

6.5 Why This Architecture Wins

Advantages:

* zero schema changes
* zero config-loader rewrites
* total credential isolation
* natural billing model
* natural usage tracking
* natural plan enforcement
* natural tenant suspension

⸻

6.6 Security Guarantees

User A:

* isolated credentials
* isolated sessions
* isolated tools
* isolated usage

User B:

* completely separate tenant

No shared runtime state.

⸻

6.7 Public Free Tenant — DB Matrix Template

For each `public_free` tenant, `tenant_tools` must contain a row for EVERY module (22), not just the enabled ones. The 3-layer defense (deny-by-default, fail-closed, full DB matrix) is already deployed and enforces this.

```
Module              | is_enabled | runtime_profile
--------------------|------------|----------------
aws                 | true       | cursor          ← free (3 tools: login_remote, sts_whoami, cli_query)
vercel              | true       | cursor          ← free (2 tools: deploys_latest, project_status)
datadog             | true       | cursor          ← free (1 tool: logs_search)
cloudflare          | true       | cursor          ← free (2 tools: quick_status, dns_records)
sentry              | true       | cursor          ← free (2 tools: issues_list, issues_search)
github              | true       | cursor          ← free (2 tools: repo_summary, actions_latest)
bitbucket           | true       | cursor          ← free (2 tools: pipelines_latest, pipeline_diagnose)
jira                | true       | cursor          ← free (2 tools: issue_get, issues_search)
diagnostics         | true       | cursor          ← free (3 tools: dns_lookup, http_check, cert_status)
ops                 | true       | cursor          ← free (4 tools: configure/list/remove/test integration)
azure               | false      | cursor          ← BLOCKED
k8s                 | false      | cursor          ← BLOCKED
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

Within enabled modules, `disabledTools` in `config_json` limits to max 2 tools per provider:

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

⸻

6.8 Full Internal Tool Catalog (reference)

The complete ~211 tool catalog remains available for internal/enterprise tenants. Distribution by module:

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

⸻

7. Credential Registration Architecture

7.1 Major UX Improvement

Credential registration happens directly inside Cursor.

No dashboard required for MVP.

⸻

7.2 User Experience

Example:

Using Opsphere, register my Datadog token

or:

Using Opsphere, configure my Vercel integration

⸻

7.3 New MCP Tools Required

Tool

ops_configure_integration

ops_list_integrations

ops_remove_integration

ops_test_integration

⸻

7.4 Credential Flow

User:
Configure my Datadog integration
Opsphere:
Please paste your DD_API_KEY
User:
<token>
Opsphere:
Integration stored securely and verified

⸻

7.5 Credential Storage

Credentials remain:

* encrypted
* tenant-scoped
* isolated
* never exposed back to plugin

Encryption:

AES-256-GCM

⸻

7.6 Credential Whitelist

Allowed keys:

Provider	Credential Key
Vercel	VERCEL_TOKEN
Vercel	VERCEL_TEAM_ID
Datadog	DD_API_KEY
Datadog	DD_APP_KEY
Datadog	DD_SITE
Sentry	SENTRY_AUTH_TOKEN
Cloudflare	CLOUDFLARE_API_TOKEN
GitHub	GHE_TOKEN
GitHub	GHE_BASE_URL
Bitbucket	BB_USERNAME
Bitbucket	BB_APP_PASSWORD
Jira	JIRA_HOST
Jira	JIRA_EMAIL
Jira	JIRA_API_TOKEN
AWS	AWS_ACCESS_KEY_ID
AWS	AWS_SECRET_ACCESS_KEY
Azure	AZURE_TENANT_ID

Any unknown key is rejected.

⸻

8. Public vs Private Boundary

8.1 Public Plugin

Contains ONLY:

* auth client
* MCP client
* onboarding
* settings
* transport
* UI
* docs

⸻

8.2 Private Backend

Contains:

* tool logic
* orchestration
* prompts
* correlation
* enrichment
* credentials
* sessions
* telemetry
* subscriptions
* billing
* operational intelligence

⸻

8.3 Core Principle

plugin = distribution layer
backend = moat

⸻

9. Public Plugin Repository Structure

mcp-ops-plugin/
├── .github/
├── src/
│   ├── auth/
│   │   ├── signup.ts
│   │   ├── login.ts
│   │   ├── refresh.ts
│   │   ├── secure-storage.ts
│   │   └── session.ts
│   ├── mcp/
│   │   ├── client.ts
│   │   ├── transport.ts
│   │   ├── reconnect.ts
│   │   └── health.ts
│   ├── onboarding/
│   │   ├── first-run.ts
│   │   ├── setup-flow.ts
│   │   └── integration-guide.ts
│   ├── tools/
│   │   ├── registry.ts
│   │   ├── categories.ts
│   │   └── formatter.ts
│   ├── config/
│   │   ├── settings.ts
│   │   └── defaults.ts
│   ├── telemetry/
│   │   └── usage.ts
│   └── utils/
├── docs/
├── tests/
├── assets/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
└── cursor-plugin.json

⸻

10. Implementation Roadmap

Phase 0 — Foundation

* scaffold plugin repo
* CI/CD
* manifest
* assets
* docs
* lint/test pipeline

⸻

Phase 1A — Security Hardening

Already completed:

* deny-by-default
* fail-closed
* full DB matrix
* session isolation
* env stripping

⸻

Phase 1B — SaaS Onboarding Backend

Build:

POST /api/plugin/signup
POST /api/plugin/login
POST /api/plugin/refresh

Implement:

* auto-provisioned tenants
* subscription_id
* trial expiration
* refresh tokens
* signup throttling
* email verification

⸻

Phase 2 — Plugin Authentication

Build:

* secure token storage
* login flow
* refresh flow
* session handling

⸻

Phase 3 — Remote MCP Client

Build:

* HTTP transport
* reconnect
* health checks
* retry logic
* graceful errors

⸻

Phase 4 — Credential Management

Build:

* ops_configure_integration
* ops_list_integrations
* credential validation
* process restart after credential update

⸻

Phase 5 — Public Gateway Hardening

Build:

* rate limiting
* autoscaling
* WAF hardening
* gateway monitoring
* ECS scaling

⸻

Phase 6 — Marketplace Launch

Build:

* screenshots
* polished README
* onboarding docs
* troubleshooting docs
* beta testing
* release

⸻

Phase 7 — Post Launch

Build:

* billing
* Stripe
* web dashboard
* telemetry
* plan upgrades
* SDK
* partner program

⸻

10.1 Still-Pending Backend Work

The following items remain **REQUIRED** before public launch:

| Item | Repository | Status |
|------|-----------|--------|
| `POST /api/plugin/signup` | `mcp-ops-web-admin-api` or new public API | Not implemented |
| `POST /api/plugin/login` | backend | Not implemented |
| `POST /api/plugin/refresh` | backend | Not implemented |
| `tenant_user_sessions` table | `mcp-ops-db` | Not implemented |
| Refresh token hashing/rotation | backend auth layer | Not implemented |
| `ops_configure_integration` | `mcp-ops-b` | Not implemented |
| `ops_list_integrations` | `mcp-ops-b` | Not implemented |
| `ops_remove_integration` | `mcp-ops-b` | Not implemented |
| `ops_test_integration` | `mcp-ops-b` | Not implemented |
| Credential whitelist enforcement | `config-loader.ts` integration layer | Not implemented |
| MCP subprocess restart after credential updates | session pool | Not implemented |
| Public signup throttling | gateway/API | Not implemented |
| Trial expiration cron | backend cron | Not implemented |
| Suspended tenant cleanup cron | backend cron | Not implemented |
| ECS autoscaling strategy | infrastructure | Not implemented |
| Redis/shared session registry | future scaling | Not implemented |
| Public WAF hardening | infra | Partial |
| Stripe billing integration | admin-api | Not implemented |
| Web dashboard | future | Not implemented |
| Email verification | auth flow | Optional MVP / required launch |
| OAuth compatibility layer | auth architecture | Future-ready only |

⸻

11. Marketplace Checklist

11.1 Manifest Requirements

* Valid `cursor-plugin.json`
* `name`
* `displayName`
* semantic version
* `publisher`
* `repository`
* `license`
* `engines.cursor`
* MCP server config
* settings schema
* plugin icon
* screenshots

⸻

11.2 README Quality

* Clear value proposition in first section
* Operational intelligence positioning
* Quick-start guide
* Installation steps
* Example prompts
* Integration registration examples
* Troubleshooting section
* Security explanation
* Upgrade/plan explanation
* Screenshots/GIFs
* CI/version badges

**Example README Guidance**

Users should explicitly see examples like:

> Using Opsphere, configure my Datadog integration

and:

> Using Opsphere, register my Vercel token

to encourage in-chat integration setup.

⸻

11.3 Security

* No secrets in repo
* No proprietary prompts
* No orchestration logic
* HTTPS enforced
* Dependency audit clean
* Secure token storage
* Refresh token hashing
* No credential logging
* `.gitignore` hardened
* CI security scans

⸻

11.4 Error Handling

* Invalid login → actionable message
* Expired session → silent refresh or re-login
* `TRIAL_EXPIRED` → upgrade prompt
* Gateway offline → retry + health status
* Timeout → retry suggestion
* Missing credentials → integration setup guidance
* MCP transport errors → reconnect flow

**Required Trial Expiration Response**

Gateway must return:

```json
{
  "error": "trial_expired",
  "message": "Your 30-day free trial has expired. Upgrade at https://dashboard.opsphere.io/upgrade",
  "code": "TRIAL_EXPIRED"
}
```

Plugin should intercept:

`code === 'TRIAL_EXPIRED'`

and show:

* upgrade CTA
* billing link
* explanation

instead of generic auth failure.

⸻

11.5 Versioning

* Semantic versioning
* `CHANGELOG.md`
* Git tags
* GitHub Releases
* SDK compatibility tracking
* Cursor compatibility tracking

⸻

11.6 User Experience

* Install → usable in <60 seconds
* No manual MCP config
* No manual header config
* No manual transport setup
* Plugin-managed onboarding
* Plugin-managed sessions
* Helpful onboarding UX
* Connection status visible
* Tool discovery intuitive
* Offline handling graceful

⸻

11.7 Documentation

* `INSTALL.md`
* `CONFIGURATION.md`
* `TOOLS.md`
* `TROUBLESHOOTING.md`
* `SECURITY.md`
* `UPGRADING.md`
* Marketplace screenshots
* Example integration registration flows
* Example prompts

⸻

12. Risk Assessment

12.1 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gateway SSE not supported | Medium | HTTP POST transport is sufficient for current MCP flows. Monitor MCP SDK evolution for future streamable transport support. |
| 60s timeout for long-running tools | Medium | Add progress notifications + client timeout handling. Future async execution model may be required. |
| Session pool scaling (1 user = 1 subprocess) | High | Current model acceptable for MVP only. Future migration toward worker pools or stateless MCP execution nodes required. Add ECS autoscaling and gateway sharding before large-scale launch. |
| `GATEWAY_MAX_SESSIONS` exhaustion | High | Default value (10) insufficient for public launch. Increase limits, autoscale ECS tasks, and monitor active session counts. |
| Thousands of auto-provisioned tenants | High | Add indexes on `subscription_id`, `status`, `created_at`. Add lifecycle cleanup jobs. Monitor tenant growth. |
| MCP process restart after credential update | Medium | `ops_configure_integration` must gracefully terminate and respawn subprocesses without affecting other tenants. |
| MCP SDK breaking changes | Medium | Pin SDK versions. Maintain compatibility testing pipeline against new Cursor/MCP releases. |
| Remote MCP connection instability | Medium | Implement reconnect logic, retry strategy, health checks, and exponential backoff. |
| Tool matrix seeding drift | Medium | Maintain `verifyCoverage()` validation in seed scripts. CI should fail on incomplete module matrices. |
| ECS gateway horizontal scaling | High | Future multi-instance routing likely requires Redis/shared session registry for session affinity. |

⸻

12.2 Business Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| IP exposure via plugin | Critical | Thin client architecture. No prompts, orchestration, or tool logic in public repo. Mandatory security review before every release. |
| Free-tier abuse | High | Signup throttling, quotas, rate limits, tenant suspension, anomaly monitoring. |
| Credential storage liability | High | Encrypt all credentials at rest. Clear ToS and privacy policy. SOC2 planning recommended. |
| Competitor reverse engineering | Medium | Backend remains proprietary moat. Public repo intentionally minimal. |
| Support burden | Medium | Strong onboarding UX, docs, troubleshooting guides, in-plugin guidance. |
| Billing not implemented before scale | Medium | Stripe integration required before significant public growth. |
| Massive inactive tenant accumulation | Medium | Scheduled cleanup lifecycle for dormant tenants and expired credentials. |
| Email spam signup attacks | Medium | CAPTCHA, email verification, signup throttling, abuse detection. |

⸻

12.3 Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| API token leakage | High | Cursor secure storage. Never log tokens. HTTPS enforced. |
| Cross-tenant credential leakage | Critical | One tenant per user. `config-loader` scoped strictly to `tenantId`. |
| Credential values appearing in logs | High | Explicit log sanitization. `ops_configure_integration` must mask sensitive values. |
| Refresh token theft | High | Store hashed refresh tokens only. Rotation on refresh. Revocation support. |
| Session hijacking | Medium | Short-lived access tokens + refresh token rotation. |
| Unauthorized tool exposure | **Closed** | 3-layer defense already deployed (deny-by-default, fail-closed, full DB matrix). |
| Trial bypass via re-signup | Low | Accepted for MVP. Future anti-abuse heuristics possible. |
| Zombie suspended tenants retaining credentials | Medium | Scheduled purge after suspension grace period. |
| Plugin supply-chain compromise | Medium | CI security scanning, dependency audit, lockfile enforcement. |

⸻

13. Decision Log

Decision	Status
HTTP transport	Decided
Thin client architecture	Decided
Backend owns intelligence	Decided
No orchestration in plugin	Decided
Auto-provisioned tenant per user	Decided
subscription_id as plan model	Decided
30-day free tier	Decided
Max 2 tools per provider	Decided
Diagnostics without credentials	Decided
Plugin-managed onboarding	Decided
Plugin-managed MCP config	Decided
Session/token-first auth	Decided
API keys only for compatibility	Decided
deny-by-default	Implemented
fail-closed	Implemented
4-component session isolation	Implemented

⸻

14. Next Steps

Immediate:

1. review v3 architecture
2. decide final branding (Opsphere recommended publicly)
3. scaffold plugin repo
4. implement plugin auth APIs
5. implement onboarding flow
6. implement remote MCP self-management
7. implement credential registration tools

⸻

15. Appendix A — Plugin Environment Variables

Variable	Purpose
MCP_OPS_GATEWAY_URL	Gateway endpoint
MCP_OPS_TIMEOUT	Request timeout
MCP_OPS_DEBUG	Debug logging

API tokens should NOT be stored in .env.

⸻

16. Appendix B — Gateway Compatibility Requirements

Still required:

* plugin auth endpoints
* refresh token support
* rate limiting
* autoscaling
* signup throttling
* credential tools
* process restart on credential update
* trial suspension cron

⸻

17. Appendix C — Cursor Marketplace Manifest (Draft)

{
  "name": "opsphere",
  "displayName": "Opsphere — Operational Intelligence",
  "version": "1.0.0",
  "description": "Operational intelligence for DevOps directly inside Cursor.",
  "publisher": "Opsphere",
  "repository": "https://github.com/opsphere/mcp-ops-plugin",
  "engines": {
    "cursor": ">=0.50.0"
  }
}

Final manifest must comply with actual Cursor Marketplace schema at release time.

⸻

18. Appendix D — Tenant Auto-Provisioning Flow

POST /api/plugin/signup
1. validate email/password
2. create isolated tenant
3. create tenant_user
4. seed tenant_tools
5. assign subscription_id=public_free
6. generate access token
7. generate refresh token
8. return session

Daily cron:

UPDATE tenants
SET status='suspended'
WHERE subscription_id='public_free'
AND created_at < now() - interval '30 days'

⸻

19. Appendix E — Core Product Philosophy

Opsphere should feel like:

a native operational intelligence SaaS platform inside Cursor

NOT:

a manually configured MCP server

The user experience target is:

Install
→ Login
→ Connected
→ Use tools

within less than 60 seconds.