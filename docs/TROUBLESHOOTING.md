# Troubleshooting

## MCP server not connecting

**Symptom**: The Opsphere MCP server shows as "disconnected" in Cursor Settings → MCP, or tools don't appear in the agent.

**Checks**:
1. Verify your token is set in Cursor Settings → MCP → opsphere → token.
2. Test the gateway is reachable:
   ```bash
   curl https://mcp-cursor.opsphere.io/health
   ```
   Expected response: `{"status":"ok"}`
3. If unreachable, check your internet connection or try again in a few minutes.

---

## 401 Unauthorized

**Symptom**: Tools return a `401 Unauthorized` error or the agent says your session has expired.

**Cause**: Your access token has expired (tokens last 24 hours).

**Fix**: Run `/opsphere-setup` to log in again and get a fresh token. Set the new token in Cursor Settings → MCP.

---

## "opsphere-token" prompt appears every time

**Symptom**: Cursor asks for `opsphere-token` on every session.

**Fix**: This is expected if you haven't saved the token in Cursor's secret store. When prompted, paste your token and check "Remember this value" (if Cursor offers the option). Otherwise, save it in your shell environment and refer to it via a Cursor setting.

---

## TRIAL_EXPIRED error

**Symptom**: A tool call returns `TRIAL_EXPIRED`.

**Cause**: Your 30-day free trial has ended.

**Fix**: Upgrade at **https://opsphere.io/pricing** to continue using Opsphere.

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

## Welcome message doesn't appear on workspace open

**Symptom**: The welcome banner doesn't show when you open a workspace.

**Cause**: The `workspaceOpen` hook may not have run, or the hook isn't supported in your version of Cursor.

**Fix**: This is cosmetic — the plugin still works normally. You can manually run:
```bash
./scripts/check-auth.sh
```
Or just start using the agent directly.

---

## Still stuck?

Contact us at **hello@opsphere.io** with:
- A description of what you're trying to do.
- The error message (exact text).
- Your Cursor version (`Help → About`).
