# Troubleshooting

## MCP server not connecting

**Symptom**: The Opsphere MCP server shows as "disconnected" in Cursor Settings → MCP, or tools don't appear in the agent.

**Checks**:
1. Look for a **Connect** or **Sign in to opsphere** button in Cursor Settings → MCP. Click it to authenticate.
2. Test the gateway is reachable:
   ```bash
   curl https://mcp-cursor.opsphere.io/health
   ```
   Expected response: `{"status":"ok"}`
3. If unreachable, check your internet connection or try again in a few minutes.

---

## No "Connect" button visible

**Symptom**: Cursor doesn't show a Connect button after installing the plugin.

**Checks**:
1. Reload Cursor: **Command Palette → Developer: Reload Window**.
2. Go to **Cursor Settings → MCP** and confirm the `opsphere` server is listed.
3. If the server shows an error icon, click it to see the error detail.
4. Make sure you have Cursor version 0.50.0 or later.

---

## 401 Unauthorized

**Symptom**: Tools return a `401 Unauthorized` error or the agent says your session has expired.

**Cause**: Your access token has expired (tokens last 24 hours).

**Fix**: In Cursor Settings → MCP, click **Connect** (or **Sign in to opsphere**) to open a new browser sign-in window and get a fresh token. No need to copy or paste anything.

---

## TRIAL_EXPIRED error

**Symptom**: A tool call returns `TRIAL_EXPIRED`.

**Cause**: Your 30-day free trial has ended.

**Fix**: Upgrade at **https://opsphere.io/pricing** to continue using Opsphere. Re-authenticating will not fix this — it is a subscription state, not an auth issue.

---

## RATE_LIMIT_EXCEEDED error

**Symptom**: A tool call returns `RATE_LIMIT_EXCEEDED`.

**Cause**: You have reached your daily limit of 100 tool calls (free plan).

**Fix**:
- Wait until midnight UTC — the counter resets daily.
- Run `ops_my_usage` to see your current usage.
- Upgrade at **https://opsphere.io/pricing** for unlimited tool calls.

---

## "Missing credentials" for a tool

**Symptom**: A tool call fails with a "missing credentials" message for a specific provider (e.g., Datadog, Vercel).

**Cause**: The integration for that provider hasn't been configured yet.

**Fix**: Say _"Configure my [Provider]"_ in the chat. The agent will walk you through the setup using the `configure-integration` skill.

---

## Integration test fails after configuration

**Symptom**: You configured an integration, but `ops_test_integration` returns an error.

**Possible causes and fixes**:
- **Wrong API key format**: Re-check the key format in our [TOOLS.md](TOOLS.md) reference or the provider's documentation.
- **Insufficient permissions**: The API key may lack the required scopes. See the credentials table in the `configure-integration` skill.
- **Wrong domain or site**: For Jira, confirm the `JIRA_DOMAIN` format is `yourcompany.atlassian.net`. For Datadog, `DD_SITE` defaults to `datadoghq.com` — change if your org uses `datadoghq.eu` or another region.
- **Expired or revoked key**: Regenerate the key in the provider's console and run configure again.

---

## Agent says it can't find a tool

**Symptom**: You ask the agent to do something (e.g., "check Kubernetes pods") and it says it doesn't have that capability.

**Cause**: That tool may be part of the Premium tier.

**Fix**: Check [TOOLS.md](TOOLS.md) to see which tier includes that tool. Upgrade at **https://opsphere.io/pricing** if needed.

---

## Getting started after install

**Symptom**: You don't see a welcome banner when opening a workspace.

**Expected behavior**: Opsphere does **not** run shell scripts on workspace open (removed for security review). Instead:

1. Type **`/opsphere-welcome`** in chat for quick tips and example prompts.
2. Or **`/opsphere-setup`** for full OAuth + integration onboarding.

See [INSTALL.md](INSTALL.md) step 1.

## Still stuck?

Contact us at **contact@opsphere.io** with:
- A description of what you're trying to do.
- The error message (exact text).
- Your Cursor version (`Help → About`).
