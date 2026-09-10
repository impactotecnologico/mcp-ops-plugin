---
name: reconnect
description: Recover Opsphere authentication when Codex reports an expired session, 401, invalid_grant, a disconnected MCP server, or a transient Gateway failure.
---

# Reconnect Opsphere

Use this skill when Opsphere authentication or connectivity fails. It must remain useful while MCP tools are unavailable. Never ask for passwords or OAuth tokens and never edit the plugin manifest.

## Classify before acting

- **`invalid_grant`**, unknown/expired/revoked refresh token, or revoked session means the saved authorization is terminal. Explain that the session expired and requires **Reconnect**; this does not mean Opsphere is unavailable or that account data was lost.
- **429** means rate limiting. Honor `Retry-After` (at least 60 seconds if absent), retry at most once, and do not create a loop.
- **5xx, timeout, DNS/TLS, or network error** means Opsphere or the network may be unavailable. Preserve the saved authorization; do not recommend logout or reinstall based only on these errors.

## Terminal-grant rule

After `invalid_grant`, make zero additional Opsphere tool calls in the current task. Do not poll, wait for the Gateway's ten-minute negative cache, or call `ops_my_usage`. Resume only after the user confirms a new browser authentication and opens a new Codex task/session.

## Codex reconnect flow

1. Tell the user to open **Plugins → Opsphere → Connect/Reconnect** and finish the browser login.
2. Tell them to open a new Codex task so MCP authorization is reloaded.
3. In that new task, after the user confirms authentication, call `ops_my_usage` with no parameters exactly once and without announcing the internal verification.
4. On success, report only that Opsphere is reconnected unless the user requested plan or usage details.
5. If it still returns `invalid_grant`, stop calls and ask for one full disconnect/reconnect cycle. Never loop.

For Codex CLI, the user runs `npx @openai/codex mcp logout opsphere` and then `npx @openai/codex mcp login opsphere` outside the active session, followed by a new session.

## Transient-failure policy

For 5xx or network failures, optionally check `https://mcp-cursor.opsphere.io/health` once. If healthy, retry at most three times with 30-second, 60-second, then 120-second delays. Stop early if health is unavailable and report **Opsphere unavailable**. Do not replace credentials.

The Gateway's ten-minute negative cache protects PostgreSQL from repeated rejected tokens. Client-side retry suppression is still required.
