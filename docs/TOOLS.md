# Tools Reference

All tools are provided by the Opsphere remote MCP server.
Tools marked **[built-in]** work immediately after login — no integration credentials needed.
All others require the corresponding integration to be configured first (see [INSTALL.md](INSTALL.md)).

---

## MCP resources

Eleven **read-only** resources are registered on the gateway when Connection Broker is enabled (nine always; two additional on Connection Hub). Cursor and Codex can fetch them after MCP Connect. Use them for policies and catalog context — not as a substitute for live tool calls.

| URI | MIME | Purpose |
|-----|------|---------|
| `opsphere://rules/operational` | markdown | Full tool catalog + tenant scope (same substance as server instructions) |
| `opsphere://tools/catalog` | json | Enabled modules and prompt index for your plan/tenant |
| `opsphere://playbooks/index` | markdown | All MCP prompts by category (e.g. `diagnose-sonarqube-quality-gate`, `investigate-website-outage`, `investigate-bedrock-agent`) |
| `opsphere://tenant/account-context` | markdown | Per-account cloud catalog (`system_prompt_context`) |
| `opsphere://hub/active-context` | json | **Hub only** — active `context_id`, connection label, expiry for this MCP session |
| `opsphere://hub/connections` | json | **Hub only** — linked connections (same data as `ops_accounts_list`) |
| `opsphere://policies/change-approval` | markdown | Approval rules before mutating CDN / cache / system_update |
| `opsphere://policies/secrets-handling` | markdown | Secret handling and redaction |
| `opsphere://policies/incident-response` | markdown | Incident lifecycle |
| `opsphere://taxonomy/severity` | markdown | SEV1–4 taxonomy |
| `opsphere://inventory/critical-assets` | markdown | Critical assets inventory |

**Agent guidance:** prefer **`deployment_status`**, **`macro_*`** (Team+), or atomic tools for live state. Fetch **`opsphere://tenant/account-context`** when the default connect summary is not enough. Fetch **`opsphere://playbooks/index`** to list guided prompts. There is intentionally **no** one resource per tool — the operational catalog is `opsphere://rules/operational`.

---

## Network Diagnostics [built-in]

### `dns_lookup`
Look up a hostname against multiple DNS resolvers. Detects SERVFAIL, NXDOMAIN, and resolver inconsistencies.

**Example**: _"Check DNS for api.mycompany.com"_

---

### `http_check`
Send a HEAD request to a URL and report the response status, latency, and any errors.

**Example**: _"Is example.com responding?"_

---

### `cert_status`
Verify the TLS certificate for a hostname: expiry date, issuer, and validity.

**Example**: _"Check the SSL cert for mysite.com"_

---

### `traceroute` [built-in]
Run traceroute from the MCP gateway host to diagnose network path issues (requires `traceroute` in the container image).

**Example**: _"Traceroute to api.mycompany.com"_

---

### `alg_status` [built-in]
Algolia **global platform** status by cluster (`operational`, `degraded_performance`, `partial_outage`, `major_outage`). Public monitoring API — **no tenant credentials**. Use during search/outage triage before blaming your app.

**Example**: _"Is Algolia having an outage?"_

---

### `alg_incidents` [built-in]
Recent Algolia platform incidents by cluster. Public monitoring API — no credentials. Pair with `alg_status` during upstream triage.

**Example**: _"Show recent Algolia incidents"_

---

## Integration Management [built-in]

### `ops_configure_integration`
Store credentials for a provider securely. Accepts a map of credential keys.

**Example**: _"Configure my Datadog"_ (triggers the `configure-integration` skill)

---

### `ops_list_integrations`
Show which providers are configured (with masked previews) and which are pending.

**Example**: _"Which integrations do I have set up?"_

---

### `ops_test_integration`
Verify that stored credentials for a provider actually work by making a lightweight API call.

**Example**: _"Test my Vercel integration"_

---

### `ops_remove_integration`
Remove all stored credentials for a provider.

**Example**: _"Remove my Sentry integration"_

---

## Plan & Usage [built-in]

### `ops_my_usage`
Show current plan (`Community`, `Team`, …), trial end date, days remaining, daily and monthly tool usage, enabled MCP tool count, work context status, **catalog configuration surface** (`plugin` vs `admin_portal`), admin portal URL, and upgrade link.

**Example**: _"Show my Opsphere usage"_ or _"How many tool calls do I have left today?"_

See **[docs/PLANS.md](PLANS.md)** for tier comparison.

