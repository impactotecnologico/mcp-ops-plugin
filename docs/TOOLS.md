# Tools Reference

All tools are provided by the Opsphere remote MCP server.
Tools marked **[built-in]** work immediately after login — no integration credentials needed.
All others require the corresponding integration to be configured first (see [INSTALL.md](INSTALL.md)).

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
