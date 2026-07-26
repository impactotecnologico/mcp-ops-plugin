---
name: link-account
description: Link a client workspace to your Connection Hub via OAuth (multi-account). Connection Hub only — runs the link-account skill.
---

# Link Account (Connection Hub)

Guide the user through linking or unlinking a **client workspace** on their Connection Hub. Parity with Codex `@link-account`.

## Prerequisite

If `tools/list` does **not** include `ops_accounts_list`, the user is on a **legacy single-tenant** account — explain that this command applies only to Connection Hub signups and suggest normal OAuth via `/opsphere-setup`.

## Steps

1. Read and follow skill **[`skills/link-account/SKILL.md`](../skills/link-account/SKILL.md)** end to end.
2. Do **not** run shell commands or ask for OAuth codes, passwords, or tokens in chat.
3. Start with `ops_accounts_list` — show existing linked workspaces (if any).
4. For a new link: `ops_account_link_start` → give the user the `authorization_url` to open in a browser → wait for confirmation → verify with `ops_accounts_list` again.
5. For unlink: confirm with the user, then `ops_account_unlink` with the UUID from `ops_accounts_list`.
6. After a successful link, offer **`/open-work-context`** before operational tools (Datadog, K8s, deploys, integrations).

## If MCP is disconnected

Point to **`/opsphere-reconnect`** if tools fail with auth errors.