### `ops_set_work_context`
Save what you usually work with (projects, providers, environments) so Opsphere personalizes answers. Free-tier accounts only. No API keys.

**Example**: _"I work with Vercel and Datadog on project acme-prod"_ → agent calls this tool with your description.

### `ops_get_work_context`
Returns configured operational context for all cloud accounts (full text). Use when you need details beyond the default account summary injected at connect time.

**Example**: _"What's my saved work context?"_

**Resource**: `opsphere://tenant/account-context` (same full content, MCP resource).

---

## Connection Hub (Personal Workspace + external links)

Available when `ops_accounts_list` appears in `tools/list` (Community and paid Hub accounts).

| Tool | Purpose |
|------|---------|
| `ops_accounts_list` | List Personal Workspace + any external links |
| `ops_account_link_start` | Start OAuth to link an **external** workspace (when plan quota allows) |
| `ops_account_unlink` | Revoke an **external** link (Personal Workspace cannot be unlinked) |
| `ops_context_open` / `ops_context_close` | Advanced: switch to an **external** linked workspace (paid). Not required for Community Personal Workspace |
| `ops_my_usage` | Plan, Personal Workspace, Work Context (separate), integrations, quotas |

**Agent skills:** [`link-account`](../skills/link-account/SKILL.md) · [`open-work-context`](../skills/open-work-context/SKILL.md) (external switch only).

**Product rules:**

- After signup/login, **Personal Workspace is Active** — use operational tools without a manual open step.
- **Organization invite (same email):** accepting an admin invitation can **auto-link** that workspace to your Connection Hub when you are on **Developer** or higher with available link quota. No `/link-account` step in that case.
- If auto-link is not possible yet (no Hub, Community plan, or quota full), your org membership is still active — the link completes when you create/upgrade your Hub or free a slot. Use **`/link-account`** for different emails or manual linking.
- **Work Context** (`ops_set_work_context`) is optional provider/stack notes — distinct from Personal Workspace.
- **Community** external link quota is 0 — upgrade CTA; do not present Personal Workspace as blocked.
- Do not teach end users to pass internal session IDs for normal Community calls.
- Configure integrations on the Personal Workspace (or the external workspace you switched to on paid plans).

**Examples:**

- _"Show my usage"_ → Personal Workspace Active + Work Context status
- _"I accepted my company invite — is it linked?"_ → `ops_accounts_list` (auto-link on same email + Developer+)
- _"Link another workspace"_ on Community → upgrade explanation
- _"Switch to my staging client"_ (paid multi-link) → `open-work-context`

**Resources:** `opsphere://hub/active-context` · `opsphere://hub/connections` (diagnostics; prefer labels over raw IDs in user chat)

---

## Operational Memory

Available when the `memory` module is enabled for your tenant. **Not live ops truth** — always re-check Datadog, Vercel, K8s, etc. after reading memory.

### `memory_search`
Retrieve a compact block of distilled memories (full-text search). Use before repeating long investigations.

**Parameters**: `query` (required, min 3 chars), `scopes?` (`session` | `user` | `repository` | `incident` | `decision`), `repo?`, `environment?`, `limit?` (default 5, max 10).

**Example**: _"Search memory for prior work on payment timeouts in PRE"_

---

### `memory_store`
Persist a short distilled fact (not raw logs). Rate-limited (50 stores/user/day). Rejects secrets and duplicates of account catalog context unless `skip_catalog_duplicate_check=true`.

**Parameters**: `scope`, `kind`, `title`, `summary` (required); optional `content`, `repo`, `environment`, `incident`, `decision`, `visibility`, `skip_catalog_duplicate_check`.

**Scopes**: `user` / `session` (default for partners), `repository` (requires `repo`), `incident` (requires `kind=episodic` + `incident` object), `decision` (requires `decision` object).

**Example**: _"Save a one-paragraph summary of today's root cause for next time"_

---

### `memory_session_touch`
Optional heartbeat at session start; binds repo context when you pass `repo` or when inferred from recent `ghe_*` / `bb_*` / `repos_*` calls.

**Connection Hub:** use the same stable id for `ops_context_open` `chat_session_key` and `external_session_key` here (gateway auto-injects `external_session_key` from broker context when omitted).

**Example**: _"Touch memory session for org/my-repo"_

---

### `memory_invalidate`
Mark a memory item `stale`, `invalidated`, or `superseded` (owner or admin).

**Example**: _"Invalidate memory item [uuid] — obsolete after deploy"_

---

## Datadog

