---
name: configure-integration
description: Connect Datadog, Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, or AWS — step-by-step guided setup from the chat. Use when the user wants to add, configure, or reconnect a provider, or when a tool reports missing credentials.
---

# Configure Integration

This skill guides users through connecting their third-party services to Opsphere.
It uses four MCP tools from the backend:

- `ops_configure_integration(provider, credentials)` — stores credentials securely
- `ops_list_integrations()` — shows configured vs. pending providers
- `ops_test_integration(provider)` — verifies credentials actually work
- `ops_remove_integration(provider)` — removes all credentials for a provider

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
6. On success: "AWS is connected! You can now use `aws_sts_whoami` and `aws_cli_query`."

**Common issues**:
- `InvalidClientTokenId` → the Key ID is wrong or the key has been deactivated in IAM.
- `SignatureDoesNotMatch` → the Secret Key is incorrect. Common cause: trailing space on copy-paste.
- `AccessDenied` → IAM user lacks permissions. Minimum required: `sts:GetCallerIdentity`.

---

## Handling "Missing Credentials" Errors

If a user tries a tool and gets an error about missing credentials or an unconfigured integration:

1. Identify the provider from the error or the tool name prefix (`dd_` → Datadog, `vercel_` → Vercel, `ghe_` → GitHub, `bb_` → Bitbucket, `cf_` → Cloudflare, `jira_` → Jira, `sentry_` → Sentry, `aws_` → AWS).
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
