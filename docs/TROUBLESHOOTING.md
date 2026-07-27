# Troubleshooting

## Plugin shows red / MCP OAuth refresh error (Cursor Marketplace)

**Symptom**: The Opsphere plugin card in **Settings → Extensions** is **red** (or shows no tools). Chat tools fail with `401 Unauthorized`. Cursor logs (Developer Tools → Console) may show:

```text
MCP OAuth refresh lock acquired
MCP OAuth SDK refresh catch branch
MCP OAuth refresh error
```

**Cause**: Access tokens expire after **24 hours**. Cursor renews them in the background via `POST /oauth/token`. After a **crash**, stale OAuth state, or a burst of refresh requests, renewal can fail (including HTTP **429** rate limit on the gateway).

**Fix** (in order):

1. Run **`/opsphere-reconnect`** in chat — step-by-step recovery.
2. On the **Opsphere plugin card**, click **Sign in** / **Connect** / **Reconnect** and complete browser login.
3. **Developer: Reload Window**, then ask _"What is my Opsphere plan?"_ to verify.
4. If still broken: uninstall the plugin, reload, reinstall from Marketplace, sign in again.
5. If you previously used a **manual MCP** entry with an API key in `~/.cursor/mcp.json`, remove the duplicate `opsphere` server so only the plugin registers the gateway.

**Where to look**: Marketplace installs usually **do not** list Opsphere under **Settings → MCP**. Use the **plugin card** (green + tool count = OK).

**Gateway health** (optional): `curl https://mcp-cursor.opsphere.io/health` → `{"status":"ok"}` means the service is up; OAuth can still need re-auth on the client.

---

## MCP server not connecting

**Symptom**: Opsphere tools don't appear in the agent, or the connection shows as disconnected.

**Checks**:
1. **Marketplace plugin**: check the **Opsphere plugin card** in **Settings → Extensions** (green + tools). Use **Sign in** / **Connect** on the card — not necessarily **Settings → MCP**.
2. **Local dev install** (`~/.cursor/plugins/local/opsphere`): look for **Connect** in **Cursor Settings → MCP**.
3. Test the gateway is reachable:
   ```bash
   curl https://mcp-cursor.opsphere.io/health
   ```
   Expected response: `{"status":"ok"}`
4. If unreachable, check your internet connection or try again in a few minutes.
5. For persistent OAuth errors, run **`/opsphere-reconnect`**.

---

## No "Connect" button visible

**Symptom**: Cursor doesn't show a Connect button after installing the plugin.

**Checks**:
1. **Marketplace plugin**: OAuth is on the **plugin card** in **Extensions**, not always under **Settings → MCP**. Look for **Sign in** / **Connect** there.
2. Reload Cursor: **Command Palette → Developer: Reload Window**.
3. For local dev copies only: **Cursor Settings → MCP** should list `opsphere` — click Connect if shown.
4. If the server or plugin shows an error icon, open details or Developer Tools → Console for `MCP OAuth refresh error`.
5. Make sure you have Cursor version 0.50.0 or later.
6. Run **`/opsphere-reconnect`** if the plugin stays red after reload.

---

## 401 Unauthorized

**Symptom**: Tools return a `401 Unauthorized` error or the agent says your session has expired.

**Cause**: Your access token has expired (tokens last 24 hours).

**Fix**: Re-authenticate from the **Opsphere plugin card** (**Settings → Extensions**) or run **`/opsphere-reconnect`**. For local dev installs, **Settings → MCP → Connect** also works. No need to copy or paste a token.

---

## TRIAL_EXPIRED error

**Symptom**: A tool call returns `TRIAL_EXPIRED`.

**Cause**: Your 30-day free trial has ended.

**Fix**: Upgrade at **https://opsphere.io/pricing** to continue using Opsphere. Re-authenticating will not fix this — it is a subscription state, not an auth issue.

---

## RATE_LIMIT_EXCEEDED error

**Symptom**: A tool call returns `RATE_LIMIT_EXCEEDED`.

**Cause**: You have reached your daily limit of 100 tool calls (Community plan).

