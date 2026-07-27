---
name: open-work-context
description: Open, use, and switch server-side work contexts on a Connection Hub (context_id for tenant-scoped MCP tools). Use when ops_context_open is available, initialize shows no active context, or BROKER_CONTEXT_REQUIRED errors appear.
---

# Open Work Context (Connection Hub)

On a **Connection Hub**, operational tools (`dd_*`, `k8s_*`, `vercel_*`, `deployment_status`, `macro_*`, `memory_*`, etc.) require a valid **`context_id`** bound to one **linked connection**. The gateway enforces this on every tenant-scoped call — the model cannot switch tenants by naming them.

> **Legacy single-tenant:** If `ops_context_open` is **not** in `tools/list`, skip this skill — your JWT already maps to one tenant.

## Tools

| Tool | Parameters | Purpose |
|------|------------|---------|
| `ops_accounts_list` | — | List linked connections; pick `id` (UUID) |
| `ops_context_open` | `linked_connection_id`, optional `chat_session_key` | Returns `context_id`, `expires_at`. Use a stable `chat_session_key` per Cursor chat tab. |
| `ops_context_close` | `context_id` | Close context before switching tenants |

**MCP resources (read-only):**

- `opsphere://hub/active-context` — current `context_id`, connection label, expiry
- `opsphere://hub/connections` — same list as `ops_accounts_list`

**Bootstrap:** After MCP `initialize`, server `instructions` may include `Connection Hub — work context` with the active `context_id` when one exists.

## Tool classes on Hub (mandatory)

| Class | Needs `context_id`? | Examples |
|-------|---------------------|----------|
| **GLOBAL** | No | `ops_*` (including broker tools), `dns_lookup`, `http_check`, `cert_status`, `tcp_connect`, `dnssec_check` |
| **TENANT_SCOPED** | **Yes** | `dd_*`, `k8s_*`, `vercel_*`, `ghe_*`, `bb_*`, `deployment_status`, `memory_*`, most integrations |
| **MACRO** | **Yes** | `macro_outage_triage`, `macro_endpoint_health`, `macro_env_health` |

Pass `context_id` as a **tool argument** on every tenant-scoped and macro call. For `ops_context_close`, `context_id` is required in the tool payload (do not strip it).

## When to run

1. User asks for logs, deploys, K8s, or any integration work on a **specific** linked client.
2. Initialize instructions say _"No active context"_ or suggest `ops_context_open`.
3. A tool returns `BROKER_CONTEXT_REQUIRED` or mentions missing `context_id`.
4. User says _"switch to [client]"_ or _"work on the other account"_.

## Open flow

1. If `context_id` is already in initialize instructions or `opsphere://hub/active-context`, **reuse it** for tenant-scoped calls unless the user asks to switch.
2. Otherwise call `ops_accounts_list`.
   - **One connection** → use its `id` without asking.
   - **Multiple** → ask which client (show `label` + tenant `slug` from the tool result).
3. Call `ops_context_open` with optional `chat_session_key` — a **stable id for this Cursor chat tab** (reuse across the session; required for workspace pinning when switching connections).
4. Store the returned `context_id` for this chat session. Mention `expires_at` only if the user asks or the session is long-running.
5. **Optional** at chat start: `memory_session_touch(context_id: "ctx_…")` — on Hub the gateway sets `external_session_key` from `chat_session_key` when you omit it; pass the same value explicitly if you prefer.
6. Run tenant-scoped tools with the same `context_id` until the user switches or closes.

Example:

```
ops_context_open(
  linked_connection_id: "550e8400-e29b-41d4-a716-446655440000",
  chat_session_key: "cursor-chat-<stable-per-tab-id>"
)
→ context_id: "ctx_…"

memory_session_touch(context_id: "ctx_…", repo: "org/repo")  // external_session_key auto-aligned on Hub

dd_logs_search(context_id: "ctx_…", q: "status:error", from: "now-1h")
```

## Switch or close flow

1. If an active `context_id` exists, call `ops_context_close(context_id: "ctx_…")`.
2. Call `ops_context_open` with the new `linked_connection_id`.
3. Use the new `context_id` on subsequent scoped tools.

Do **not** reuse a stale `context_id` after switch — always close or open fresh.

## Integrations and work context on linked tenants

With an open `context_id`:

- **`configure-integration`** → `ops_configure_integration` runs against the **linked** tenant (not the Hub).
- **`set-work-context`** → `ops_set_work_context` on the linked tenant (Hub anchor rejects it).

Without `context_id`, `ops_configure_integration` on Hub returns `HUB_OPERATIONAL_DENIED` — open context first.

## Memory + chat pinning (Connection Hub)

Broker **workspace pinning** (`chat_session_key` on `ops_context_open`) and operational memory **session scope** share the same stable chat id:

| Broker | Memory |
|--------|--------|
| `ops_context_open(…, chat_session_key: "…")` | `memory_session_touch(…, external_session_key: "…")` |

**Recommended:** pass the same stable key to both when opening a Hub chat. If you omit `external_session_key` on `memory_session_touch`, the gateway injects it from the active broker context’s `chat_session_key` (when present). Explicit `external_session_key` from the caller always wins.

## Errors

| Code / message | Action |
|----------------|--------|
| `BROKER_CONTEXT_REQUIRED` | Call `ops_context_open`, retry with `context_id` |
| `BROKER_CONTEXT_INVALID` / expired | `ops_context_open` again |
| `LINKED_CONNECTION_NOT_FOUND` | `ops_accounts_list`; user may need `link-account` skill |
| `MCP_SESSION_REQUIRED` | Reconnect MCP (`/opsphere-reconnect` or Codex `mcp login opsphere`) |
| `HUB_OPERATIONAL_DENIED` | Open work context for a linked workspace first |

## Avoid

- Guessing `context_id` or `linked_connection_id` — only from gateway responses.
- Omitting `context_id` on scoped tools when multiple connections exist.
- Calling tenant-scoped tools while still on Hub with no context.
- Naming specific customer tenants in skill text — use labels/slugs from `ops_accounts_list` only.
