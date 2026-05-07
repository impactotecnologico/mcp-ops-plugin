# MCP-Ops Plugin — Cursor Marketplace: Technical Inventory & Execution Plan

> **Date**: 2026-05-07  
> **Author**: Architecture / Security / Platform Review  
> **Status**: Draft — Ready for Review  
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

MCP-Ops is a mature internal DevOps operations platform with **207+ tools** across 22 integrations (AWS, K8s, Datadog, Vercel, ArgoCD, Cloudflare, Sentry, Jira, Azure, etc.), a multi-tenant backend (PostgreSQL), HTTP gateway, web chat with LLM agents, and an admin portal.

The goal is to extract a **thin public plugin** for the Cursor Marketplace that:
- Authenticates users via API key against our private backend
- Proxies MCP tool calls through our HTTP gateway
- Exposes a curated, safe subset of tools
- Keeps all proprietary logic (orchestration, LLM agents, correlation engine, premium features, tenant management) private
- Is commercially viable as a SaaS product (free tier + paid plans)

**The plugin is a client. The intelligence stays in the backend.**

---

## 2. Ecosystem Overview

### Repositories Audited

| Repository | Role | Tech |
|------------|------|------|
| **mcp-ops-b** | Core MCP server (207 tools, prompts, resources) | TypeScript, @modelcontextprotocol/sdk, Express gateway |
| **mcp-ops-web-admin-api** | Admin/BFF REST API | Express, Zod, mcp-ops-db, Helmet |
| **mcp-ops-web-admin** | Admin portal (tenant/user/tool management) | Next.js 16, React 19, Tailwind, shadcn |
| **mcp-ops-web-chat** | Chat interface with LLM agent | Next.js 16, React 18, Tailwind, MCP client |
| **mcp-ops-db** | Database layer (migrations, repos, seeds) | PostgreSQL, pg driver, 32 migrations |
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
| **JWT (jsonwebtoken)** | Gateway `auth.ts`, Web Chat | Signed with `JWT_SECRET`. Claims: `userId`, `tenantId`, `isAdmin`, `runtimeProfile`. 24h expiry in web-chat. |
| **Bcrypt passwords** | mcp-ops-db `tenant_users.password_hash` | Cost 12. Used for web-chat login. |
| **Cognito/ALB OIDC** | Admin API `require-auth.ts` | ALB-injected `x-amzn-oidc-data` header. Base64 decoded (no signature verification in app — ALB validates). |
| **Internal shared token** | Admin API `require-internal-token.ts` | `ADMIN_INTERNAL_TOKEN` (min 32 chars), constant-time comparison. BFF between admin-web and admin-api. |
| **AWS SSO sessions** | mcp-ops-db `user_aws_sessions` | Encrypted SSO tokens (AES-256-GCM via `AWS_SESSION_ENCRYPTION_KEY`). Refresh support. Per-user per-profile. |
| **Azure sessions** | mcp-ops-db `user_azure_sessions` | Same encryption pattern. Per-user per-tenant. Device code flow. |
| **Tenant identification** | `tenant-context.ts` | Via `OPS_TENANT_ID` env or `MCP_API_KEY` hash lookup. Resolved at process start. |
| **Caller identity** | `caller-identity.ts` | Trusted boundary from env vars (`MCP_CALLER_USER_ID`, etc.). Local Cursor = admin. |
| **Role-based access** | `tenant_users.role` | `member` \| `tenant_admin`. Plus `allowed_tools` / `allowed_environments` JSONB arrays. |
| **Runtime profiles** | `tenant_tools.runtime_profile` | `default` \| `cursor` \| `web`. Tool enablement per profile. |

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
2. `McpServer({ name: 'mcp-ops', version: '0.4.0' })`
3. Load tools config (JSON file or Postgres override)
4. Initialize tenant context
5. Load credentials from Postgres (optional)
6. Load tools config overlay from Postgres (optional)
7. **Monkey-patch `registerTool`** for usage tracking + output enrichment
8. Register all tools, prompts, resources
9. Connect stdio transport
10. Start cron jobs

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
         ├─ Token prefix "mcp_" → API key lookup (partner key)
         ├─ Otherwise → JWT verification
         │
         ▼
    Session Pool
         │
         ├─ Get or create child process (per userId+tenantId)
         ├─ Inject env: MCP_CALLER_USER_ID, MCP_CALLER_TENANT_ID, etc.
         ├─ Pipe JSON-RPC to child stdin
         ├─ Read response from child stdout (120s timeout)
         └─ Return response to client
