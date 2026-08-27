---
name: link-account
description: Link or unlink an external workspace on Connection Hub. Community gets upgrade CTA — Personal Workspace is already included.
---

# Link Account (Connection Hub)

Guide linking/unlinking **external** workspaces. Follow skill **[`skills/link-account/SKILL.md`](../skills/link-account/SKILL.md)**.

## Steps

1. Call `ops_my_usage` + `ops_accounts_list`.
2. If the user **just accepted an org invitation** with the same email as their Hub (Developer+), the workspace may already be listed — confirm before starting OAuth.
3. If Personal Workspace is active and the plan does not allow additional links (Community) → upgrade CTA; stop.
3. Never treat Personal Workspace as something the user must link.
4. For allowed external links: `ops_account_link_start` → browser URL only → verify with `ops_accounts_list`.
5. Unlink **external** only — refuse Personal Workspace unlink (`PERSONAL_WORKSPACE_UNLINK_FORBIDDEN`).
6. Do not ask for OAuth codes/tokens in chat.

## If MCP is disconnected

Point to **`/opsphere-reconnect`** (Cursor/Codex) or `/mcp` + `claude mcp login opsphere` (Claude Code).

**Claude Code:** invoke this command as `/opsphere:link-account`.
