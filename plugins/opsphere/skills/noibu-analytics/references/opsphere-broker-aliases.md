# Opsphere Noibu broker — argument aliases

The gateway rewrites Opsphere **`input`** before calling upstream Noibu MCP. Prefer the Opsphere shapes below; do not mirror upstream GraphQL variable names unless you are debugging a gateway release.

Canonical JSON examples: **`opsphere-broker-tools.md`**. Implementation reference: `mcp-ops-b` → `docs/noibu-broker-tools.md` and `src/noibu/upstream-args.ts`.

## Issue UUID naming

| Opsphere tool | You pass | Gateway sends upstream |
|---------------|----------|------------------------|
| `noibu_error_diagnosis_get` | `errorIds: string[]` (issue UUIDs from search/detail) | `issueIds` |

Upstream rejects `errorIds`. On Opsphere, keep using **`errorIds`** for diagnosis — the broker maps them.

For trends and highlights, pass **`issueId`** (single) or **`issueIds`** (array). The broker coalesces `issueId` / `issueIds` / `errorIds` into upstream **`issueIds`** for `noibu_error_trends_get` only.

## Error trends (`noibu_error_trends_get`)

| Opsphere `input` | Gateway behavior |
|------------------|------------------|
| `domainId` | forwarded |
| `issueId` or `issueIds` | upstream `issueIds` |
| `days` (e.g. `LAST7_DAYS`; default `LAST7_DAYS` if omitted) | forwarded upstream (same preset strings as `noibu_issue_get`) |
| `steps` | default `[0,1,2,3,4]` when omitted |

Do **not** pass `timePeriod` or `currentInterval` on Opsphere — the broker removes them; the official Noibu MCP maps `days` to GraphQL enums internally.

## Session and page exploration (nested `input.input`)

Shared shape for **`noibu_sessions_search`**, **`noibu_sessions_lookup`**, **`noibu_page_visits`**:

```json
{
  "domainId": "<uuid>",
  "input": {
    "periodOptions": {
      "dateTimeRange": { "startTime": "…Z", "endTime": "…Z" }
    },
    "queryInput": { }
  }
}
```

- **`noibu_sessions_lookup`** — nested **`periodOptions.dateTimeRange`** is required. Row-level **`queryInput.select`** must be objects (broker coerces string field names and applies defaults: `SESSION_ID`, `SESSION_START_TIME`, `orderBy`, `limit: 10`).
- **`queryInput.orderBy`** — required for session/page **aggregates** (`noibu_sessions_search` / `noibu_page_visits`).
- **`noibu_page_visits`** with `groupBy` — use field **`URL`** in `groupBy.fieldSegments`, not `PAGE_URL`; include `orderBy` on your `measureAlias`.

Grouped page-visit rows often appear under `structuredContent.data.domain.<query>.records` (for example `pageVisitsQuery.records`). If the gateway reports no rows with groupBy, fix field/window/orderBy before retrying.

## Common failures

| Symptom | Likely fix |
|---------|------------|
| Upstream text "Missing issueIds" on diagnosis | Use Opsphere `errorIds`; ensure gateway includes broker alias release |
| GraphQL `$timePeriod` / `$currentInterval` invalid on trends | Use Opsphere `days` only (`LAST7_DAYS`); do not pass `timePeriod`/`currentInterval` — upgrade gateway if broker still injects them |
| `upstream_empty` on page visits with groupBy | `URL` groupBy + `orderBy` + `dateTimeRange` |
| Validation on `count` / `total` as strings | Fixed in gateway schema coercion — upgrade gateway if you still see MCP -32602 |
| Markdown/plain text in `content[]` with thin `data` | Read `content[].text` or `data.text` when `format` is `markdown` / `plain` |

Gateway debug (operators): `NOIBU_DEBUG_PAYLOAD=1` on the gateway task — see `opsphere-broker-tools.md` in `mcp-ops-b`.
