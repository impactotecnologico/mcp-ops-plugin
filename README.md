# Opsphere — DevOps Intelligence for Cursor

> Query logs, diagnose incidents, check deploys, and manage your infrastructure — without leaving the IDE.

[![Version](https://img.shields.io/badge/version-1.0.3-blue)](https://github.com/impactotecnologico/mcp-ops-plugin/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![CI](https://github.com/impactotecnologico/mcp-ops-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/impactotecnologico/mcp-ops-plugin/actions/workflows/ci.yml)
[![Cursor](https://img.shields.io/badge/cursor-%3E%3D0.50.0-purple)](https://cursor.com)

![Opsphere banner](assets/banners/banner1-dark.png)

---

## What is Opsphere?

Opsphere is a **thin client** DevOps plugin for Cursor: rules, skills, agents, and `mcp.json` only — **all MCP tools run on the remote Opsphere gateway** (`mcp-cursor.opsphere.io`). It connects your monitoring, deployment, and issue-tracking tools to the AI agent so you can ask in natural language:

- _"Search Datadog logs for payment errors in the last hour"_
- _"What's failing in Sentry right now?"_
- _"Check DNS for mysite.com across all resolvers"_
- _"Diagnose the failed Bitbucket pipeline"_

Everything runs through a **secure remote MCP server** — intentional by design. No tool logic in the plugin bundle. No credentials stored locally. OAuth2 + PKCE via Cursor Connect.

Architecture diagram and domain list: **[docs/REMOTE-MCP-ARCHITECTURE.md](docs/REMOTE-MCP-ARCHITECTURE.md)**.

---

## Quick Start

1. **Install** Opsphere from the Cursor Marketplace.
2. **Welcome**: type **`/opsphere-welcome`** in chat (or **`/opsphere-setup`** for full onboarding) — see example prompts and next steps.
3. **Connect**: click **Connect** next to Opsphere in **Cursor Settings → MCP**. A browser window opens — sign up (free, no card needed) or log in. Cursor stores the token automatically.
4. **Connect your tools**: say _"Configure my Datadog"_ — the agent walks you through setup and sends credentials **only** via `ops_configure_integration` on the gateway (never stored in this repo or in Cursor's plugin files).
5. **Start asking**: say _"Check DNS for mysite.com"_ or _"Show my Vercel deploys"_ — you're live.

> **Network tools** (`dns_lookup`, `http_check`, `cert_status`) work immediately after step 3 — no integration setup needed.

### Slash commands (type in chat)

| Command | When to use |
|---------|-------------|
| **`/opsphere-welcome`** | Just installed — quick tips and example prompts |
| **`/opsphere-setup`** | First-run OAuth + first integration (step by step) |
| **`/integration-status`** | See which providers are connected |

**Subagent:** for site-down or multi-step incident triage, ask _"use outage-triage"_ or type **`/outage-triage`** — read-only investigation with a structured verdict.

No shell scripts run automatically when you open a workspace — you invoke these commands yourself.

**Developers / reviewers:** to test from source before marketplace install, see [docs/INSTALL.md](docs/INSTALL.md#test-locally-before-marketplace-install) (`~/.cursor/plugins/local/opsphere`).

---

## How It Works

Remote MCP: Cursor calls **one endpoint** — `https://mcp-cursor.opsphere.io/mcp`. See [docs/REMOTE-MCP-ARCHITECTURE.md](docs/REMOTE-MCP-ARCHITECTURE.md) for the full flow and domain list.

```
You (Cursor chat)
      │
      ▼
Opsphere plugin (thin client)   ← rules, skills, commands — MIT, no tool code
      │   OAuth2 Bearer token (Cursor-managed)
      ▼
mcp-cursor.opsphere.io/mcp      ← ALL tool execution happens here
      │
      ├── Datadog / Vercel / GitHub / AWS / …  (server-side only)
      └── DNS / HTTP / TLS built-ins
```

---

## Supported Integrations

| Provider | What you can do | Credentials needed |
|---|---|---|
| **Datadog** | Search logs · count errors by service · check synthetics | API Key + App Key |
| **Vercel** | Latest deploys · project status · env vars | API Token |
| **GitHub** | Repo summary · Actions runs · PRs | Personal Access Token |
| **Bitbucket** | Pipeline list · pipeline diagnosis · PR search | App Password |
| **Cloudflare** | Zone status · DNS records · firewall events | API Token |
| **Jira** | Issue search · issue detail · comments | API Token |
| **Sentry** | Issues list · issue search · project stats | Auth Token |
| **AWS** | Identity check · read-only CLI queries | Access Key + Secret Key |
| **Network (built-in)** | DNS lookup · HTTP check · TLS cert · TCP | Nothing — always works |

### AWS with the plugin

Opsphere plugin AWS integration uses **IAM Access Key + Secret Access Key** — not AWS SSO. Say _"Configure my AWS"_ to store your keys on the gateway (encrypted). After setup, ask things like _"List my S3 buckets"_ or _"Who am I in AWS?"_ — the agent calls `aws_cli_query` / `aws_sts_whoami` **without** SSO or `profile`. Local `aws sso login` on your laptop does not apply; tools run on the remote gateway. Specify AWS region in your request when needed (default region is not stored during setup).

> Full tool catalog on paid plans — including Kubernetes, ArgoCD, Azure Service Bus, Akamai, Confluence, and more.

---

## Example Prompts

| You say | What happens |
|---|---|
| `"Configure my Datadog"` | Guided setup: asks for API Key + App Key, configures and tests in one flow |
| `"Check DNS for example.com"` | Runs `dns_lookup` across Google, Cloudflare, and system resolvers |
| `"Is api.mycompany.com up?"` | Runs `http_check` + `cert_status` and reports status + cert expiry |
| `"Show my latest Vercel deploys"` | Lists the last 3 deployments with status, branch, and timestamp |
| `"Search Datadog logs for payment errors in the last hour"` | Queries Datadog Logs v2 with your filter |
| `"What's failing in Sentry right now?"` | Lists unresolved issues by severity |
| `"Diagnose the failed Bitbucket pipeline"` | Identifies the failed step and shows its log output |
| `"Find Jira issues assigned to me"` | Searches Jira with JQL and returns summaries |
| `"What GitHub Actions ran on main today?"` | Lists latest workflow runs with status |
| `"Show my usage"` | Displays plan, trial status, and daily tool calls |
| `"Which integrations do I have set up?"` | Lists configured vs. pending providers |
| `"Configure my AWS"` | Guided IAM key setup (Access Key + Secret Key — not SSO) |
| `"List my S3 buckets"` | Read-only `aws_cli_query` using configured keys (no SSO step) |
| `"Do we have memory about this outage?"` | `memory_search` (when the memory module is enabled for your tenant) |
| `"Save this investigation for next time"` | `memory_store` — short distilled summary, not raw logs |

> **Operational memory:** recall and save session notes when your tenant has the `memory` module enabled. See [docs/TOOLS.md](docs/TOOLS.md#operational-memory).

---

## Screenshots

### Getting started

| | |
|---|---|
| ![Command menu](assets/screenshots/command-menu.png) | ![Opsphere setup](assets/screenshots/opsphere-setup.png) |
| *Type `/opsp` in the chat to access Opsphere commands.* | *`/opsphere-setup` guides you through authentication step by step.* |
| ![OAuth login](assets/screenshots/oauth-login.png) | ![OAuth signup](assets/screenshots/oauth-signup.png) |
| *Sign in with your existing account — browser-based OAuth2.* | *New user? Create a free account in seconds — no credit card required.* |
| ![OAuth redirect](assets/screenshots/oauth-redirect.png) | ![Connected](assets/screenshots/connected-success.png) |
| *Cursor captures the OAuth callback automatically.* | *Connected — trial active, 33 tools and 19 prompts enabled.* |

### Tools in action

| | |
|---|---|
| ![DNS diagnosis](assets/screenshots/dns-diagnosis.png) | ![Integration status](assets/screenshots/integration-status.png) |
| *`dns_lookup` resolves a domain across Google, Cloudflare, and system resolvers simultaneously.* | *`/integration-status` shows which providers are active and what tools they unlock.* |

---

## Community Plan (free trial)

Opsphere includes a **30-day Community trial** with no credit card required:

- **~30 MCP tools** (read-focused DevOps + memory + integration setup)
- **100 tool calls per day** (resets at midnight UTC)
- **8 core integrations** (Datadog, Vercel, GitHub, Bitbucket, Cloudflare, Sentry, Jira, AWS)
- **Network diagnostics** (`dns_lookup`, `http_check`, `cert_status`) — no setup required
- **`ops_my_usage`** — plan name, trial, daily/monthly usage, tool count, upgrade link

After your trial, upgrade at [opsphere.io/pricing](https://opsphere.io/pricing) for the **full catalog (~215 tools)**, unlimited daily calls, write access, and premium providers (Kubernetes, ArgoCD, Azure, Akamai, Pingdom, …).

Full comparison: **[docs/PLANS.md](docs/PLANS.md)**.

---

## Security & Trust

Opsphere is a **remote MCP SaaS**: this repo is the open-source Cursor client (MIT); tool execution and credential storage run on [mcp-cursor.opsphere.io](https://mcp-cursor.opsphere.io).

| Topic | Summary |
|-------|---------|
| **Authentication** | OAuth 2.0 + PKCE via Cursor Connect — no secrets in the plugin bundle |
| **Credentials** | Sent **only** via `ops_configure_integration`; encrypted at rest on gateway; **never** in plugin repo or Cursor plugin files |
| **Transport** | HTTPS only; credential values not logged; `ops_list_integrations` shows masked previews only |
| **Your code** | Not sent to Opsphere unless you paste it in chat |
| **Revocation** | Disconnect MCP, `ops_remove_integration`, or email [contact@opsphere.io](mailto:contact@opsphere.io) for account deletion |
| **Bundle hygiene** | Markdown + JSON only — **no secrets, no install hooks, no exfiltration code** in the plugin package |

**Automated verification (public repo):** every push/PR runs [`scripts/ci-validate.sh`](scripts/ci-validate.sh) (manifest + hygiene checks) and **Gitleaks** (full-history secret scan) via [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Run locally: `npm test`.

> Cursor security review: *"Security agent confirmed no secrets, no install hooks, no exfiltration in bundle."*

Full details: **[SECURITY.md](SECURITY.md)** (encryption, retention, isolation, vulnerability reporting). Marketplace copy-paste: **[docs/SECURITY-AND-TRUST.md](docs/SECURITY-AND-TRUST.md)**.

**Legal:** [Privacy Policy](https://opsphere.io/privacy) · [Terms of Service](https://opsphere.io/terms) · [docs/PRIVACY.md](docs/PRIVACY.md)

---

## Troubleshooting

<details>
<summary>No Connect button / tools not visible</summary>

- Open **Cursor Settings → MCP** and look for the Opsphere entry. If there is no Connect button, try reloading the window (`Cmd+Shift+P → Reload Window`).
- Check gateway reachability: `curl https://mcp-cursor.opsphere.io/health`
- If the gateway is down, check [status.opsphere.io](https://status.opsphere.io).

</details>

<details>
<summary>401 Unauthorized</summary>

- Your access token has expired (tokens last 24 hours).
- In **Cursor Settings → MCP**, click **Connect** to open a new browser sign-in window and renew automatically.

</details>

<details>
<summary>TRIAL_EXPIRED error</summary>

- Your 30-day free trial has ended.
- Upgrade at [opsphere.io/pricing](https://opsphere.io/pricing) to continue.
- Re-logging in will not fix this — it is a subscription state, not an auth issue.

</details>

<details>
<summary>RATE_LIMIT_EXCEEDED error</summary>

- You have reached your daily limit of 100 tool calls.
- The limit resets at midnight UTC.
- Say _"Show my usage"_ to check remaining calls via `ops_my_usage`.
- Upgrade at [opsphere.io/pricing](https://opsphere.io/pricing) for unlimited calls.

</details>

<details>
<summary>"Missing credentials" error for a tool</summary>

- The integration for that provider is not yet configured.
- Say _"Configure my [Provider]"_ and the agent will walk you through it.
- Run `/integration-status` to see which providers are connected.

</details>

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for the full guide.

---

## Data & privacy

| Topic | Detail |
|-------|--------|
| **Sent to Opsphere** | OAuth tokens (via Cursor), tool parameters, integration credentials **only via `ops_configure_integration`**, usage metadata |
| **Not stored locally** | Integration secrets never persist in this repo, the plugin bundle, or workspace plugin files |
| **Not sent** | Your workspace source code (unless you paste it in chat) |
| **Stored server-side** | Integration credentials encrypted per tenant on Opsphere; audit events for configure/remove (no secret values in logs) |
| **Full policy** | [docs/PRIVACY.md](docs/PRIVACY.md) · [opsphere.io/privacy](https://opsphere.io/privacy) |

---

## Uninstall & revoke access

1. **Remove plugin**: Cursor Marketplace → uninstall, or remove the plugin from your team marketplace.
2. **Disconnect MCP**: Cursor Settings → MCP → disable/remove **Opsphere**.
3. **Revoke integrations**: say _"Remove my Datadog integration"_ or use `ops_remove_integration`.
4. **Account deletion**: email [contact@opsphere.io](mailto:contact@opsphere.io).

Removing the plugin does not automatically delete your Opsphere account or server-side credentials.

---

## Links

- **Website**: [opsphere.io](https://opsphere.io)
- **Pricing**: [opsphere.io/pricing](https://opsphere.io/pricing)
- **Status**: [status.opsphere.io](https://status.opsphere.io)
- **Support**: [contact@opsphere.io](mailto:contact@opsphere.io)
- **Architecture (remote MCP)**: [docs/REMOTE-MCP-ARCHITECTURE.md](docs/REMOTE-MCP-ARCHITECTURE.md)
- **Security & Trust**: [SECURITY.md](SECURITY.md) · [docs/SECURITY-AND-TRUST.md](docs/SECURITY-AND-TRUST.md)
- **Privacy**: [docs/PRIVACY.md](docs/PRIVACY.md) · [opsphere.io/privacy](https://opsphere.io/privacy)
- **Security policy (vulnerabilities)**: [SECURITY.md](SECURITY.md)
- **Terms**: [opsphere.io/terms](https://opsphere.io/terms)

---

## License

MIT — see [LICENSE](LICENSE).

---

Opsphere is an independent product; not affiliated with or endorsed by Cursor/Anysphere.
