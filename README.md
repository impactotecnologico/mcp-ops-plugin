# Opsphere — DevOps Intelligence for Cursor

> Query logs, check deploys, search issues, and diagnose incidents — without leaving your IDE.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Cursor](https://img.shields.io/badge/cursor-%3E%3D0.50.0-purple)

Opsphere connects Datadog, Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, and AWS to your AI coding assistant. Ask questions in natural language, get real answers from your actual infrastructure.

---

## Quick Start

1. **Install** the Opsphere plugin from the Cursor Marketplace.
2. **Sign up**: ask the agent _"Set up my Opsphere account"_ or run `/opsphere-setup`.
3. **Connect**: say _"Configure my Datadog"_ (or Vercel, GitHub, etc.) — the agent walks you through it.
4. **Use**: ask _"Show me Datadog errors from the last hour"_ and watch it work.

Total time from install to first result: **under 60 seconds**.

---

## Example Prompts

| Ask this… | Opsphere will… |
|-----------|----------------|
| "Configure my Datadog" | Walk you through connecting your API keys step by step |
| "Check DNS for example.com" | Run `dns_lookup` across multiple resolvers |
| "Is api.mycompany.com up?" | Run `http_check` and report status + latency |
| "Check the SSL cert for mysite.com" | Verify TLS expiry and validity with `cert_status` |
| "Show my latest Vercel deploys" | Query the Vercel API for recent deployments |
| "Search Datadog logs for payment errors in the last hour" | Search Datadog Logs v2 with your query |
| "What's failing in Sentry right now?" | List unresolved issues by severity |
| "Diagnose the failed Bitbucket pipeline" | Identify the failed step and show its log |
| "Find Jira issues assigned to me" | Search Jira with JQL |
| "What GitHub Actions ran on main today?" | List latest workflow runs |
| "Which integrations do I have configured?" | Run `/integration-status` |
| "Show my plan and usage" | Display trial status, daily calls used, and upgrade link |

---

## Screenshots

_Screenshots will be added once the plugin is published. See [docs/INSTALL.md](docs/INSTALL.md) for setup walkthrough._

## Branding

| Asset | File |
|-------|------|
| Logo (SVG, variant 1) | [assets/logo-1.svg](assets/logo-1.svg) |
| Logo (SVG, variant 2) | [assets/logo.svg](assets/logo.svg) |
| Logo (PNG, variant 1) | [assets/logo-1.png](assets/logo-1.png) |
| Logo (PNG, variant 2) | [assets/logo-2.png](assets/logo-2.png) |
| Logo (full, dark mode) | [assets/logo-full-dark.png](assets/logo-full-dark.png) |
| Banner (dark) | [assets/banners/banner1-dark.png](assets/banners/banner1-dark.png) |

---

## Supported Integrations

| Provider | What you can do | Credentials needed |
|----------|-----------------|--------------------|
| **Datadog** | Log search, error tracking, synthetics | API Key + App Key |
| **Vercel** | Deploy status, project overview | API Token |
| **GitHub Enterprise** | Actions, repo summary, PR status | Personal Access Token |
| **Bitbucket** | PR search, pipeline diagnosis | App Password |
| **Cloudflare** | DNS records, zone health, SSL | API Token |
| **Jira** | Issue search, full details | API Token |
| **Sentry** | Error list, issue search | Auth Token |
| **AWS** | Identity check, CLI queries | Access Key + Secret |
| **Network (built-in)** | DNS lookup, HTTP check, TLS cert | Nothing — works immediately |

---

## Free Plan

Opsphere includes a **30-day free trial** with:

- Access to all 8 integrations above
- Up to 2 tools per provider (the most useful diagnostic and query tools)
- Network diagnostics (`dns_lookup`, `http_check`, `cert_status`) with no setup
- 100 tool calls per day

After the trial, upgrade at **https://opsphere.io/pricing** to unlock the full catalog, unlimited calls, and premium providers (Kubernetes, ArgoCD, Azure, Akamai, and more).

---

## Security

- Your credentials are **encrypted and stored per-tenant** in our backend — no other user can access them.
- Each account gets an **isolated tenant** — no shared state between users.
- All communication is over **HTTPS**.
- Access tokens are valid for **24 hours**. Re-run `/opsphere-setup` after expiry.
- No credentials are ever logged or returned to the plugin.
- The plugin client is open-source (MIT). The backend is proprietary SaaS.

---

## Troubleshooting

<details>
<summary>MCP connection not starting</summary>

- Check that the `opsphere-token` is set in Cursor Settings → MCP → opsphere.
- Verify your token is valid by running `/opsphere-setup` again.
- Check gateway status: `curl https://mcp-gateway.opsphere.io/health`

</details>

<details>
<summary>401 Unauthorized / tools not appearing</summary>

- Your access token may have expired (tokens last 24 hours).
- Run `/opsphere-setup` to log in again and get a fresh token.

</details>

<details>
<summary>TRIAL_EXPIRED error</summary>

- Your 30-day free trial has ended.
- Upgrade at **https://opsphere.io/pricing** to continue.

</details>

<details>
<summary>RATE_LIMIT_EXCEEDED error</summary>

- You have reached your daily limit of 100 tool calls.
- The limit resets at midnight UTC.
- Use `ops_my_usage` to check your current usage.
- Upgrade for unlimited calls.

</details>

<details>
<summary>"Missing credentials" error for a tool</summary>

- The integration for that provider is not yet configured.
- Say "Configure my [Provider]" and the agent will walk you through it.

</details>

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more.

---

## Links

- Website: [https://opsphere.io](https://opsphere.io)
- Pricing: [https://opsphere.io/pricing](https://opsphere.io/pricing)
- Support: [hello@opsphere.io](mailto:hello@opsphere.io)
- Docs: [docs/](docs/)

---

## License

MIT — see [LICENSE](LICENSE).
