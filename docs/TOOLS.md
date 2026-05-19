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

## Plan & Usage

> **Coming in Sprint 4.** The `ops_my_usage` tool is not yet available. Until then, visit [https://opsphere.io/pricing](https://opsphere.io/pricing) for plan details.

### `ops_my_usage` *(Sprint 4)*
Show current plan, trial end date, days remaining, daily tool call usage, and upgrade link.

**Example**: _"Show my Opsphere usage"_ or _"How many tool calls do I have left today?"_

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

### `ghe_repo_summary`
Get a repository summary: default branch, latest commit, open PRs.

**Example**: _"Summarize the main repo"_

---

### `ghe_actions_latest`
Show the latest workflow run for a repository.

**Example**: _"What GitHub Actions ran on main today?"_

---

## Bitbucket

Requires: `BITBUCKET_API_EMAIL`, `BITBUCKET_API_TOKEN`.

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

**Example**: _"Get Jira issue BEC-1234"_

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

Requires: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

### `aws_sts_whoami`
Return the current AWS identity (account ID and ARN).

**Example**: _"Who am I in AWS?"_

---

### `aws_cli_query`
Run a read-only AWS CLI query (describe/list/get) against any service.

**Example**: _"List my S3 buckets"_ or _"Describe the Lambda function payments-prod"_

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