```

### 4.4 Key Patterns

| Pattern | Implementation | Plugin Impact |
|---------|---------------|---------------|
| **Tool gating** | `withModuleRegistration` + config JSON | Transparent — backend filters tools |
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

### 5.1 Full Classification (207 tools)

#### Category A: SAFE FOR PUBLIC EXPOSURE (read-only, diagnostics, status)

These tools are inherently read-only or diagnostic. Safe to expose to authenticated users.

| Integration | Tools | Count |
|------------|-------|-------|
| **Datadog** | `dd_logs_search`, `dd_synthetics_summary`, `dd_waf_bots`, `dd_errors_by_service`, `dd_errors_recent`, `dd_log_get` | 6 |
| **Vercel** (read) | `vercel_deploys_latest`, `vercel_env_list`, `vercel_env_diff`, `vercel_env_sources`, `vercel_project_status`, `vercel_projects_list`, `vercel_env_diff_repo` | 7 |
| **K8s** (read) | `k8s_describe`, `k8s_logs`, `k8s_cluster_summary`, `k8s_nodes_list`, `k8s_node_describe`, `k8s_containers_count`, `k8s_pods_list`, `k8s_cronjob_pods`, `k8s_find_pod`, `k8s_pod_previous_logs`, `k8s_resource_yaml`, `k8s_rollout_history`, `k8s_replicasets_list`, `k8s_replicasets_images` | 14 |
| **ArgoCD** (read) | `argocd_list_apps`, `argocd_get_app`, `argocd_app_unhealthy`, `argocd_debug` | 4 |
| **AWS** (read) | `aws_sts_whoami`, `aws_ecr_repos`, `aws_ecr_images`, `aws_secretsmanager_list`, `aws_secretsmanager_describe`, `aws_codeartifact_packages`, `aws_codeartifact_versions`, `aws_cli_query` (read-only verbs), `aws_session_status`, `check_aws_session_for_env` | 10 |
| **AWS auth** | `aws_sso_login`, `aws_sso_login_remote`, `aws_sso_login_device_start`, `aws_sso_login_device_poll`, `aws_sso_login_global_start`, `aws_sso_login_global_poll`, `aws_sso_logout`, `aws_session_revoke` | 8 |
| **Azure** (read) | `azure_cli_query` (read-only), `azure_dns_lookup`, `azure_subscriptions_list`, `azure_subscription_set`, `azure_resource_groups`, `azure_servicebus_*` (all 15 servicebus tools), `azure_user_login_*` (4 session tools) | 23 |
| **Akamai** (read) | `akamai_properties_list`, `akamai_properties_search`, `akamai_waf_policies`, `akamai_waf_rules`, `akamai_diag`, `akamai_papi_rules`, `akamai_papi_redirects` | 7 |
| **Cloudflare** (read) | `cf_zones_list`, `cf_zone_status`, `cf_quick_status`, `cf_dns_records`, `cf_ssl_verification`, `cf_ssl_certificate_packs`, `cf_firewall_events`, `cf_analytics_overview`, `cf_ssl_mode_get`, `cf_page_rules_list`, `cf_workers_routes_list`, `cf_rulesets_list`, `cf_ruleset_entrypoint_get`, `cf_transform_rules_list`, `cf_origin_rules_list`, `cf_cache_rules_list`, `cf_cname_flattening_get`, `cf_config_rules_list`, `cf_redirect_rules_list`, `cf_waf_custom_rules_list`, `cf_waf_ip_audit` | 20 |
| **Bitbucket** (read) | `bb_pr_get`, `bb_pr_search`, `bb_pipelines_latest`, `bb_pipeline_get`, `bb_pipeline_diagnose`, `bb_pr_diff`, `bb_pr_diffstat`, `bb_pr_commits`, `bb_commits_list`, `bb_branches_list`, `bb_tags_list`, `bb_repos_list` | 12 |
| **GitHub Enterprise** (read) | `ghe_actions_latest`, `ghe_actions_latest_jobs`, `ghe_actions_latest_logs`, `ghe_actions_diagnose`, `ghe_org_repos`, `ghe_repo_summary`, `ghe_repo_prs`, `ghe_search_code`, `ghe_branches_list`, `ghe_commits_list`, `ghe_pr_detail`, `ghe_pr_diff`, `ghe_pr_files`, `ghe_tags_list` | 14 |
| **Sentry** (read) | `sentry_organizations_list`, `sentry_projects_list`, `sentry_issues_list`, `sentry_issues_get`, `sentry_issues_search`, `sentry_issues_export`, `sentry_projects_stats`, `sentry_event_get`, `sentry_events_search`, `sentry_logs_search` | 10 |
| **Jira** (read) | `jira_issue_get`, `jira_issues_search`, `jira_issues_list`, `jira_issues_recent`, `jira_issue_comments`, `jira_issue_fulldetails` | 6 |
| **Confluence** (read) | `confluence_search`, `confluence_page_read` | 2 |
| **Diagnostics** | `dns_lookup`, `http_check`, `tcp_connect`, `cert_status`, `dnssec_check`, `synthetics_summary_by_location`, `alerts_active` | 7 |
| **Observability** | `env_health_summary`, `env_errors_overview`, `env_capacity_overview`, `observability_daily_digest`, `observability_query`, `observability_trigger_digest` | 6 |
| **Repos** (read) | `repos_list`, `repos_search_text`, `repos_var_where`, `repos_config_find`, `repos_catalog`, `infra_tfvars_catalog`, `infra_tfvars_find`, `repo_env_list`, `repo_pipeline_summary` | 9 |
| **Contentful** (read) | `ctf_spaces_list`, `ctf_environments_list`, `ctf_content_types_list`, `ctf_content_type_get`, `ctf_entries_search`, `ctf_entry_get`, `ctf_graphql_query`, `ctf_graphql_schema_introspect` | 8 |
| **Pingdom** (read) | `pingdom_checks_list`, `pingdom_check_get`, `pingdom_check_outages`, `pingdom_check_probes_status`, `pingdom_check_results`, `pingdom_check_uptime`, `pingdom_actions_recent`, `pingdom_summary` | 8 |
| **Ops/Status** | `ops_status`, `k8s_autodiag_notification` | 2 |
| **EKS/ECS sync** | `eks_update_kubeconfig`, `eks_sync_cluster_metadata`, `ecs_sync_cluster_metadata`, `k8s_contexts`, `k8s_context_use` | 5 |

**Subtotal Category A: ~188 tools**

#### Category B: INTERNAL ONLY / WRITE OPERATIONS (require extra caution or are admin-only)

| Integration | Tools | Reason |
|------------|-------|--------|
| **Cloudflare** (write) | `cf_ssl_mode_set`, `cf_page_rule_create`, `cf_page_rule_update`, `cf_page_rule_delete`, `cf_workers_route_create`, `cf_workers_route_update`, `cf_workers_route_delete`, `cf_ruleset_entrypoint_update`, `cf_transform_rules_replace`, `cf_origin_rules_replace`, `cf_cache_rules_replace`, `cf_cname_flattening_set`, `cf_config_rules_replace`, `cf_redirect_rules_replace`, `cf_waf_custom_rules_replace` | **Destructive mutations on production CDN/DNS** |
| **Akamai** (write) | `akamai_cache_purge` | Cache purge — side effects |
| **Ops** (admin) | `system_update` | Updates MCP system itself (git pull + PM2 restart) |

**Subtotal Category B: ~17 tools**

> **Note**: The boundary is enforced by the **backend** via `tenant_tools` + `allowed_tools`. The plugin doesn't need to classify — it just calls `listTools` and gets the tenant's allowed set. But this classification guides **default tool enablement** per subscription tier.

### 5.2 Tool Distribution by Integration

```
Cloudflare .......... 35 tools (20 read + 15 write)
Azure ............... 23 tools (all read/session)
K8s ................. 14 tools (all read)
GitHub Enterprise ... 14 tools (all read)
Bitbucket ........... 12 tools (all read)
AWS ................. 18 tools (10 read + 8 auth)
Sentry .............. 10 tools (all read)
Repos ............... 9 tools (all read)
Contentful .......... 8 tools (all read)
Pingdom ............. 8 tools (all read)
Akamai .............. 8 tools (7 read + 1 write)
Diagnostics ......... 7 tools (all read)
Vercel .............. 7 tools (all read)
Datadog ............. 6 tools (all read)
Jira ................ 6 tools (all read)
Observability ....... 6 tools (all read)
EKS/ECS ............. 5 tools (context management)
ArgoCD .............. 4 tools (all read)
Confluence .......... 2 tools (all read)
Ops ................. 2 tools (1 read + 1 admin)
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

