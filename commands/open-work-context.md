---
name: open-work-context
description: Open a work context on a linked client workspace (context_id for tenant-scoped tools). Connection Hub only.
---

# Open Work Context (Connection Hub)

Help the user pick a linked client workspace and obtain a **`context_id`** for tenant-scoped MCP tools. Parity with Codex `@open-work-context`.

## Prerequisite

Connection Hub only (`ops_accounts_list` and `ops_context_open` in `tools/list`). If missing, use `/opsphere-setup` for normal single-tenant work context (`ops_set_work_context`).

## Steps

1. Read and follow skill **[`skills/open-work-context/SKILL.md`](../skills/open-work-context/SKILL.md)** end to end.
2. Call `ops_accounts_list` if the user has not named which client to use.
3. Call `ops_context_open` with the chosen `linked_connection_id`.
4. Tell the user which workspace is active (label/slug from tool output) and remind them that **every** tenant-scoped tool call needs the returned `context_id`.
5. Before switching clients, use `ops_context_close` on the current context.

## Related

- **`/link-account`** — add or remove linked workspaces first.
- **`/integration-status`** — configure integrations on the **linked** tenant (not on the Hub anchor).
