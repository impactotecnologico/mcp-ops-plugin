---
name: link-account
description: Link a client workspace to your Connection Hub via OAuth (multi-account Cursor/Codex). Use when ops_accounts_list is available, the user wants to add or remove a linked tenant, or after Hub signup with zero connections.
---

# Link Account (Connection Hub)

Guide a **Connection Hub** owner through linking or unlinking **client workspaces** (independent OAuth identities). One Opsphere install can operate many linked tenants without logging out.

> **Not a Connection Hub?** If `tools/list` does **not** include `ops_accounts_list`, you are on a **legacy single-tenant** account — use normal OAuth login only; this skill does not apply.

## Tools

| Tool | Purpose |
|------|---------|
| `ops_accounts_list` | List active linked connections (`id`, `label`, tenant `slug`, `status`) |
| `ops_account_link_start` | Returns `authorization_url` — user completes OAuth in the browser |
| `ops_account_unlink` | Revoke a link (`linked_connection_id` UUID) |

There is **no** `ops_account_link_complete` tool — grants are stored only on the **HTTP OAuth callback** after the user finishes in the browser.

## Security (mandatory)

1. **Never** ask the user to paste OAuth codes, refresh tokens, or passwords into chat.
2. **Never** store link credentials in `memory_store`, `ops_set_work_context`, or local files.
3. Show only the **authorization URL** from `ops_account_link_start` and instruct the user to open it in a browser.
4. Confirm success with connection **label / slug** — do not echo tokens.

## Hub vs linked workspace

| On Connection Hub (no active `context_id`) | On linked workspace (after `ops_context_open`) |
|--------------------------------------------|------------------------------------------------|
| `ops_accounts_list`, link/unlink, `ops_my_usage`, network tools | Datadog, K8s, Vercel, `deployment_status`, integrations, memory, macros |
| **Denied:** `ops_configure_integration`, `ops_remove_integration`, `ops_set_work_context` | Use `configure-integration` and `set-work-context` on the **linked** tenant |

After linking, run skill **`open-work-context`** before operational work.

## When to run

1. User says _"link a client"_, _"add another account"_, _"connect my customer's Opsphere"_.
2. After Hub signup when `ops_accounts_list` returns `accounts: []`.
3. User wants to **remove** a linked workspace → `ops_account_unlink`.

## Link flow

1. Call `ops_accounts_list` — show existing connections (if any).
2. Explain briefly: each link is a separate OAuth login to that client's Opsphere workspace; credentials stay on the gateway encrypted.
3. Call `ops_account_link_start` (no parameters).
4. Parse `authorization_url` from the tool result and tell the user:

> "Open this link in your browser, sign in to the **client workspace** you want to link, and approve access. When the page confirms success, come back here."

5. Wait for user confirmation, then call `ops_accounts_list` again to verify the new connection.
6. Offer **`open-work-context`** to start working on the new link.

### If link fails

| Symptom | Action |
|---------|--------|
| `BROKER_DISABLED` | Connection Broker not enabled on gateway yet — contact Opsphere support. |
| `MCP_SESSION_REQUIRED` | User must reconnect MCP (`/opsphere-reconnect` or Codex `mcp login opsphere`). |
| Browser shows error | Retry `ops_account_link_start`; do not collect secrets in chat. |
| Connection missing after OAuth | Wait a few seconds; call `ops_accounts_list` again. |

## Unlink flow

1. Call `ops_accounts_list` — user picks which connection to remove.
2. Confirm: _"This revokes Opsphere's access to that workspace from your Hub. Continue?"_
3. Call `ops_account_unlink(linked_connection_id: "<uuid>")`.
4. Confirm by label/slug only.

## Avoid

- Inventing tenant names or connection IDs — always from `ops_accounts_list`.
- Calling `ops_configure_integration` on the Hub anchor tenant.
- Hardcoding any tenant slug or customer name in instructions — use live tool output only.
