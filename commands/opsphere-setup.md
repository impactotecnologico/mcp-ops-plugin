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

Authentication is handled automatically by the client — there is no need to paste a token.

**Cursor / Codex:** tell the user:

> "To connect Opsphere, open **Settings → Extensions** (or the Marketplace tab), find the **Opsphere** plugin, and click **Sign in** / **Connect**. A browser window opens for sign-up or log-in. Cursor stores the token automatically.
>
> **Note:** With the marketplace plugin, Opsphere often does **not** show as a separate server under **Settings → MCP** — use the plugin card for connection status (green = connected)."

**Claude Code:** tell the user:

> "Run **`/mcp`** to check the Opsphere connection. If it shows **Needs authentication**, select it to open a browser window for sign-up or log-in, or run **`claude mcp login opsphere`** from the shell. Claude Code stores the token automatically."

Wait for the user to confirm they have connected. Then call `ops_my_usage` again to verify.

If the user asks what to do in the browser:

- **New user**: switch to the **Sign up** tab, enter an email and password, click **Create account**.
- **Returning user**: stay on the **Log in** tab, enter credentials, click **Log in**.

> Access tokens last **24 hours**. The client should refresh them automatically via OAuth. If the plugin turns red or tools return 401, run **`/opsphere-reconnect`** (Cursor/Codex) or `claude mcp login opsphere` (Claude Code) — the gateway does not rotate refresh tokens (by design, to support the client's refresh behavior).

If OAuth keeps failing after reconnect, run the **`opsphere-reconnect`** command flow (Cursor/Codex) or re-run `claude mcp login opsphere` (Claude Code) instead of repeating setup from scratch.

---

## Step 3 — Share account status

Call `ops_my_usage` (and `ops_accounts_list` when available) and tell the user:

- **Opsphere connected**
- Plan (e.g. Community) and trial/daily usage
- **Personal Workspace: Active** (automatic after signup — no extra step)
- **Work context** separately (may be not configured — optional; does **not** mean Personal Workspace is down)
- Which integrations are configured (`ops_list_integrations`)
- On Community: additional external workspaces require upgrade — Personal Workspace is included

Example message:

> "You're connected on **Community**. Your **Personal Workspace** is Active — you can use Opsphere tools now.
>
> Work context is optional (not configured yet). Integrations: none yet — say 'Configure my Datadog' when you want.
>
> Network checks (DNS/HTTP/TLS) work immediately."

### Step 3.5 — Work context (optional personalization)

If `ops_my_usage` shows **Work context: not configured**, you may run the `set-work-context` skill.

1. Ask in natural language (never say "system_prompt_context"):

> "To help me assist you better, tell me what you usually work with: projects, providers like Datadog or Vercel, environments, naming conventions, teams you escalate to, etc. You can write freely."

2. Wait for the user's answer.
3. Call `ops_set_work_context` with their full text.
4. Confirm saved and offer integrations setup as the next step.

**Skip gracefully** if the user prefers later: "No problem — say 'update my work context' whenever you're ready."

Personal Workspace stays Active either way.

### Step 3.6 — Connection Hub / external workspaces

If `tools/list` includes `ops_accounts_list`:

1. Call `ops_accounts_list` / check `ops_my_usage` Connection Hub section.
2. Personal Workspace present → **success**. Do **not** offer `link-account` just because there are no external workspaces linked yet.
3. If the user **just accepted an organization invite**, the org workspace may already be linked (same email + Developer+ Hub) — confirm in the list before suggesting OAuth.
4. If the user asks to link another workspace on Community → upgrade CTA (Developer or higher). Do not start OAuth link.
5. Do **not** require `ops_context_open` or teach `context_id` for normal Community work.

---

## Step 4 — Configure the first integration (optional)

If the user wants to set up an integration, run the `configure-integration` skill for the chosen provider.

---

## Security notes

- Never ask the user for their password. Authentication happens in the browser via OAuth.
- The `ops_my_usage` tool returns plan and usage data — no credentials are ever returned.
- If the user asks about their token, explain that Cursor manages it automatically and they don't need to handle it manually.
- Never ask users to paste API keys into the work-context step — only into `ops_configure_integration` via the integration skill.
