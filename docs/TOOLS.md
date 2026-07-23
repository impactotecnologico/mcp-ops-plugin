# Tools Reference

All tools are provided by the Opsphere remote MCP server.
Tools marked **[built-in]** work immediately after login — no integration credentials needed.
All others require the corresponding integration to be configured first (see [INSTALL.md](INSTALL.md)).

---

## MCP resources

Nine **read-only** resources are registered on the gateway (not in this plugin bundle). Cursor can fetch them after MCP Connect. Use them for policies and catalog context — not as a substitute for live tool calls.

| URI | MIME | Purpose |
|-----|------|---------|
| `opsphere://rules/operational` | markdown | Full tool catalog + tenant scope (same substance as server instructions) |
| `opsphere://tools/catalog` | json | Enabled modules and prompt index for your plan/tenant |
| `opsphere://playbooks/index` | markdown | All MCP prompts by category (e.g. `diagnose-sonarqube-quality-gate`, `investigate-website-outage`) |
| `opsphere://tenant/account-context` | markdown | Per-account cloud catalog (`system_prompt_context`) |
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

**Community:** included in the ~30-tool catalog.

---

## Vercel

Requires: `VERCEL_TOKEN` (and optionally `VERCEL_TEAM_ID` for team projects).

### `vercel_deploys_latest`
List the most recent deployments for a project.

**Example**: _"Show my latest Vercel deploys for storefront-prod"_

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

**Subagent (paid plans):** For failed workflows or multi-step CI triage on **Professional / Team / Enterprise**, use **`/ci-investigator`** — read-only structured report with `ghe_actions_diagnose`. Community: use `ghe_actions_latest` inline or upgrade; see [PLANS.md](PLANS.md).

### `ghe_repo_summary`
Get a repository summary: default branch, latest commit, open PRs.

**Example**: _"Summarize the main repo"_

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

Read-only code quality: quality gates, measures, branches, issues, and security hotspots.

### `sq_quality_gate_status`
Quality gate OK/ERROR for a project, optionally per branch or pull request.

**Example**: _"Did the quality gate pass for acme:storefront on main?"_

---

### `sq_measures_summary`
Curated overall and/or new-code metrics (bugs, vulnerabilities, coverage, ratings).

**Example**: _"Show Sonar coverage and new-code bugs for acme:storefront"_

---

### `sq_issues_search`
Search code issues; use `inNewCodePeriod=true` for new-code violations only.

**Example**: _"List critical Sonar issues in new code for acme:storefront"_

---

**Guided prompt** (when listed in `opsphere://playbooks/index`): `diagnose-sonarqube-quality-gate` — structured QG failure triage with suggested `sq_*` tool order.

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