Requires: `DD_API_KEY`, `DD_APP_KEY` (and optionally `DD_SITE`).

### `dd_logs_search`
Search Datadog Logs v2. Supports any log query syntax.

**Example**: _"Search Datadog logs for status:error service:payments in the last 2 hours"_

---

### `dd_errors_by_service`
Get error counts grouped by service for the last N hours. Use as a discovery step before drilling into specific errors.

**Example**: _"Show me error counts by service for the last 6 hours"_

---

### `dd_errors_recent`
Fetch recent errors with stack trace deduplication.

**Example**: _"Show recent errors in the payments service"_

---

### `dd_synthetics_summary`
Get the status of all Datadog Synthetic tests.

**Example**: _"What's the Synthetics status?"_

---

### `dd_metrics_query`
Query Datadog metrics timeseries via `/api/v1/query` (CPU, latency, error rates).

**Example**: _"Query avg trace errors for the edge service in the last hour"_

---

## Deployment Status [built-in]

Aggregates **latest deployment** across platforms configured for your tenant (Vercel, CI, GitOps, S3+CloudFront, ECS). **Preferred** for any "last deploy / release / publish" question in any language.

### `deployment_status`
Returns `deployments[]` (newest first) and `gaps[]` when a platform is missing or unavailable.

**Parameters:**
- `env?` — environment label (e.g. `PRD`, `prod`) — optional; defaults to catalog default env
- `scope` — `auto` (default) | `vercel` | `ci` | `gitops` | `static_web` | `ecs` | `all`

**Examples:**
- _"¿Cuál fue el último despliegue?"_ / _"What was the last deployment?"_
- _"When did we last publish to production?"_
- _"Latest release on ECS?"_ → `scope=ecs`

**Agent rules:**
1. Call **`deployment_status(scope=auto)` first** — do not default to `vercel_deploys_latest`.
2. If `capabilities.vercel` is false, never call `vercel_*`.
3. Read `gaps[]` — Community: `set-work-context` + `configure-integration`; Team: admin **https://admin.opsphere.io** (see `ops_my_usage` → Catalog configuration).
4. Use `vercel_deploys_latest` only for explicit Vercel-only questions or when gaps direct you there.

**Community:** included in the Community operational catalog.

### `ops_incident_rollup` [built-in]
Read-only compact incident timeline: active Datadog alerts, `deployment_status`, and error spikes for an environment. For interactive triage with live SSE progress, use `macro_outage_triage` instead.

**Parameters:** `env?`, `hours?` (default 6, max 48)

**Example**: _"Give me an incident rollup for production in the last 6 hours"_

---

## Vercel

Requires: `VERCEL_TOKEN` (and optionally `VERCEL_TEAM_ID` for team projects).

### `vercel_deploys_latest`
List the most recent deployments for a project.

**Example**: _"Show my latest Vercel deploys for storefront-prod"_

---

### `vercel_deployment_logs`
Build and runtime log events for a deployment (latest or explicit `deploymentId`).

**Example**: _"Show build logs for the latest storefront-prod deploy"_

---

### `vercel_project_status`
Get a project summary including environment variables and latest deploys.

**Example**: _"What's the status of my Vercel project?"_

---

## Railway

Requires: `RAILWAY_API_TOKEN` (account, workspace, or project token). Optional `RAILWAY_API_URL` (default `https://backboard.railway.com/graphql/v2`).

Read-only operational integration via Railway Public API (GraphQL v2): projects, services, deployments, logs, metrics, env variable names, domains, volumes, and incident diagnostics. Variable **values** are never returned — only names. Combine `railway_domains` with `dns_lookup` / `http_check` / `cert_status` for live DNS/TLS/HTTP verification.

### `railway_projects_list`
List projects accessible to the API token (scope depends on token type).

**Example**: _"List my Railway projects"_

---

### `railway_environments_list`
List environments in a project (`project` accepts ID or unique name).

**Example**: _"What environments exist in my storefront project?"_

---

### `railway_services_list`
List services and service instances in a project; optional environment filter and latest deployment summary.

**Example**: _"List Railway services in production for storefront"_

---

### `railway_project_status`
Operational summary: environments, services, latest deployments, optional domains/volumes. SUCCESS does not prove HTTP health.

**Example**: _"What's the status of my Railway storefront project?"_

---

### `railway_service_status`
Detailed status for a service in an environment: instance, latest deployment, optional domains/metrics/recent deployments.

**Example**: _"Is the API service healthy on Railway production?"_

