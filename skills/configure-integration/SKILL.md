---
name: configure-integration
description: Connect Datadog, Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, GitLab, PagerDuty, Prometheus, or AWS — step-by-step guided setup from the chat. Use when the user wants to add, configure, or reconnect a provider, or when a tool reports missing credentials.
---

# Configure Integration

This skill guides users through connecting their third-party services to Opsphere.
It uses four MCP tools from the backend:

- `ops_configure_integration(provider, credentials)` — **the only tool that persists integration secrets** on the gateway (encrypted, tenant-scoped)
- `ops_list_integrations()` — shows configured vs. pending providers (masked previews only)
- `ops_test_integration(provider)` — verifies credentials actually work
- `ops_remove_integration(provider)` — removes all credentials for a provider

> **Security:** Collect credentials one at a time in conversation, but pass them to the gateway **only** in `ops_configure_integration`. Do not ask users to paste keys in unrelated messages, work context, or memory.

## General Flow

1. **Check current status**: Call `ops_list_integrations` to see what is already configured.
2. **Identify the provider**: Determine which provider the user wants to configure.
3. **Explain what is needed**: Tell the user which credentials are required and how to obtain them.
4. **Collect credentials**: Ask for each value conversationally — one prompt per credential, not all at once.
5. **Configure**: Call `ops_configure_integration` once with all credentials as a map.
   > **Important**: pass all keys for the provider in a single call, not one call per key.
6. **Verify**: Call `ops_test_integration(provider)` to confirm the connection works.
7. **Confirm**: Tell the user which tools are now available.

---

## Provider: Datadog

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `DD_API_KEY` | Yes | Datadog API Key | Organization Settings → API Keys |
| `DD_APP_KEY` | Yes | Datadog Application Key | Organization Settings → Application Keys |
| `DD_SITE` | No | Datadog site (defaults to `datadoghq.com`) | Check your Datadog URL |

**Setup steps**:

1. Ask: "I need your Datadog API Key and Application Key. Let me walk you through finding them."
2. Direct the user to https://app.datadoghq.com/organization-settings/api-keys — copy or create an API key.
3. Direct to https://app.datadoghq.com/organization-settings/application-keys — copy or create an App Key.
4. Ask: "What is your Datadog URL? For example, `app.datadoghq.com`, `app.datadoghq.eu`, `us5.datadoghq.com`."
   - Map the URL to the correct site value: `datadoghq.com`, `datadoghq.eu`, `us3.datadoghq.com`, `us5.datadoghq.com`, `ap1.datadoghq.com`.
   - If the user is on `datadoghq.com`, `DD_SITE` can be omitted (it is the default).
5. Call `ops_configure_integration` with all values at once:
   ```
   ops_configure_integration(provider: "datadog", credentials: {
     "DD_API_KEY": "<api_key>",
     "DD_APP_KEY": "<app_key>",
     "DD_SITE": "<site>"
   })
   ```
6. Call `ops_test_integration(provider: "datadog")` to verify.
7. On success: "Datadog is connected! You can now use `dd_logs_search`, `dd_errors_by_service`, `dd_errors_recent`, and `dd_synthetics_summary`."

**Common issues**:
- 403 Forbidden → the API key lacks read permissions or the App Key user has insufficient access.
- Wrong site → 401 or timeout. Double-check the Datadog URL — the domain after the `app.` subdomain is the site.

---

## Provider: Vercel

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `VERCEL_TOKEN` | Yes | Vercel API Token | Account Settings → Tokens |
| `VERCEL_TEAM_ID` | No | Team ID for team projects | Team Settings → General |

**Setup steps**:

1. Ask: "I need your Vercel API token. Let me help you find it."
2. Direct to https://vercel.com/account/tokens → Create Token. Scope: "Full Account" or restrict to specific projects.
3. If the user works within a Vercel team, also ask for the Team ID (starts with `team_`). Find it under Team Settings → General.
4. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "vercel", credentials: {
     "VERCEL_TOKEN": "<token>",
     "VERCEL_TEAM_ID": "<team_id>"
   })
   ```
   If no team, omit `VERCEL_TEAM_ID`.
5. Call `ops_test_integration(provider: "vercel")` to verify.
6. On success: "Vercel is connected! You can now use `vercel_deploys_latest` and `vercel_project_status`."

**Common issues**:
- 401 → token is invalid or expired. Create a new one.
- Projects from a team not showing → the `VERCEL_TEAM_ID` is likely missing or incorrect.

---

## Provider: GitHub Enterprise

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `GHE_TOKEN` | Yes | Personal Access Token (classic or fine-grained) | Settings → Developer Settings → Personal Access Tokens |
| `GHE_BASE_URL` | No | API base URL for GitHub Enterprise Server | e.g., `https://github.mycompany.com/api/v3` |

