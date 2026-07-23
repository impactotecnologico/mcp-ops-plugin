---
name: opsphere-setup
description: First-run setup — authenticate via OAuth and connect your first provider in under 2 minutes. Run after install; for a lighter start use /opsphere-welcome first.
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

> "To connect Opsphere, open **Settings → Extensions** (or the Marketplace tab), find the **Opsphere** plugin, and click **Sign in** / **Connect**. A browser window opens for sign-up or log-in. Cursor stores the token automatically.
>
> **Note:** With the marketplace plugin, Opsphere often does **not** show as a separate server under **Settings → MCP** — use the plugin card for connection status (green = connected)."

Wait for the user to confirm they have connected. Then call `ops_my_usage` again to verify.

If the user asks what to do in the browser:

- **New user**: switch to the **Sign up** tab, enter an email and password, click **Create account**.
- **Returning user**: stay on the **Log in** tab, enter credentials, click **Log in**.

> Access tokens last **24 hours**. Cursor should refresh them automatically via OAuth. If the plugin turns red or tools return 401, run **`/opsphere-reconnect`** — the gateway does not rotate refresh tokens (by design, to support Cursor's refresh behavior).

If OAuth keeps failing after reconnect, run the **`opsphere-reconnect`** command flow instead of repeating setup from scratch.

---

## Step 3 — Share account status

Call `ops_my_usage` and tell the user:

- Whether they are on a free trial (and days remaining) or a paid plan.
- Their daily tool call usage.
- Which integrations are currently configured (call `ops_list_integrations`).
- Whether **work context** is configured (see Step 3.5 if not).

Example message:

> "You're connected! Your 30-day free trial has X days remaining. You have access to tools for Datadog, Vercel, GitHub, Cloudflare, Jira, Sentry, Bitbucket, and AWS — plus DNS, HTTP, and TLS diagnostics that work immediately.
>
> Would you like to connect your first integration? Just say 'Configure my Datadog' or whichever provider you use."

---

## Step 3.5 — Work context (recommended after first connect)

If `ops_my_usage` shows **Work context: not configured yet**, run the `set-work-context` skill.

1. Ask in natural language (never say "system_prompt_context"):

> "To help me assist you better, tell me what you usually work with: projects, providers like Datadog or Vercel, environments, naming conventions, teams you escalate to, etc. You can write freely."

2. Wait for the user's answer.
3. Call `ops_set_work_context` with their full text.
4. Confirm saved and offer integrations setup as the next step.

**Skip gracefully** if the user prefers later: "No problem — say 'update my work context' whenever you're ready."

---

## Step 4 — Configure the first integration (optional)

If the user wants to set up an integration, run the `configure-integration` skill for the chosen provider.

---

## Security notes

- Never ask the user for their password. Authentication happens in the browser via OAuth.
- The `ops_my_usage` tool returns plan and usage data — no credentials are ever returned.
- If the user asks about their token, explain that Cursor manages it automatically and they don't need to handle it manually.
- Never ask users to paste API keys into the work-context step — only into `ops_configure_integration` via the integration skill.