---

### `railway_deployments_latest`
Recent deployments with optional environment, service, status, and time filters.

**Example**: _"Show failed Railway deploys in the last 24 hours"_

---

### `railway_deployment_get`
Deployment detail by ID; optional build/runtime logs.

**Example**: _"Get details for Railway deployment abc123"_

---

### `railway_logs`
Historical build, runtime, or environment logs (secrets redacted). Requires `deployment_id` or `project`+`environment`.

**Example**: _"Show Railway runtime logs for the latest API deployment"_

---

### `railway_errors_recent`
Grouped summary of recent error (and optional warn) logs. Requires `project`+`environment`.

**Example**: _"What errors appeared in Railway production in the last hour?"_

---

### `railway_metrics_summary`
Service resource metrics (CPU, memory, network, disk) via official metrics query.

**Example**: _"Show Railway CPU and memory for the API service"_

---

### `railway_env_list`
List environment variable **names** only (never values). Optional service scope.

**Example**: _"Which env vars are set on Railway staging?"_

---

### `railway_env_diff`
Compare variable names between two environments (no values).

**Example**: _"Diff Railway env vars between staging and production"_

---

### `railway_domains`
List Railway and custom domains for services. Does not verify DNS/TLS/HTTP.

**Example**: _"What domains are attached to my Railway API service?"_

---

### `railway_volumes`
List persistent volumes and mounts (read-only).

**Example**: _"Show Railway volumes for the database service"_

---

### `railway_health_summary`
Deterministic health rollup across services and deployments; optional recent errors and metrics.

**Example**: _"Give me a Railway health summary for storefront production"_

---

### `railway_incident_diagnosis`
Correlated read-only diagnosis across deployments, logs, and metrics. Returns hypotheses — not confirmed root cause.

**Example**: _"Diagnose why my Railway API is failing in production"_

---

### `railway_dashboard`
Multi-project overview: status rollup across accessible projects.

**Example**: _"Show my Railway dashboard across all projects"_

---

## GitHub Enterprise

Requires: `GHE_TOKEN` (and optionally `GHE_BASE_URL` for self-hosted instances).

For **github.com**, only `GHE_TOKEN` is required — the gateway defaults to `https://api.github.com`. Pass `repo` as `owner/repo` (e.g. `acme/storefront`).

**Subagent (paid plans):** For failed workflows or multi-step CI triage on **Professional / Team / Enterprise**, use **`/ci-investigator`** — read-only structured report with `ghe_actions_diagnose`. Community: use `ghe_actions_latest` inline or upgrade; see [PLANS.md](PLANS.md).

### `ghe_repo_summary`
Get a repository summary: default branch, latest commit, open PRs. Accepts `repo` as repository name or `owner/repo` slug.

**Example**: _"Summarize acme/storefront on GitHub"_

---

### `ghe_actions_latest`
Show the latest workflow run for a repository.

**Example**: _"What GitHub Actions ran on main today?"_

---

### `ghe_actions_diagnose` (Professional / Team / Enterprise)

Auto-diagnose the latest failed workflow: finds the failed run, identifies failed jobs/steps, returns log excerpts.

**Example**: _"Why did GitHub Actions fail on my-app?"_

**Tip**: On paid plans, **`/ci-investigator`** runs this plus PR/deploy correlation in one structured report.

---

## Bitbucket

Requires: `BITBUCKET_API_EMAIL`, `BITBUCKET_API_TOKEN`.

**Subagent (paid plans):** **`/ci-investigator`** combines Bitbucket and GitHub diagnosis on **Professional / Team / Enterprise**. Community can still use `bb_pipeline_diagnose` directly in chat for a single repo.

### `bb_pipelines_latest`
List the latest pipeline runs for a repository.

**Example**: _"Show the last 3 pipelines for the backend repo"_

---

### `bb_pipeline_diagnose`
Diagnose a failed pipeline: identify the failed step and show its log output.

**Example**: _"Why did the last Bitbucket pipeline fail?"_

---

## GitLab

Requires: `GITLAB_TOKEN` (optional `GITLAB_BASE_URL`, `GITLAB_GROUP`).

### `gl_pipelines_latest`
List the latest CI/CD pipeline runs for a GitLab project.

**Example**: _"Show the last 3 pipelines for acme/backend"_

---

### `gl_pipeline_diagnose`
Diagnose a failed pipeline: identify the failed job and show log excerpts.

**Example**: _"Why did the last GitLab pipeline fail?"_

---

## SonarQube