**Fix**:
- Wait until midnight UTC — the counter resets daily.
- Run `ops_my_usage` to see daily and monthly usage.
- Upgrade at **https://opsphere.io/pricing** for unlimited tool calls.

---

## Connection Hub / Broker (multi-account)

Applies when `tools/list` includes `ops_accounts_list` — you are on a **Connection Hub**, not a legacy single-tenant workspace.

### BROKER_CONTEXT_REQUIRED

**Symptom**: A tenant-scoped tool (Datadog, K8s, Vercel, `deployment_status`, integrations, etc.) returns `BROKER_CONTEXT_REQUIRED` or mentions a missing `context_id`.

**Cause**: On a Hub, operational tools run against a **linked client workspace**. You must open a server-side work context first and pass `context_id` on every scoped call.

**Fix** (in order):

1. Run **`/open-work-context`** in chat (or ask the agent to follow skill **`open-work-context`**).
2. Call `ops_context_open` with a `linked_connection_id` from `ops_accounts_list`.
3. Retry the original tool with `context_id` in arguments (the agent should do this automatically).
4. Before switching clients, call `ops_context_close` for the active context.

**Related commands**: **`/link-account`** — link a new client workspace before opening context.

---

### Double login (Hub OAuth vs client link)

**Symptom**: You signed in to Opsphere in Cursor, but linking a client or opening context asks you to log in again in the browser.

**Cause**: This is expected. The Hub has its own OAuth identity. Each **linked client workspace** is a separate OAuth grant — you sign in as that client's Opsphere user when linking, not with the Hub password in chat.

**Fix**:

- Complete the browser OAuth when `ops_account_link_start` returns an `authorization_url`.
- Do **not** paste codes, refresh tokens, or passwords into chat.
- After linking, use **`open-work-context`** — you should not need to link again for the same connection.

---

### Account link failed

**Symptom**: Browser shows an error after `ops_account_link_start`, or `ops_accounts_list` does not show the new connection.

| Error / symptom | What to do |
|-----------------|------------|
| `BROKER_DISABLED` | Connection Broker is not enabled on the gateway yet — contact Opsphere support. |
| `MCP_SESSION_REQUIRED` | Reconnect MCP: **`/opsphere-reconnect`** (Cursor) or sign in again on the plugin card. |
| Browser OAuth error | Run **`/link-account`** again; open a fresh `authorization_url`. Never paste secrets in chat. |
| Connection missing after success page | Wait a few seconds, then call `ops_accounts_list` again. |
| `LINKED_CONNECTION_NOT_FOUND` | Refresh the list with `ops_accounts_list`; re-link if the connection was revoked. |

**Skills**: [`link-account`](../skills/link-account/SKILL.md) · [`open-work-context`](../skills/open-work-context/SKILL.md)

---

## READ_ONLY_PLAN error

**Symptom**: A tool call returns `READ_ONLY_PLAN`.

**Cause**: Community plan blocks mutating tools (writes to CDN, cache purge, workflow dispatch, etc.).

**Fix**: Upgrade at **https://opsphere.io/pricing** for Team/Professional write access.

---

## SINGLE_ENVIRONMENT_ONLY error

**Symptom**: A tool call returns `SINGLE_ENVIRONMENT_ONLY`.

**Cause**: Community allows one environment per request (e.g. comparing INT and PRD in one call).

**Fix**: Retry with a single `env` / one entry in `envs`, or upgrade for multi-environment workflows.

---

## CI Investigator blocked on Community plan

**Symptom**: You run **`/ci-investigator`** or ask for automated CI diagnosis and get a message that CI Investigator requires a paid plan.

**Cause**: The **`ci-investigator`** subagent is included on **Professional**, **Team**, and **Enterprise** only. Community includes basic CI tools in chat (`bb_pipeline_diagnose`, `ghe_actions_latest`) but not deep GitHub diagnose (`ghe_actions_diagnose`) or the subagent workflow.

**Fix**:

- For a **single** Bitbucket pipeline: ask _"Diagnose the failed Bitbucket pipeline for [repo]"_ — the main agent can call `bb_pipeline_diagnose` inline.
- For **GitHub**: ask _"What GitHub Actions ran on main?"_ — `ghe_actions_latest` on Community; full auto-diagnose needs an upgrade.
- Upgrade at **https://opsphere.io/pricing** for **`/ci-investigator`** and the full tool catalog.