### Phase 1: Authentication (Week 1-2)

**Goal**: API key entry + validation + secure storage

- [ ] Implement `src/auth/api-key.ts` — Cursor secure settings integration
- [ ] Implement `src/auth/auth-header.ts` — Bearer header construction
- [ ] Implement `src/auth/validate.ts` — Format validation (`mcp_` prefix, length)
- [ ] Write unit tests for auth module
- [ ] Test with real API key against gateway

### Phase 2: MCP Client + Gateway Connection (Week 2-3)

**Goal**: Working MCP connection to backend

- [ ] Implement `src/mcp/transport.ts` — HTTP transport with auth headers
- [ ] Implement `src/mcp/client.ts` — Client wrapper with connect/disconnect/reconnect
- [ ] Implement `src/mcp/health.ts` — Health check before connection
- [ ] Handle gateway errors gracefully (401, 502, timeout, network)
- [ ] Write integration tests with mock gateway
- [ ] Test `listTools`, `callTool`, `listPrompts`, `getPrompt` end-to-end

### Phase 3: Configuration + UX (Week 3)

**Goal**: User-friendly settings + error messages

- [ ] Implement `src/config/settings.ts` — Settings schema with Zod
- [ ] Implement first-run onboarding flow (prompt for API key + gateway URL)
- [ ] Implement connection status indicator
- [ ] Implement helpful error messages for common failures
- [ ] Write `docs/INSTALL.md`, `docs/CONFIGURATION.md`

