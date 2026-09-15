---
description: Recover OAuth when Opsphere disconnects, tools fail with 401, or Copilot reports invalid_grant.
---

# Opsphere Reconnect

Guide the user through recovering MCP OAuth when tools return 401 or Copilot CLI reports **`invalid_grant`**. These instructions must remain useful even when MCP tools are unavailable. Do **not** run shell commands on the user's machine.

## First decision

- **`invalid_grant`**, unknown/revoked/expired refresh token: require a new browser login. Repeating tool calls will not repair it.
- **429 / `too_many_requests`**: stop retries for at least the advertised `Retry-After`, then reconnect once.
- **5xx / network error**: keep the saved credential, check gateway reachability, and use bounded backoff.

Never imply that `invalid_grant` deleted the Opsphere account, integrations, or work context.

After **`invalid_grant`**, make **zero additional Opsphere tool calls** in the current task. Resume only after the user confirms a new browser authentication.

## Re-authenticate in GitHub Copilot CLI

Tell the user:

> 1. Open **`/mcp`**, select **opsphere**, disconnect if needed, and sign in again.
> 2. Complete the browser login with the same account.
> 3. Share only the redacted error class if diagnosis is needed.
> 4. Do not copy token files from another client. Copilot stores credentials for this app only.

If the error is `invalid_redirect_uri`, report the callback shape to **contact@opsphere.io**. Do not rewrite callback URLs or change Cursor, Codex or Claude Code client IDs.

## Verify

Only after reconnection, call `ops_my_usage` (no parameters) **exactly once**. Report only the resulting connection status.

## Security notes

- Never ask for passwords in chat — login happens in the browser only.
- Never ask the user to paste access or refresh tokens.
- Integrations and work context in Opsphere are preserved across re-auth.
