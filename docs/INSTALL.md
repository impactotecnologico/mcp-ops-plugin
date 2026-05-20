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

## Step 2 — Connect your account

Once installed, Cursor will detect that Opsphere requires authentication and show a **Connect** button next to the MCP server in Settings → MCP.

1. Click **Connect** (or **Sign in to opsphere**).
2. A browser window opens with the Opsphere sign-in page.
3. **New user**: fill in your email and password in the **Sign up** tab and click **Create account**.
   **Returning user**: switch to the **Log in** tab, enter your credentials, and click **Log in**.
4. The browser window closes automatically. Cursor stores the token and connects.

> Authentication is handled entirely by Cursor — you never need to copy or paste a token.

---

## Step 3 — Verify the connection

Ask the agent:

> "Is example.com up?"

If the MCP connection is working, the agent will call `http_check` and return a result.
Network tools (`dns_lookup`, `http_check`, `cert_status`) work immediately — no integration setup needed.

---

## Step 4 — Configure your first integration

Say:

> "Configure my Datadog"

The agent will walk you through connecting your Datadog account step by step.
Repeat for any other provider you use (Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, AWS).

---

## Re-authentication

Tokens are valid for **24 hours**. When your session expires, Cursor will show the **Connect** button again — click it to open a new browser sign-in window. Your integrations and settings are preserved.

---

## Troubleshooting installation

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.