### Phase 4: Tool Presentation (Week 3-4)

**Goal**: Tools discoverable and categorized in Cursor

- [ ] Implement `src/tools/registry.ts` — Tool list caching
- [ ] Implement `src/tools/formatter.ts` — Format tool results for Cursor display
- [ ] Implement `src/tools/categories.ts` — Group tools by integration
- [ ] Write `docs/TOOLS.md` — Public tool catalog
- [ ] Test all tool categories through plugin

### Phase 5: Packaging + Marketplace (Week 4)

**Goal**: Published on Cursor Marketplace

- [ ] Finalize `cursor-plugin.json` manifest
- [ ] Create marketplace screenshots
- [ ] Write professional `README.md` with badges, install instructions, screenshots
- [ ] Security audit (no secrets, no proprietary code, dependency audit)
- [ ] Write `CHANGELOG.md` for v1.0.0
- [ ] Write `docs/SECURITY.md`, `docs/TROUBLESHOOTING.md`
- [ ] Publish v1.0.0 to Cursor Marketplace

### Phase 6: Post-Launch (Week 5+)

- [ ] Monitor usage + errors
- [ ] Implement telemetry (anonymous, opt-in)
- [ ] Add version update notification
- [ ] Build landing page / signup flow for API keys
- [ ] Implement free tier vs paid tier tool gating (backend-driven)
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
| 120s timeout for long tools | Medium | Add client-side timeout handling + progress indicators. Consider async pattern for very long operations. |
| Session pool scaling | High | Monitor `GATEWAY_MAX_SESSIONS`. Plan autoscaling of ECS gateway tasks. |
| MCP SDK breaking changes | Low | Pin SDK version. Test against beta releases. |
| Cursor Marketplace API changes | Medium | Follow Cursor changelog. Maintain compatibility layer. |

### 10.2 Business Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| IP exposure via plugin | **Critical** | Plugin is a thin client. All logic stays in backend. Code review every PR. |
| Free tier abuse | High | Rate limiting per API key (backend). Usage quotas per plan. |
| Competitor reverse engineering | Medium | Plugin has no tool logic to reverse engineer. Backend is the moat. |
| Support burden | Medium | Self-service docs, troubleshooting guide, community Discord. |
| Billing not implemented | Medium | Start with free tier. Add Stripe integration to admin-api before paid launch. |

