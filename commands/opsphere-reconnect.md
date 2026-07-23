---
name: opsphere-reconnect
description: Recover OAuth when the Opsphere plugin shows red, tools fail with 401, or Cursor logs "MCP OAuth refresh error". Run after a crash or ~24h since last sign-in.
---

# Opsphere Reconnect

Guide the user through recovering MCP OAuth when the **marketplace plugin** shows disconnected (red), tools return 401, or Cursor logs mention **OAuth refresh error**. Do **not** run shell commands on the user's machine.

---

## Step 1 — Confirm gateway reachability (optional)

If the user already ran `curl https://mcp-cursor.opsphere.io/health` and got `{"status":"ok"}`, skip this step.

Otherwise suggest they run it once in a terminal. **Health OK only means the gateway is up** — OAuth can still be broken on the Cursor side.

---

## Step 2 — Check plugin status (not Settings → MCP)

Tell the user:

> With the **Cursor Marketplace plugin**, Opsphere usually does **not** appear as a separate row under **Settings → MCP**. Check the **Opsphere plugin card** in **Settings → Extensions** (or the Marketplace tab):
>
> - **Green** with a tool count (e.g. 216 tools) = MCP connected.
> - **Red** or missing tools = OAuth needs recovery (this command).

---

## Step 3 — Re-authenticate

In order, until green:

1. On the **Opsphere plugin** card, click **Sign in**, **Connect**, or **Reconnect** (label varies by Cursor version).
2. Complete the browser login (Sign up / Log in on the Opsphere page).
3. **Command Palette → Developer: Reload Window** (`Cmd+Shift+P` on macOS).
4. Ask in chat: _"What is my Opsphere plan?"_ — you will call `ops_my_usage` to verify.

If still red after step 3:

5. **Extensions → Opsphere → Uninstall** (or disable), Reload Window, reinstall from Marketplace, OAuth again.

If the user migrated from a **manual MCP entry** (API key in `~/.cursor/mcp.json`), tell them to remove any leftover `opsphere` server there so only the plugin registers the gateway.

---

## Step 4 — Verify with a tool call

Call `ops_my_usage` (no parameters).

- **Success**: tell the user they are reconnected; mention access tokens last **24 hours** and Cursor should refresh automatically — if refresh fails again, run **`/opsphere-reconnect`**.
- **401 / error**: repeat Step 3 or suggest contacting **contact@opsphere.io** with Cursor version and whether they see `MCP OAuth refresh error` in **Help → Toggle Developer Tools → Console**.

---

## Cursor log hints (for support)

If the user pastes logs like:

```text
MCP OAuth refresh lock acquired
MCP OAuth SDK refresh catch branch
MCP OAuth refresh error
```

Explain: Cursor tried to renew the access token and the gateway returned an error or rate limit (429). Re-auth from the **plugin card** (Step 3) fixes stale tokens. After a **Cursor crash**, OAuth state may be inconsistent — Reload Window + reconnect is normal.

---

## Security notes

- Never ask for passwords in chat — login happens in the browser only.
- Never ask the user to paste access or refresh tokens.
- Integrations and work context in Opsphere are preserved across re-auth.
