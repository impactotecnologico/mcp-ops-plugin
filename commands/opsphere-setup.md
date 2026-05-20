---
name: opsphere-setup
description: Guide the user to connect their Opsphere account and set up integrations
---

# Opsphere Setup

Guide the user through connecting Opsphere and configuring their first integration. Walk through each step conversationally.

---

## Step 1 — Check authentication status

Call `ops_my_usage` (no parameters). This determines the current state:

- **Success**: the user is already authenticated. Skip to Step 3.
- **Error or 401**: the user is not authenticated. Continue to Step 2.

---

## Step 2 — Connect the account (OAuth2)

Authentication is handled automatically by Cursor — there is no need to paste a token.

Tell the user:

> "To connect Opsphere, click the **Connect** button next to the Opsphere server in **Cursor Settings → MCP**. A browser window will open where you can sign up or log in. Once you complete the sign-in, Cursor will store the token automatically and reconnect here."

Wait for the user to confirm they have connected. Then call `ops_my_usage` again to verify.

If the user asks what to do in the browser:

- **New user**: switch to the **Sign up** tab, enter an email and password, click **Create account**.
- **Returning user**: stay on the **Log in** tab, enter credentials, click **Log in**.

> Tokens are valid for 24 hours. When one expires, Cursor will show the Connect button again — just click it.

---

## Step 3 — Share account status

Call `ops_my_usage` and tell the user:

- Whether they are on a free trial (and days remaining) or a paid plan.
- Their daily tool call usage.
- Which integrations are currently configured (call `ops_list_integrations`).

Example message:

> "You're connected! Your 30-day free trial has X days remaining. You have access to tools for Datadog, Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, and AWS — plus DNS, HTTP, and TLS diagnostics that work immediately.
>
> Would you like to connect your first integration? Just say 'Configure my Datadog' or whichever provider you use."

---

## Step 4 — Configure the first integration (optional)

If the user wants to set up an integration, run the `configure-integration` skill for the chosen provider.

---

## Security notes

- Never ask the user for their password. Authentication happens in the browser via OAuth.
- The `ops_my_usage` tool returns plan and usage data — no credentials are ever returned.
- If the user asks about their token, explain that Cursor manages it automatically and they don't need to handle it manually.