Requires: `SONAR_TOKEN`, `SONAR_HOST_URL` (optional `SONAR_ORGANIZATION` for SonarCloud, `SONAR_DEFAULT_PROJECT`).

For **SonarCloud**, set `SONAR_HOST_URL` to `https://sonarcloud.io` (not a project URL). Project parameters accept a SonarCloud overview URL, `org_project` key, or plain project key.

Read-only code quality: project lookup, last-scan snapshot, quality gates, measures, branches, issues, and security hotspots.

### `sq_projects_search`
Find a project by SonarCloud URL, `org_project` key, or text query. For exact URL/key lookup, uses Browse-safe APIs (works without org-admin).

**Example**: _"Find project https://sonarcloud.io/project/overview?id=acme_storefront"_

---

### `sq_last_scan_summary`
One-call snapshot of the latest analysis: date, quality gate status, overall + new-code metrics, and open-issue counts by severity/type. **Prefer this** when the user asks for last scan results, último análisis, or metrics after finding a project.

**Example**: _"What were the last Sonar scan results for acme_storefront?"_

---

### `sq_quality_gate_status`
Quality gate OK/ERROR for a project, optionally per branch or pull request.

**Example**: _"Did the quality gate pass for acme:storefront on main?"_

---

### `sq_measures_summary`
Curated overall and/or new-code metrics (bugs, vulnerabilities, coverage, ratings).

**Example**: _"Show Sonar coverage and new-code bugs for acme:storefront"_

---

### `sq_analyses_latest`
Recent analysis history (timestamps, versions). For a full snapshot use `sq_last_scan_summary` instead.

**Example**: _"When was acme:storefront last scanned?"_

---

### `sq_issues_search`
Search code issues with file, line, rule, and message. Use `types: ["CODE_SMELL"]` for code smells, `types: ["BUG"]` for bugs. Use `inNewCodePeriod=true` for new-code violations only.

**Example**: _"List critical Sonar issues in new code for acme:storefront"_ / _"Qué code smells hay en acme_storefront"_

---

### `sq_duplications_show`
Files with duplicated lines and duplication blocks (line ranges + duplicate file paths). Default expands top 5 files. Use `file` for a single file, `topFiles: 0` for list-only.

**Example**: _"Where is duplicated code in acme_storefront?"_ / _"Código duplicado en acme_storefront"_

---

**Recommended conversational flow**

1. User pastes SonarCloud URL → `sq_projects_search(q=<URL>)` → `sq_last_scan_summary(project=<key>)`
2. Quality gate failed → `sq_last_scan_summary` or `sq_quality_gate_status` → `sq_issues_search(inNewCodePeriod=true)`
3. "Qué code smells / issues" → `sq_issues_search(project, types=[CODE_SMELL])`
4. "Código duplicado / where duplicated" → `sq_duplications_show(project)`

**Guided prompt** (when listed in `opsphere://playbooks/index`): `diagnose-sonarqube-quality-gate` — structured QG failure triage with suggested `sq_*` tool order.

**Bedrock Agents** (AWS module, paid plans with `aws` enabled): `aws_bedrock_agent_diagnose` → `aws_lambda_agent_diagnose` per action-group Lambda. Prompt: `investigate-bedrock-agent`. Not Agent Core — clarify scope if the user mentions Agent Core.

---

## Algolia

**Built-in (no credentials):** `alg_status`, `alg_incidents` — global Algolia infrastructure monitoring.

**Search API (paid module):** per-environment config in **Cloud Catalog** (`algolia_application_id`, `algolia_default_index`, `{env}:api_key`). Legacy global credentials still work as fallback. All credentialed tools accept optional `env` (INT/TST/PRE/PRD or catalog slug).

Read-only search triage: indices, settings, query reproduction, record lookup, API logs.

### `alg_indices_list`
List indices (name, entries, data size, last build).

**Parameters:** `env?` — target catalog environment (defaults to account default).

**Example**: _"List my Algolia indices in TST"_

---

### `alg_index_settings`
Read index settings (ranking, replicas, synonym references).

**Parameters:** `env?`, `index?` (defaults to environment default index).

**Example**: _"Show Algolia settings for the products index"_

---

### `alg_search`
Run a search query (`hitsPerPage` capped at 20 on the gateway).

**Parameters:** `query` (required), `env?`, `index?`, `hitsPerPage?`, `filters?`.

**Example**: _"Search Algolia for SKU 12345 in the storefront index"_

---