### 10.3 Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| API key leakage | High | Cursor secure storage. Never log keys. Documentation warns users. |
| Man-in-the-middle | Low | HTTPS enforced. Gateway behind ALB + TLS. |
| Plugin supply chain | Medium | Minimal dependencies. `npm audit` in CI. Lockfile committed. |
| Unauthorized tool access | Low | Backend enforces `allowed_tools` per tenant/user. Plugin can't bypass. |

---

## 11. Decision Log

| Decision | Rationale | Status |
|----------|-----------|--------|
| **HTTP transport, not stdio** | Plugin runs in Cursor (not local terminal). HTTP gateway already exists. | Decided |
| **API key auth, not OAuth** | Simpler UX. Already implemented in backend. OAuth adds complexity for v1. | Decided |
| **Thin client, no tool logic** | Protects IP. Single source of truth for tool implementations. Easier updates. | Decided |
| **Backend enforces permissions** | Plugin doesn't need to know about tiers/roles. `listTools` returns only allowed tools. | Decided |
| **No LLM in plugin** | LLM agent is premium backend feature. Plugin users get Cursor's built-in AI + our tools. | Decided |
| **Start with free tier** | Build audience first. Monetize with premium tool sets + higher rate limits. | Proposed |
| **Separate repo from monorepo** | Clean open-source repo. No risk of private code leakage. CI independent. | Decided |

---

## 12. Next Steps

### Immediate (This Week)
1. **Review this document** — Validate decisions with stakeholders
2. **Decide on branding** — `mcp-ops` vs `opsphere` for marketplace name
3. **Decide on license** — MIT (community goodwill) vs proprietary (control)
4. **Create API key self-service flow** — Users need to get keys before using plugin

### Short Term (Weeks 1-2)
5. **Start Phase 0** — Scaffold repo, CI, manifest
6. **Start Phase 1** — Auth client implementation
7. **Prepare gateway for public traffic** — Rate limiting, CORS if needed, WAF rules

### Medium Term (Weeks 3-4)
8. **Phase 2-4** — Full client implementation + testing
9. **Beta test** — Internal team + 5-10 external users
10. **Phase 5** — Marketplace submission

### Long Term (Month 2+)
11. **Billing integration** — Stripe in admin-api, plan enforcement in gateway
12. **Landing page** — Marketing site with signup
13. **SDK** — Optional TypeScript SDK for programmatic access (separate from plugin)
14. **Partner program** — API key management for resellers/MSPs

---

## Appendix A: Environment Variables (Plugin Only)

The plugin should require **minimal** configuration:

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `MCP_OPS_API_KEY` | Yes | Cursor secure settings | API key (`mcp_` prefix) |
| `MCP_OPS_GATEWAY_URL` | No | Settings (default: production URL) | Gateway endpoint |
| `MCP_OPS_TIMEOUT` | No | Settings (default: 120000) | Request timeout (ms) |
| `MCP_OPS_DEBUG` | No | Settings (default: false) | Enable debug logging |

---

## Appendix B: Gateway Compatibility Requirements

For the plugin to work, the gateway (`mcp-ops-b/src/gateway`) needs:

| Feature | Current Status | Action Needed |
|---------|---------------|---------------|
| API key auth | **Ready** | None |
| POST /mcp | **Ready** | None |
| GET /health | **Ready** | None |
| CORS headers | **Not implemented** | Add if plugin calls gateway directly from browser context (unlikely for Cursor) |
| Rate limiting | **Not implemented at gateway** | Add per-API-key rate limiting before public launch |
| Public WAF rules | **Partial** (WAF exists on ALB) | Review and harden rules for public internet traffic |
| API key self-service | **Admin API only** | Build public signup + key generation flow |

---

## Appendix C: Cursor Marketplace Manifest (Draft)

```json
{
  "name": "mcp-ops",
  "displayName": "MCP-Ops — DevOps Operations",
  "version": "1.0.0",
  "description": "200+ DevOps tools in your IDE. Monitor, diagnose, and operate AWS, K8s, Vercel, Datadog, Cloudflare, ArgoCD, Sentry, and more — all from Cursor.",
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
