---
name: opsphere-reconnect
description: Recover OAuth when Opsphere disconnects, tools fail with 401, or Cursor/Codex reports invalid_grant or an OAuth refresh error.
---

# Opsphere Reconnect

Guide the user through recovering MCP OAuth when the plugin shows disconnected, tools return 401, or Cursor/Codex reports **OAuth refresh error** or **`invalid_grant`**. This command is local plugin content, so the instructions must remain useful even when the MCP server and its tools are unavailable. Do **not** run shell commands on the user's machine.

## First decision — terminal grant or transient failure

- **`invalid_grant`**, unknown/revoked/expired refresh token: terminal for that saved credential. Repeating tool calls or waiting will not repair it; require a new browser login.
- **429 / `too_many_requests`**: stop retries for at least the advertised `Retry-After`, then reconnect once. Do not create a retry loop.
- **5xx / network error**: check gateway reachability and retry once before replacing credentials.

Never imply that `invalid_grant` means the Opsphere account, integrations, or work context were deleted. Only the local MCP authorization must be renewed.

---

## Step 1 — Confirm gateway reachability (optional)

If the user already ran `curl https://mcp-cursor.opsphere.io/health` and got `{"status":"ok"}`, skip this step.

Otherwise suggest they run it once in a terminal. **Health OK only means the gateway is up** — OAuth can still be broken on the Cursor side.

---

## Step 2 — Identify the client

Ask or infer whether the user is in **Cursor**, the **Codex desktop plugin**, or **Codex CLI**, then follow only the matching path.

### Cursor Marketplace

Tell the user:

> With the **Cursor Marketplace plugin**, Opsphere usually does **not** appear as a separate row under **Settings → MCP**. Check the **Opsphere plugin card** in **Settings → Extensions** (or the Marketplace tab):
>
> - **Green** = MCP connected (client may show a tool count; trust gateway/catalog over any single UI number).
> - **Red** or missing tools = OAuth needs recovery (this command).

---

## Step 3 — Re-authenticate

### Cursor

In order, until green:

1. On the **Opsphere plugin** card, click **Sign in**, **Connect**, or **Reconnect** (label varies by Cursor version).
2. Complete the browser login (Sign up / Log in on the Opsphere page).
3. **Command Palette → Developer: Reload Window** (`Cmd+Shift+P` on macOS).
4. Ask in chat: _"What is my Opsphere plan?"_ — you will call `ops_my_usage` to verify.

If still red after step 3:

5. **Extensions → Opsphere → Uninstall** (or disable), Reload Window, reinstall from Marketplace, OAuth again.

If the user migrated from a **manual MCP entry** (API key in `~/.cursor/mcp.json`), tell them to remove any leftover `opsphere` server there so only the plugin registers the gateway.

### Codex desktop / ChatGPT

1. Open **Plugins**, select **Opsphere**, and click **Connect** or **Reconnect**.
2. Complete the browser login.
3. Start a **new task** after reconnecting so the MCP tools are loaded with the new authorization.
4. In the new task ask: _"What is my Opsphere plan and usage?"_

If the plugin UI still shows disconnected, disable/re-enable or reinstall the Opsphere plugin, reconnect, and open another new task. Do not ask the user to paste tokens or edit the plugin manifest.

### Codex CLI

Guide the user to run these commands in their own terminal, outside the active Codex session:

```bash
npx @openai/codex mcp logout opsphere
npx @openai/codex mcp login opsphere
```

Then start a new Codex session. An already-running session does not reload MCP authorization. If `logout` reports no stored login, continue with `login`.

---

## Step 4 — Verify with a tool call

Only after reconnection and, for Codex, in a new task/session, call `ops_my_usage` (no parameters). If the MCP is still disconnected, do not keep attempting the tool; return to the matching client path in Step 3.

- **Success**: tell the user they are reconnected; mention access tokens last **24 hours** and Cursor should refresh automatically — if refresh fails again, run **`/opsphere-reconnect`**.
- **401 / `invalid_grant`**: the client is still using the old credential; disconnect/logout fully, reconnect, and restart the client session once.
- **Other error**: repeat the relevant Step 3 once or suggest contacting **contact@opsphere.io** with the client name/version, approximate UTC time, and the error class only. Never include tokens.

---

## Cursor log hints (for support)

If the user pastes logs like:

```text
MCP OAuth refresh lock acquired
MCP OAuth SDK refresh catch branch
MCP OAuth refresh error
```

Explain: Cursor tried to renew the access token and the gateway returned an error. `invalid_grant` requires a new browser login; 429 requires stopping retries before reconnecting. After a **Cursor crash**, OAuth state may be inconsistent — Reload Window + reconnect is normal.

---

## Security notes

- Never ask for passwords in chat — login happens in the browser only.
- Never ask the user to paste access or refresh tokens.
- Integrations and work context in Opsphere are preserved across re-auth.