> **Note**: For github.com, only `GHE_TOKEN` is needed. `GHE_BASE_URL` is only required for self-hosted GitHub Enterprise Server instances.

**Setup steps**:

1. Ask: "Are you using github.com or a self-hosted GitHub Enterprise Server?"
2. For github.com: direct to https://github.com/settings/tokens → Generate new token (classic).
   Required scopes: `repo`, `read:org`, `workflow`.
3. For GHE Server: same path but on their own GitHub instance. Also ask for the base URL.
4. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "github", credentials: {
     "GHE_TOKEN": "<token>"
   })
   ```
   For GHE Server, also include:
   ```
   "GHE_BASE_URL": "https://github.mycompany.com/api/v3"
   ```
5. Call `ops_test_integration(provider: "github")` to verify.
6. On success: "GitHub is connected! You can now use `ghe_repo_summary` and `ghe_actions_latest`."

**Common issues**:
- 401 → token is expired or revoked. Generate a new one.
- 404 on repos → missing `repo` scope or the token is a fine-grained token without the right repository access.

---

## Provider: Bitbucket

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `BITBUCKET_API_EMAIL` | Yes | Bitbucket account email | Your Atlassian account email |
| `BITBUCKET_API_TOKEN` | Yes | App Password | Personal Settings → App Passwords |

**Setup steps**:

1. Ask for the user's Bitbucket account email.
2. Direct to https://bitbucket.org/account/settings/app-passwords/ → Create app password.
   Required permissions: Repositories (read), Pipelines (read), Pull requests (read).
3. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "bitbucket", credentials: {
     "BITBUCKET_API_EMAIL": "<email>",
     "BITBUCKET_API_TOKEN": "<app_password>"
   })
   ```
4. Call `ops_test_integration(provider: "bitbucket")` to verify.
5. On success: "Bitbucket is connected! You can now use `bb_pipelines_latest` and `bb_pipeline_diagnose`."

**Common issues**:
- 401 → wrong email or app password. Note: Bitbucket app passwords use Basic auth with `email:app_password`.
- Missing pipeline access → ensure the Pipelines (read) permission is enabled on the app password.

---

## Provider: GitLab

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `GITLAB_TOKEN` | Yes | Personal Access Token | User Settings → Access Tokens |
| `GITLAB_BASE_URL` | No | API base URL | Default `https://gitlab.com/api/v4`; set for self-hosted GitLab |
| `GITLAB_GROUP` | No | Default group/namespace | Used by `gl_projects_list` when namespace is omitted |

**Setup steps**:

1. Ask whether they use gitlab.com or self-hosted GitLab.
2. Direct to User Settings → Access Tokens → create token with `read_api` and `read_repository` scopes.
3. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "gitlab", credentials: {
     "GITLAB_TOKEN": "<token>",
     "GITLAB_BASE_URL": "https://gitlab.com/api/v4",
     "GITLAB_GROUP": "<optional-group-slug>"
   })
   ```
4. Call `ops_test_integration(provider: "gitlab")` to verify.
5. On success: "GitLab is connected! You can now use `gl_pipelines_latest` and `gl_pipeline_diagnose`."

**Common issues**:
- 401 → invalid or expired token, or missing scopes.
- 404 on self-hosted → verify `GITLAB_BASE_URL` ends with `/api/v4`.

---

## Provider: Cloudflare

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API Token | My Profile → API Tokens |

> **Note**: Use an API Token (scoped), not the Global API Key. Tokens are more secure and can be revoked independently.

**Setup steps**:

1. Direct to https://dash.cloudflare.com/profile/api-tokens → Create Token.
2. Use the "Read all resources" template, or create a custom token with: Zone → Read, DNS → Read.
3. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "cloudflare", credentials: {
     "CLOUDFLARE_API_TOKEN": "<token>"
   })
   ```
4. Call `ops_test_integration(provider: "cloudflare")` to verify.
5. On success: "Cloudflare is connected! You can now use `cf_quick_status` and `cf_dns_records`."

**Common issues**:
- 403 → token lacks the required zone permissions. Edit the token in the Cloudflare dashboard and add Zone:Read.