### `alg_object_get`
Fetch a single record by `objectID` — verify a SKU/record is indexed.

**Parameters:** `objectID` (required), `env?`, `index?`.

**Example**: _"Is product SKU-ABC indexed in Algolia?"_

---

### `alg_logs`
Recent Algolia API operations (last 7 days). **Consumes operations quota** — use sparingly.

**Parameters:** `env?`, `index?`, `type?`, `offset?`, `length?`.

**Example**: _"Show recent Algolia indexing errors for the products index"_

---

## Cloudflare

Requires: `CLOUDFLARE_API_TOKEN`.

### `cf_quick_status`
Quick health check for a Cloudflare zone: status, SSL, and nameservers.

**Example**: _"What's the Cloudflare status for mycompany.com?"_

---

### `cf_dns_records`
List DNS records for a Cloudflare zone.

**Example**: _"Show DNS records for mycompany.com"_

---

### `cf_cache_purge`
Purge cached assets for a zone (URLs, cache-tags, hosts, or path prefixes). **Destructive** — requires API token with Cache Purge permission.

**Example**: _"Purge Cloudflare cache for https://mycompany.com/assets/logo.png"_

---

### `cf_workers_scripts_list`
List Worker scripts in the Cloudflare account (distinct from zone Workers routes).

**Parameters:** `accountId?`, `zoneOrId?` (to resolve account).

**Example**: _"List Cloudflare Worker scripts"_

---

### `cf_logpush_jobs_list`
List Logpush jobs for a zone (Datadog, Scrunch, S3 destinations).

**Parameters:** `zone` (required).

**Example**: _"Show Logpush jobs for breitling.com"_

---

### `cf_snippets_list`
List Snippets deployed on a zone.

**Parameters:** `zone` (required).

**Example**: _"List Cloudflare snippets on www-storefront.breitling.com"_

---

### `cf_rules_lists_list`
List account Rules Lists (IP allowlists used in WAF as `ip.src in $name`).

**Parameters:** `accountId?`, `zoneOrId?`, `kind?` (`ip`, `hostname`, `asn`, `redirect`).

**Example**: _"List Cloudflare IP rules lists"_

---

### `cf_load_balancers_list`
List account Load Balancers (name, hostname, enabled, pool ids). Optional zone filter.

**Parameters:** `accountId?`, `zoneOrId?`, `zone?`, `search?`, `page?`, `per_page?`.

**Permission:** Account Load Balancers Read (configured on Breitling token).

**Example**: _"List Cloudflare load balancers for breitling.com"_

---

### `cf_load_balancer_get`
Load Balancer detail: pools, origins (healthy/unhealthy), steering, session affinity.

**Parameters:** `loadBalancerId` (from `cf_load_balancers_list`), `zoneOrId` or `zone` (required — zone name or ID), `accountId?`.

**Example**: _"Show Cloudflare LB detail for id …"_

---

### `cf_lb_pools_list`
List account LB pools with origin health counts.

**Parameters:** `accountId?`, `zoneOrId?`, `page?`, `per_page?`.

**Example**: _"List Cloudflare LB pools and origin health"_

---

### `cf_lb_monitors_list`
List account LB health monitors (path, interval, retries, expected codes).

**Parameters:** `accountId?`, `zoneOrId?`, `page?`, `per_page?`.

**Example**: _"List Cloudflare LB health monitors"_

---

### `cf_account_ruleset_entrypoint_get`
Read account-level ruleset entrypoint (managed WAF, rate limiting, bulk redirects).

**Parameters:** `phase` (`http_request_firewall_managed`, `http_ratelimit`, `http_request_redirect`), `accountId?`, `zoneOrId?`.

**Example**: _"Show account bulk redirect rules on Cloudflare"_

---

### `cf_zone_settings_get`
Get zone settings (all settings or one by `settingId` like `ssl`, `security_level`).

**Parameters:** `zone` (required), `settingId?`.

**Example**: _"What is the SSL mode for breitling.com?"_

---

## Jira

