---
description: First-run setup — authenticate via OAuth and connect your first provider.
---

# Opsphere Setup

Guide the user through connecting Opsphere and configuring their first integration. Walk through each step conversationally.

## Step 1 — Check authentication status

Call `ops_my_usage` (no parameters). This determines the current state:

- **Success**: the user is already authenticated. Skip to Step 3.
- **Error or 401**: the user is not authenticated. Continue to Step 2.

## Step 2 — Connect the account (OAuth2)

Authentication is handled by GitHub Copilot CLI. Do not paste a token.

Tell the user:

> Open **`/mcp`** in Copilot CLI, select **opsphere**, and sign in. A browser window opens for sign-up or log-in. Copilot stores the token for this client only (`~/.copilot/mcp-oauth-config/`).
>
> Use the same email as your other Opsphere clients. Do not copy OAuth files from Cursor, Codex, Claude Code, Warp, OpenCode or Antigravity.

Wait for the user to confirm they have connected. Then call `ops_my_usage` again to verify.

If the user asks what to do in the browser:

- **New user**: switch to the **Sign up** tab, enter an email and password, click **Create account**.
- **Returning user**: stay on the **Log in** tab, enter credentials, click **Log in**.

If OAuth keeps failing, disconnect opsphere in `/mcp` then authenticate once more. If the error is `invalid_redirect_uri`, report the callback shape to support; do not change another client's OAuth client ID.

## Step 3 — Share account status

Call `ops_my_usage` (and `ops_accounts_list` when available) and tell the user:

- **Opsphere connected**
- Plan and trial/daily usage
- **Personal Workspace: Active** (automatic after signup — no extra step)
- **Work context** separately (may be not configured — optional)
- Which integrations are configured (`ops_list_integrations`)
- On Community: additional external workspaces require upgrade — Personal Workspace is included

### Step 3.5 — Work context (optional personalization)

If `ops_my_usage` shows **Work context: not configured**, you may run the `set-work-context` skill. Skip if the user prefers later.

### Step 3.6 — Connection Hub / external workspaces

If `tools/list` includes `ops_accounts_list`:

1. Call `ops_accounts_list` / check `ops_my_usage` Connection Hub section.
2. Personal Workspace present → **success**. Do **not** offer linking just because there are no external workspaces yet.
3. If the user asks to link another workspace on Community → upgrade CTA. Do not start OAuth link.
4. Do **not** require `ops_context_open` or teach `context_id` for normal Community work.

## Step 4 — Configure the first integration (optional)

If the user wants to set up an integration, run the `configure-integration` skill for the chosen provider.

## Security notes

- Never ask the user for their password. Authentication happens in the browser via OAuth.
- Never ask the user to paste access or refresh tokens.
- Never ask users to paste API keys into the work-context step — only into `ops_configure_integration` via the integration skill.