---

## Provider: Jira

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `JIRA_DOMAIN` | Yes | Jira site domain | e.g., `mycompany.atlassian.net` |
| `JIRA_EMAIL` | Yes | Atlassian account email | Your Atlassian account email |
| `JIRA_API_TOKEN` | Yes | Jira API Token | https://id.atlassian.com/manage-profile/security/api-tokens |

**Setup steps**:

1. Ask: "What is your Jira domain? For example, `mycompany.atlassian.net`."
2. Ask for the Atlassian account email.
3. Direct to https://id.atlassian.com/manage-profile/security/api-tokens → Create API Token.
4. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "jira", credentials: {
     "JIRA_DOMAIN": "<domain>",
     "JIRA_EMAIL": "<email>",
     "JIRA_API_TOKEN": "<token>"
   })
   ```
5. Call `ops_test_integration(provider: "jira")` to verify.
6. On success: "Jira is connected! You can now use `jira_issue_get` and `jira_issues_search`."

**Common issues**:
- 401 → wrong email or token. The email must be the one associated with the Atlassian account that generated the token.
- 404 on project → the user account may not have access to that Jira project.

---

## Provider: Sentry

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `SENTRY_AUTH_TOKEN` | Yes | Sentry Auth Token | Settings → Auth Tokens |

**Setup steps**:

1. Direct to https://sentry.io/settings/auth-tokens/ → Create New Token.
   Required scopes: `project:read`, `org:read`, `issue:read`.
2. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "sentry", credentials: {
     "SENTRY_AUTH_TOKEN": "<token>"
   })
   ```
3. Call `ops_test_integration(provider: "sentry")` to verify.
4. On success: "Sentry is connected! You can now use `sentry_issues_list` and `sentry_issues_search`."

**Common issues**:
- 401 → token is invalid or expired. Tokens in Sentry have optional expiry — check the token's settings.
- 403 → token is missing required scopes. Delete it and create a new one with `project:read`, `org:read`, `issue:read`.

---

## Provider: AWS

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `AWS_ACCESS_KEY_ID` | Yes | IAM Access Key ID | IAM Console → Users → Security Credentials → Create Access Key |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM Secret Access Key | Shown once at key creation — must be copied immediately |

> **Note**: Plugin users typically use static IAM access keys (not enterprise SSO). The minimum required IAM policy is `sts:GetCallerIdentity` for identity verification; add read-only permissions only for the AWS operations you need.

**Setup steps**:

1. Ask: "I need your AWS Access Key ID and Secret Access Key for static IAM authentication."
2. Direct to: AWS Console → IAM → Users → [your user] → Security Credentials → Create Access Key.
   Choose "Command Line Interface (CLI)" as the use case.
3. Warn the user: "The Secret Access Key is shown only once — copy it before closing that page."
4. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "aws", credentials: {
     "AWS_ACCESS_KEY_ID": "<key_id>",
     "AWS_SECRET_ACCESS_KEY": "<secret>"
   })
   ```
5. Call `ops_test_integration(provider: "aws")` to verify (runs `sts:GetCallerIdentity`).
6. On success, run the **verification checklist** (both calls **without** `profile`):
   - `aws_sts_whoami`
   - `aws_cli_query` with `command: "sts get-caller-identity"`
7. Tell the user: "AWS is connected! You can use `aws_sts_whoami` and `aws_cli_query` for read-only queries."

**After setup — how to query AWS**:

- Use **static IAM keys only** — the plugin does not support AWS SSO on the free tier.
- **Never** pass `profile` to `aws_sts_whoami` or `aws_cli_query` unless the user's plan includes SSO and they have an active SSO session.
- **Never** call `aws_sso_login*` or `aws_session_status` for plugin users — those tools are disabled on the free tier.
- **Region**: only Access Key + Secret Key are stored. Default region is **not** configured. Omit `region` unless the user asks; when needed, include it in the CLI command (e.g. `ec2 describe-instances --region us-east-1`) or pass the tool's `region` parameter.
- Example — user says _"List my S3 buckets"_ → call `aws_cli_query` with `command: "s3api list-buckets"` (no `profile`, add `--region` only if the user specifies a region).

**Common issues**:
- `InvalidClientTokenId` → the Key ID is wrong or the key has been deactivated in IAM.
- `SignatureDoesNotMatch` → the Secret Key is incorrect. Common cause: trailing space on copy-paste.
- `AccessDenied` → IAM user lacks permissions. Minimum required: `sts:GetCallerIdentity`.
- `Error loading SSO Token` → the agent used SSO or passed `profile` by mistake. Retry without `profile`.

---

## Provider: PagerDuty

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `PAGERDUTY_API_TOKEN` | Yes | REST API User token | PagerDuty → Integrations → Developer Tools → API Access Keys |
| `PAGERDUTY_API_BASE_URL` | No | REST API base (default `https://api.pagerduty.com`) | Usually omit |
| `PAGERDUTY_DEFAULT_SERVICE_ID` | No | Default service filter for incident search | Service → Settings → Service ID |

