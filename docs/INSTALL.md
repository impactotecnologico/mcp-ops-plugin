# Installation Guide

## Prerequisites

- [Cursor IDE](https://cursor.com) version 0.50.0 or later.
- An internet connection (the plugin communicates with the Opsphere gateway).

---

## Step 1 — Install the plugin

Install Opsphere from the Cursor Marketplace:

1. Open Cursor.
2. Go to **Settings → Extensions** (or the Marketplace tab).
3. Search for **Opsphere**.
4. Click **Install**.

---

## Step 2 — Sign up or log in

Once installed, open any workspace. The welcome message will appear in the terminal:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Opsphere — DevOps Intelligence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  First time? Ask the agent:
  → "Set up my Opsphere account"
```

In the Cursor chat, say:

> "Set up my Opsphere account"

The agent will run `/opsphere-setup` and guide you through creating an account or logging in.

---

## Step 3 — Set your token

After signup or login, the agent will give you an **access token**.

Set it in Cursor:

1. Go to **Settings → MCP**.
2. Find the **opsphere** server.
3. When prompted for `opsphere-token`, paste the token.

Alternatively, Cursor may prompt you automatically when the MCP connection first starts.

The token is valid for **24 hours**. Run `/opsphere-setup` again after expiry.

---

## Step 4 — Verify the connection

Ask the agent:

> "Is example.com up?"

If the MCP connection is working, the agent will call `http_check` and return a result.
Network tools (`dns_lookup`, `http_check`, `cert_status`) work immediately — no integration setup needed.

---

## Step 5 — Configure your first integration

Say:

> "Configure my Datadog"

The agent will walk you through connecting your Datadog account step by step.
Repeat for any other provider you use (Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, AWS).

---

## Manual token configuration (alternative)

If you prefer to set the token manually without the agent:

1. Find your token from a previous `/opsphere-setup` session, or log in again:

```bash
echo '{"email":"you@example.com","password":"yourpassword"}' | \
  curl -s -X POST https://mcp-gateway.opsphere.io/api/plugin/login \
  -H "Content-Type: application/json" --data-binary @-
```

2. Copy the `accessToken` from the response.
3. Set it in Cursor Settings → MCP → opsphere → token.

---

## Troubleshooting installation

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.