Requires: `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.

### `jira_issue_get`
Fetch a Jira issue by key.

**Example**: _"Get Jira issue PROJ-1234"_

---

### `jira_issues_search`
Search Jira issues using JQL.

**Example**: _"Find open Jira issues assigned to me in project BEC"_

---

## Sentry

Requires: `SENTRY_AUTH_TOKEN`.

### `sentry_issues_list`
List Sentry issues with filters (status, severity, environment).

**Example**: _"Show unresolved fatal errors in Sentry"_

---

### `sentry_issues_search`
Advanced Sentry issue search with sorting.

**Example**: _"Search Sentry for unresolved errors in the last 24 hours, sorted by frequency"_

---

## AWS

Requires: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (static IAM — **not** AWS SSO).

> **Important**: Do not pass `profile` unless your plan includes SSO and you have an active SSO session. On the free plugin tier, SSO login tools are not available. Default AWS region is not stored during setup — specify region in the CLI command when needed.

### `aws_sts_whoami`
Return the current AWS identity (account ID and ARN).

**Example**: _"Who am I in AWS?"_

Call **without** `profile`.

---

### `aws_cli_query`
Run a read-only AWS CLI query (describe/list/get) against any service.

**Example**: _"List my S3 buckets"_ or _"Describe the Lambda function payments-prod"_

Call **without** `profile`. Add `--region <region>` in the command when the user specifies a region.

---

### `aws_athena_query`
Run a **read-only** Athena SQL query (Start → poll → GetQueryResults). Requires `workGroup` and/or `outputLocation` (`s3://…`). Optional: `database`, `catalog`, `maxRows` (default 100, max 500), `region`.

**Example**: _"Run SELECT … on Athena database analytics"_

Prefer this over `aws_cli_query` for Athena. SQL must be SELECT / WITH…SELECT / SHOW / DESCRIBE / EXPLAIN — no DML/DDL/UNLOAD/CTAS.

---

### `aws_s3_find`
List objects in a bucket by `prefix` or exact `key` (ListObjectsV2, one page). Does **not** download object bodies. Optional: `delimiter`, `maxKeys` (default 50, max 200), `region`.

**Example**: _"Find keys under logs/2026/ in bucket acme-logs"_

Prefer this over `aws_cli_query` / `s3api list-objects` for prefix/key discovery.

---

### `aws_dynamodb_describe_table`
Describe table structure (key schema, GSIs/LSIs, status, approx size). No item data.

**Example**: _"What are the partition/sort keys on table orders?"_

Use before `aws_dynamodb_query` when key attribute names are unknown.

---

### `aws_dynamodb_query`
Query a DynamoDB table or GSI (**Query only** — no Scan). Requires `keyConditionExpression` and `expressionAttributeValues` with PK (and SK when needed). Optional: `indexName`, `filterExpression`, `limit`, `region`.

**Example**: _"Query table orders where pk = USER#123"_

If KeyCondition is unknown, call `aws_dynamodb_describe_table` first — never invent a Scan.

---

### `aws_rds_data_query`
Run **read-only** SQL via Aurora **RDS Data API** (HTTPS). Requires cluster `resourceArn` + Secrets Manager `secretArn` (secret stays in the customer account — Opsphere never stores the DB password). Optional: `database`, `schema`, `maxRows`, `region`. Data API must be enabled on the cluster.

**Example**: _"SELECT count(*) FROM orders WHERE status = 'failed' via Data API"_

Out of scope: classic RDS without Data API, TCP/VPC connections, write SQL.

---

### AWS data tools — troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| `AccessDenied` / permission errors | IAM/SSO role of the logged-in user lacks the API action | Ask admin to grant Athena / S3 List / DynamoDB / `rds-data:ExecuteStatement` as needed — re-login will **not** fix missing permission sets |
| Athena needs output location | Workgroup has no result config | Pass `workGroup` with enforced output **or** `outputLocation=s3://…` |
| DynamoDB query fails on key | Wrong KeyCondition / attribute names | Run `aws_dynamodb_describe_table`, then query with HASH (+ RANGE if present) |
| RDS Data API errors / HTTP 400 | Cluster without Data API, bad ARN, or secret | Confirm Aurora Data API enabled; pass correct `resourceArn` + `secretArn`. Non–Data API RDS is out of scope |

All five use the same credentials as other AWS tools (static IAM on the free plugin tier; SSO/profile when your plan provides an active session). Call **without** `profile` on the free plugin tier.

---

### `aws_bedrock_agent_diagnose`
Diagnose an **Amazon Bedrock Agent**: status, alias, action groups, backing Lambdas, IAM execution role, knowledge bases, deterministic findings, resource graph, and `suggestions[]`. Read-only (`bedrock-agent`, `lambda`, `iam`, `logs`).

**Parameters:** `agentId` (required), optional `agentAliasId`, `agentVersion`, `region`, `profile`, `hours` (default 2).

**Example:** _"What's wrong with Bedrock agent AGENT12345?"_