**Important**: Use a **REST API User token** (`Authorization: Token token=...`). Do **not** use an **Events API v2 routing key** — routing keys only trigger/resolve events and cannot list incidents.

**Setup steps**:

1. Ask for the REST API token from PagerDuty Developer Tools.
2. Optionally ask for a default service ID if the tenant wants incident searches scoped to one service.
3. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "pagerduty", credentials: {
     "PAGERDUTY_API_TOKEN": "<api_token>",
     "PAGERDUTY_DEFAULT_SERVICE_ID": "<optional>"
   })
   ```
4. Call `ops_test_integration(provider: "pagerduty")` — verifies `GET /services?limit=1`.
5. On success: "PagerDuty is connected! You can use `pd_incidents_search` and `alerts_active(source=pagerduty)`."

**Common issues**:
- 401 → invalid token or using a routing key instead of REST API token.
- Empty incident list → no open triggered/acknowledged incidents, or wrong service filter.

---

## Provider: Prometheus

**Required credentials**:

| Key | Required | Description | Where to find it |
|-----|----------|-------------|-----------------|
| `PROMETHEUS_BASE_URL` | Yes | Prometheus server URL (no trailing slash) | e.g. `http://localhost:9090`, in-cluster `http://prometheus:9090` |
| `PROMETHEUS_BEARER_TOKEN` | No | Bearer auth if behind proxy | Reverse proxy / OAuth gateway |
| `PROMETHEUS_BASIC_USER` | No | HTTP basic username | Optional |
| `PROMETHEUS_BASIC_PASSWORD` | No | HTTP basic password | Optional |

**Setup steps**:

1. Ask for the Prometheus base URL reachable from the gateway (VPN/cluster network).
2. Ask if authentication is required (none / bearer / basic).
3. Call `ops_configure_integration`:
   ```
   ops_configure_integration(provider: "prometheus", credentials: {
     "PROMETHEUS_BASE_URL": "http://localhost:9090"
   })
   ```
4. Call `ops_test_integration(provider: "prometheus")` — verifies `/api/v1/status/buildinfo`.
5. On success: "Prometheus is connected! You can use `prom_query`, `prom_alerts`, `prom_targets`, and related `prom_*` tools."

**Local smoke** (developer):

```bash
docker run --rm -p 9090:9090 prom/prometheus:latest
export PROMETHEUS_BASE_URL=http://localhost:9090
curl -s "$PROMETHEUS_BASE_URL/api/v1/query?query=up"
```

**Common issues**:
- Connection refused → URL not reachable from gateway (use VPN or internal URL).
- 401 → missing or wrong bearer/basic credentials.

---

## Handling "Missing Credentials" Errors

If a user tries a tool and gets an error about missing credentials or an unconfigured integration:

1. Identify the provider from the error or the tool name prefix (`dd_` → Datadog, `vercel_` → Vercel, `ghe_` → GitHub, `bb_` → Bitbucket, `gl_` → GitLab, `pd_` → PagerDuty, `prom_` → Prometheus, `cf_` → Cloudflare, `jira_` → Jira, `sentry_` → Sentry, `aws_` → AWS).
2. Call `ops_list_integrations` to confirm the provider is not configured.
3. Offer to set it up: "It looks like [Provider] is not configured yet. Would you like me to help you connect it?"
4. Follow the provider-specific steps above.

---

## Removing an Integration

If the user wants to disconnect a provider:

1. Call `ops_remove_integration(provider: "<name>")`.
2. Confirm: "The [Provider] integration has been removed. Its tools will not work until you reconfigure it."
3. Note: the change takes effect on the next tool call (the session reconnects automatically with updated credentials).

---

## Check Your Usage

To see your plan status, remaining trial days, and daily tool call usage:

> "Show my Opsphere usage"

The agent will use `ops_my_usage` to display your current plan details.
