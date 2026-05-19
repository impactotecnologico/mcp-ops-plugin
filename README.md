# Opsphere — DevOps Intelligence for Cursor

> Query logs, check deploys, diagnose incidents, and manage your infrastructure — without leaving your IDE.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Cursor](https://img.shields.io/badge/cursor-%3E%3D0.50.0-purple)

![Opsphere banner](assets/banners/banner1-dark.png)

---

## What is Opsphere?

Opsphere is a DevOps operational intelligence plugin for Cursor. It connects your monitoring, deployment, and issue tracking tools to the AI agent — so you can query Datadog logs, diagnose Kubernetes pods, check DNS health, or find Sentry errors just by asking in natural language.

Everything runs through a secure remote MCP server. No credentials are stored locally. No backend code is bundled in the plugin.

---

## Quick Start

1. **Install** Opsphere from the Cursor Marketplace.
2. **Create your account**: run `/opsphere-setup` — the agent walks you through signup in under 60 seconds.
3. **Connect your tools**: say _"Configure my Datadog"_ — the agent asks for your credentials and sets everything up.
4. **Start asking**: say _"Check DNS for mysite.com"_ or _"Show my Vercel deploys"_ — you're live.

Network tools (`dns_lookup`, `http_check`, `cert_status`) work immediately after login with no integration setup needed.

---

## Example Prompts

| What you say | What happens |
|---|---|
| "Configure my Datadog" | Walks you through connecting Datadog API keys step by step |
| "Check DNS for example.com" | Runs `dns_lookup` across multiple resolvers and flags discrepancies |
| "Is api.mycompany.com up?" | Runs `http_check` and reports status + response time |
| "Show my latest Vercel deploys" | Lists the last 3 deployments with status and timestamp |
| "Search Datadog logs for payment errors in the last hour" | Queries Datadog Logs v2 with your search |
| "What's failing in Sentry right now?" | Lists unresolved issues by severity |
| "Diagnose the failed Bitbucket pipeline" | Identifies the failed step and shows its log output |
| "Find Jira issues assigned to me" | Searches Jira with JQL and returns issue summaries |
| "What GitHub Actions ran on main today?" | Lists latest workflow runs with status |
| "Show my usage" | Displays plan, trial status, and daily tool calls via `ops_my_usage` |
| "Which integrations do I have configured?" | Runs `/integration-status` |

---

## Supported Integrations

| Provider | Tools included (free tier) | Credentials needed |
|---|---|---|
| **Datadog** | Log search · error counts by service | API Key + App Key |
| **Vercel** | Latest deploys · project status | API Token |
| **GitHub Enterprise** | Repo summary · latest Actions run | Personal Access Token |
| **Bitbucket** | Pipeline list · pipeline diagnosis | App Password |
| **Cloudflare** | Zone status · DNS records | API Token |
| **Jira** | Issue search · issue detail | API Token |
| **Sentry** | Issues list · issue search | Auth Token |
| **AWS** | Identity check · CLI queries | Access Key + Secret Key |
| **Network (built-in)** | DNS lookup · HTTP check · TLS cert | Nothing — works immediately |

> Full tool catalog unlocked on paid plans — including Kubernetes, ArgoCD, Azure Service Bus, Akamai, and more.

---

## Screenshots

![Welcome](assets/screenshots/welcome.png)
*Welcome message shown when opening a workspace with Opsphere installed.*

![Setup complete](assets/screenshots/setup-complete.png)
*Account creation and first login via the `/opsphere-setup` command.*

![Tool in action](assets/screenshots/tool-in-action.png)
*Live `dns_lookup` result showing resolver responses in the Cursor chat.*

---

## Free Plan

Opsphere includes a **30-day free trial** with no credit card required:

- **100 tool calls per day** (resets at midnight UTC)
- Access to **all 8 integrations** above (up to 2 tools per provider)
- **Network diagnostics** (`dns_lookup`, `http_check`, `cert_status`) — unlimited, no setup
- **`ops_my_usage`** — check your plan, trial status, and daily usage at any time

After your trial, upgrade at [https://opsphere.io/pricing](https://opsphere.io/pricing) to unlock the full tool catalog, unlimited daily calls, and premium providers.

---

## Security

- Credentials are **encrypted and stored per-tenant** in the Opsphere backend — no other user can access them.
- Each account gets a fully **isolated tenant** — no shared state.
- All communication is over **HTTPS**. No credentials are ever logged or returned to the plugin.
- Access tokens are valid for **24 hours**. Re-run `/opsphere-setup` after expiry.
- **No credentials are stored locally** in Cursor or on your machine.
- The plugin client is **open-source (MIT)**. The backend is proprietary SaaS.
- Tokens are hashed server-side and never stored in plaintext.

---

## Troubleshooting

<details>
<summary>MCP connection not starting or tools not visible</summary>

- Check that the `opsphere-token` is set: Cursor Settings → MCP → opsphere → input token.
- Verify your token is valid by running `/opsphere-setup` to log in again.
- Check gateway reachability: `curl https://mcp-gateway.opsphere.io/health`
- If the gateway is down, check [https://status.opsphere.io](https://status.opsphere.io).

</details>

<details>
<summary>401 Unauthorized</summary>

- Your access token may have expired (tokens last 24 hours).
- Run `/opsphere-setup` to log in and get a fresh token.
- Do not manually edit `mcp.json` — the plugin manages the connection automatically.

</details>

<details>
<summary>TRIAL_EXPIRED error</summary>

- Your 30-day free trial has ended.
- Upgrade at [https://opsphere.io/pricing](https://opsphere.io/pricing) to continue.
- Re-logging in will not fix this — it is a subscription state, not an auth issue.

</details>

<details>
<summary>RATE_LIMIT_EXCEEDED error</summary>

- You have reached your daily limit of 100 tool calls.
- The limit resets at midnight UTC.
- Say "Show my usage" to check remaining calls via `ops_my_usage`.
- Upgrade at [https://opsphere.io/pricing](https://opsphere.io/pricing) for unlimited calls.

</details>

<details>
<summary>"Missing credentials" error for a tool</summary>

- The integration for that provider is not yet configured.
- Say _"Configure my [Provider]"_ and the agent will walk you through it.
- Run `/integration-status` to see which providers are connected.

</details>

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for the full guide.

---

## Links

- **Website**: [https://opsphere.io](https://opsphere.io)
- **Pricing**: [https://opsphere.io/pricing](https://opsphere.io/pricing)
- **Docs**: [docs/](docs/)
- **Support**: [hello@opsphere.io](mailto:hello@opsphere.io)

---

## License

MIT — see [LICENSE](LICENSE).