Prefer this over `aws_cli_query` for operational agent triage. Then run `aws_lambda_agent_diagnose` for each Lambda in `lambdas[]`.

**Guided prompt:** `investigate-bedrock-agent` (when listed in `opsphere://playbooks/index`).

---

### `aws_lambda_agent_diagnose`
Diagnose a **Lambda** used by a Bedrock Agent action group: runtime, timeout, memory, IAM policy names, CloudWatch error samples, signals (OOM, public invoke, deprecated runtime). Environment variable **values** are never returned — keys only.

**Parameters:** `functionName` (required), optional `hours` (default 2), `profile`, `region`, `logTail` (default 15).

**Example:** _"Diagnose Lambda my-bedrock-action-fn for the agent"_

Pair with `aws_bedrock_agent_diagnose` — do not skip agent-level context when the user mentions Bedrock.

---

## Azure data query tools (P0)

Requires: active **Azure delegated session** in web chat (`azure_user_login_start` + `azure_user_login_poll`). Same user RBAC as `azure_cli_query` — no new Opsphere credentials.

### `azure_log_analytics_query`
Run **read-only** KQL against a Log Analytics workspace (`workspaceId` + `kql`). Optional: `timespan` (e.g. `PT1H`), `startTime`/`endTime`, `maxRows` (default 100, max 500), `azure_tenant_id`.

**Example**: _"Query App Insights exceptions in the last hour"_

Prefer this over `azure_cli_query` for Log Analytics / App Insights incidents. Mutation KQL is blocked at the gateway.

---

### `azure_blob_find`
List blobs in a container by `prefix` or exact `key` (single page). Does **not** download bodies. Requires Storage Blob Data Reader (or equivalent) on the container. Optional: `maxResults` (default 50, max 200), `azure_tenant_id`.

**Example**: _"Find blobs under logs/2026/ in storage account acmestore container app-logs"_

Prefer this over `azure_cli_query("storage blob list …")` for prefix/key discovery.

---

### `azure_keyvault_secrets_list`
List secret **metadata** in a Key Vault (`vaultUrl`). Never returns secret values. Optional: `maxResults`, `azure_tenant_id`.

**Example**: _"What secrets exist in vault https://myvault.vault.azure.net?"_

Use before `azure_keyvault_secret_metadata` when names are unknown.

---

### `azure_keyvault_secret_metadata`
Metadata for one secret by `secretName` (enabled, expiry, tags). Never returns the `value`. Optional: `azure_tenant_id`.

**Example**: _"When does secret db-connection-string expire?"_

Prefer over `azure_cli_query("keyvault secret show …")` — generic CLI blocks secret show/download.

### Azure data tools — troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Auth / login required | No delegated Azure session | `azure_user_login_start` → user completes device code → `azure_user_login_poll` until `completed` |
| Log Analytics 403 | Missing Log Analytics Reader on workspace | Grant RBAC on workspace/resource group |
| Blob 403 | Missing Storage Blob Data Reader | Grant on container/account or use `azure_cli_query` fallback |
| Key Vault 403 | Missing list/get metadata permission | Grant Key Vault Secrets User (metadata) — values are never returned by these tools |

Community tenants: these four tools stay in `disabledTools` until enabled on the tenant plan (same pattern as AWS data tools).

---

## Macro Workflows (Team / Enterprise)

Composite read-only tools that run multi-step investigations on the gateway with **SSE progress** (Streamable HTTP). Require Cursor 2026+ for progress UI in the IDE.

| Tool | Purpose |
|------|---------|
| `macro_endpoint_health` | DNS + HTTP + TLS for one hostname/URL |
| `macro_env_health` | Environment snapshot (errors, deploys, capacity) |
| `macro_outage_triage` | Incident triage: edge, deploys, errors, optional K8s |

**Community:** not available (`MACROS_PAID_ONLY`). Use subagents or atomic tools.

Skill: [`skills/run-macro-workflows/`](skills/run-macro-workflows/).

---

## Premium Tools (Pro / Enterprise)

The following categories are available on paid plans:

- **Kubernetes** — pod logs, cluster summary, resource YAML, rollout history
- **ArgoCD** — app list, sync/health status, unhealthy resources
- **Azure** — Service Bus, DNS, resource groups, CLI queries
- **Akamai** — WAF policies, cache purge, property rules
- **Observability** — multi-environment health digest, capacity overview
- **Confluence** — page search and content read
- **Contentful**, **Pingdom**, and more

Upgrade at **https://opsphere.io/pricing**.
