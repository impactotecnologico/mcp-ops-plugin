---
name: opsphere-welcome
description: Quick start — what Opsphere can do, example prompts, and links to setup. Run after installing the plugin (type /opsphere-welcome in chat).
---

# Opsphere Welcome

Show the user this welcome guide. Do **not** run any shell commands — this replaces the old workspace-open hook.

---

## Present to the user

Copy or paraphrase the following:

> **Opsphere — DevOps Intelligence**
>
> You're connected to a remote MCP gateway. All tools run on `mcp-cursor.opsphere.io` — nothing executes from hidden scripts in this plugin.
>
> **First time here?**
> - Run **`/opsphere-setup`** — connect your account (OAuth) and configure your first integration.
> - Or say: _"Set up my Opsphere account"_
>
> **Already connected? Try:**
> - _"Is example.com up?"_ or **`/endpoint-health`** — DNS + HTTP + TLS for one host (all plans)
> - _"¿Cuál fue el último despliegue?"_ / _"What was the last deployment?"_ — **`deployment_status`** (multi-platform: Vercel, CI, S3, ECS…)
> - _"Check my latest Vercel deploys"_ — Vercel-only detail (or use deployment_status first)
> - _"Search Datadog logs for errors in the last hour"_
> - _"Configure my Datadog"_
> - _"Configure my AWS"_ — IAM Access Key + Secret Key (not SSO)
> - _"Is the site down?"_ or **`/outage-triage`** — multi-step incident triage (all plans)
> - _"Why did CI fail on main?"_ or **`/ci-investigator`** — pipeline diagnosis (Professional+; Community: upgrade info)
> - _"Write a post-mortem"_ or **`/postmortem-writer`** — RCA + optional incident memory (all plans)
> - **`/integration-status`** — see which providers are connected
>
> **MCP resources** (gateway): `opsphere://playbooks/index` lists guided prompts; `opsphere://tenant/account-context` has full cloud-catalog context per account. See [TOOLS.md#mcp-resources](../docs/TOOLS.md#mcp-resources).
>
> **Docs:** [INSTALL.md](../docs/INSTALL.md) · [TOOLS.md](../docs/TOOLS.md) · [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

---

## Agent follow-up

1. If the user has not connected MCP yet, point them to **Cursor Settings → MCP → Connect** next to Opsphere.
2. If they want full onboarding, offer to run the **`opsphere-setup`** command flow.
3. Do not execute `scripts/check-auth.sh` or any bash script — it has been removed from the plugin.