Run **`ops_my_usage`** to confirm your plan name.

---

## "Missing credentials" for a tool

**Symptom**: A tool call fails with a "missing credentials" message for a specific provider (e.g., Datadog, Vercel).

**Cause**: The integration for that provider hasn't been configured yet.

**Fix**: Say _"Configure my [Provider]"_ in the chat. The agent will walk you through the setup using the `configure-integration` skill.

---

## Integration test fails after configuration

**Symptom**: You configured an integration, but `ops_test_integration` returns an error.

**Possible causes and fixes**:
- **Wrong API key format**: Re-check the key format in our [TOOLS.md](TOOLS.md) reference or the provider's documentation.
- **Insufficient permissions**: The API key may lack the required scopes. See the credentials table in the `configure-integration` skill.
- **Wrong domain or site**: For Jira, confirm the `JIRA_DOMAIN` format is `yourcompany.atlassian.net`. For Datadog, `DD_SITE` defaults to `datadoghq.com` — change if your org uses `datadoghq.eu` or another region.
- **Expired or revoked key**: Regenerate the key in the provider's console and run configure again.

---

## AWS: "Error loading SSO Token" or SSO-related failures

**Symptom**: `ops_test_integration(provider: "aws")` passes, but `aws_cli_query` or `aws_sts_whoami` fails with `Error loading SSO Token`, missing SSO session, or similar.

**Cause**: The agent tried to use AWS SSO or passed a `profile` parameter. Plugin AWS integration uses **static IAM access keys** (Access Key ID + Secret Access Key), not SSO. SSO login tools are not available on the free plugin tier. Local `aws sso login` on your machine does not affect Opsphere — AWS CLI runs on the remote gateway.

**Fix**:

1. Confirm AWS is configured: say _"Configure my AWS"_ or run `/integration-status`.
2. Ask the agent to retry **without** `profile`, for example:
   - `aws_sts_whoami` (no parameters)
   - `aws_cli_query` with `command: "sts get-caller-identity"` (no `profile`)
3. For regional queries, specify region in the CLI command (e.g. `--region eu-west-1`) — default region is not stored during setup.

**Example prompt**: _"List my S3 buckets using my configured AWS keys — no SSO, no profile."_

---

## Agent says it can't find a tool

**Symptom**: You ask the agent to do something (e.g., "check Kubernetes pods") and it says it doesn't have that capability.

**Cause**: That tool may be part of the Premium tier.

**Fix**: Check [TOOLS.md](TOOLS.md) to see which tier includes that tool. Upgrade at **https://opsphere.io/pricing** if needed.

---

## Getting started after install

**Symptom**: You don't see a welcome banner when opening a workspace.

**Expected behavior**: Opsphere does **not** run shell scripts on workspace open (removed for security review). Instead:

1. Type **`/opsphere-welcome`** in chat for quick tips and example prompts.
2. **`/opsphere-setup`** for full OAuth + integration onboarding.
3. **`/opsphere-reconnect`** if the plugin is red or you see OAuth refresh errors.

See [INSTALL.md](INSTALL.md) step 1.

---

## Codex / ChatGPT CLI

### `codex mcp login` → "No authorization support detected"

**Cause**: OAuth discovery failed or the request was blocked before it reached Opsphere.

**Fix**:

1. Run `./scripts/codex-mcp-config.sh` so `~/.codex/config.toml` includes the Opsphere MCP block.
2. Confirm `https://mcp-cursor.opsphere.io/health` responds.
3. Retry `npx @openai/codex mcp login opsphere`.

### OAuth authorize or token → HTTP 403

**Cause**: Edge security rules may block Codex loopback callbacks during OAuth.

**Fix**: Contact **contact@opsphere.io** if login fails after step 1. Do not edit the authorize URL manually — the token step must use the same redirect the client registered.

### "Dynamic client registration not supported"

**Cause**: Codex CLI needs a preset `client_id` for this MCP server.

