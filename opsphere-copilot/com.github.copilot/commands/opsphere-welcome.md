---
description: Quick start — what Opsphere can do, example prompts, and next setup steps.
---

# Opsphere Welcome

Show the user this welcome guide. Do **not** run any shell commands.

## Present to the user

Copy or paraphrase the following:

> **Opsphere — DevOps Intelligence**
>
> You're connected to a remote MCP gateway. All tools run on `mcp-cursor.opsphere.io` — nothing executes from hidden scripts in this package.
>
> **First time here?**
> - Run **`/opsphere-setup`** — connect your account (OAuth) and configure your first integration.
> - Or say: _"Set up my Opsphere account"_
>
> **Needs authentication or OAuth error?** Open **`/mcp`** in Copilot CLI, select **opsphere**, and sign in. Do not copy token files from another app.
>
> **Already connected? Try:**
> - _"Is example.com up?"_ or use the **endpoint-health** skill — DNS + HTTP + TLS for one host (all plans)
> - _"What was the last deployment?"_ — **`deployment_status`** (multi-platform)
> - _"Search Datadog logs for errors in the last hour"_
> - _"Configure my Datadog"_
> - _"Is the site down?"_ — incident-investigation / outage-triage
> - _"Why did CI fail on main?"_ — ci-investigation (Professional+; Community: upgrade info)
> - _"Write a post-mortem"_ — postmortem-writer
> - _"Help me test this flow and decide whether this is a bug"_ — qa-test-investigation
> - _"Is this release ready to promote?"_ — qa-release-readiness
> - **`/integration-status`** — see which providers are connected
>
> Network checks (DNS/HTTP/TLS) work immediately after login.

## Agent follow-up

1. If MCP is not authenticated, tell the user to open `/mcp` and authenticate **opsphere**.
2. If they want full onboarding, offer `/opsphere-setup`.
3. Do not execute installer scripts or any bash from this command.