**Fix**: Add to `~/.codex/config.toml`:

```toml
[mcp_servers.opsphere.oauth]
client_id = "codex-mcp"
```

(`codex-mcp-config.sh` does this automatically.)

### `ops_my_usage` / tools return 403 on `initialize`

**Cause**: Missing `User-Agent` header or expired OAuth token.

**Fix**: Re-run `./scripts/codex-mcp-config.sh` and `npx @openai/codex mcp login opsphere`.

### CI Investigation blocked on Community plan

Same as Cursor: `@ci-investigation` calls `ops_my_usage` first — Team plan required for pipeline diagnose tools. Upgrade at **https://opsphere.io/pricing** or use read-only triage steps documented in the skill.

### ChatGPT desktop — no "Connect" on the plugin detail page

**Expected**: The store/detail view shows **Try now** / **Probar ahora**, not a standalone Connect button. OAuth runs **on install** (`authentication: ON_INSTALL` in the marketplace) or when the chat first needs MCP.

**Flow**:

1. Install Opsphere from the marketplace tab.
2. Complete the browser login if prompted during install.
3. Open a chat with Opsphere (Try now) or type `/mcp` in Codex mode to see server status.
4. If MCP is disconnected, use **Authenticate** in MCP settings or re-install after updating the plugin.

The bundled `.mcp.json` includes `oauth.client_id`, `http_headers.User-Agent`, and `oauth_resource` (same as `scripts/codex-mcp-config.sh`). Restart ChatGPT desktop after updating the plugin files.

### ChatGPT desktop — raw JSON instead of conversational reply

**Cause**: Prompt asked for "full JSON result", or the model echoed the MCP envelope instead of parsing `content[].text`.

**Fix**:

1. Use natural prompts: *"What is my Opsphere plan and usage?"* or `@plan-and-usage`.
2. Avoid: *"show me the full JSON result"* unless debugging.
3. New chat after updating the plugin — skill **`plan-and-usage`** instructs conversational formatting.

### ChatGPT desktop — stale OAuth metadata

**Cause**: Stale plugin cache, or an older `.mcp.json` without OAuth metadata.

**Fix**:

1. Update to the latest plugin commit (`.mcp.json` must include `codex-mcp` client id and `User-Agent`).
2. Quit and restart ChatGPT desktop.
3. Re-install the plugin or trigger OAuth from MCP settings.
4. Optional fallback: run `./scripts/codex-mcp-config.sh` once (shared `~/.codex/config.toml` with desktop).

---

## SonarQube — empty project search or missing last scan

**Symptom**: `sq_projects_search` returns no projects, or the agent cannot answer "last scan results" after finding a project.

**Checks**:

1. **Credential key** — must be `SONAR_HOST_URL` (not `SONAR_URL`). SonarCloud: `https://sonarcloud.io`.
2. **Organization** — `SONAR_ORGANIZATION` is optional if project keys use `org_project` format (`cepsadigital_my-repo`); the gateway infers org from the key or SonarCloud URL.
3. **Token scope** — user token needs **Browse** on target projects. Org-wide `/projects/search` requires org admin; pass the **full SonarCloud overview URL** to `sq_projects_search(q=...)` instead.
4. **Flow** — after resolving the project: call `sq_last_scan_summary(project=<key or URL>)` (one call). Use `sq_analyses_latest` only for raw analysis history.
5. **Reconnect** — run `configure-integration` → `ops_configure_integration(provider: "sonarqube", ...)` → `ops_test_integration`.

---

## GitHub — repo not found on github.com

**Symptom**: `ghe_repo_summary` or `ghe_actions_*` returns 404 for a public repo.

**Checks**:

1. For **github.com**, `GHE_BASE_URL` is optional (defaults to `https://api.github.com`).
2. Pass `repo` as **`owner/repo`** (e.g. `acme/storefront`), not just the repository name.
3. Token needs `repo` scope (classic) or repository access (fine-grained).

---

## Still stuck?

Contact us at **contact@opsphere.io** with:
- A description of what you're trying to do.
- The error message (exact text).
- Your Cursor version (`Help → About`).
