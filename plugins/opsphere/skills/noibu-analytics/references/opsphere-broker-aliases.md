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
| `days` (e.g. `LAST7_DAYS`; default `LAST7_DAYS`) | forwarded (same presets as `noibu_issue_get`) |
| optional `steps` | defaults to `[0,1,2,3,4]` |

Do **not** pass `timePeriod` or `currentInterval` on Opsphere — the broker strips them. The official Noibu MCP maps `days` to GraphQL enums internally (broker-injected enum strings break upstream).

## Session lookup (`noibu_sessions_lookup`) — different from sessions search

```json
{
  "domainId": "<uuid>",
  "input": {
    "periodOptions": {
      "dateTimeRange": { "startTime": "…Z", "endTime": "…Z" }
    },
    "queryInput": {
      "select": [
        { "field": { "target": "SESSION_ID" } },
        { "timeField": { "target": "SESSION_START_TIME" } }
      ],
      "orderBy": { "selectAlias": "session_start_time", "direction": "DESCENDING" },
      "limit": 10
    }
  }
}
```

- **`periodOptions.dateTimeRange` required**
- **`queryInput.select`** — objects (broker coerces `"SESSION_ID"` strings; if omitted, defaults to `SESSION_ID` + `SESSION_START_TIME`, `orderBy`, `limit: 10`)
- Use **`orderBy`** or named **`sort`** — **not** `measures` / `groupBy` (those are for `noibu_sessions_search`)

## Session search / page visits (aggregates)

Shared aggregate shape for **`noibu_sessions_search`** and **`noibu_page_visits`**:

```json
{
  "domainId": "<uuid>",
  "input": {
    "periodOptions": {
      "dateTimeRange": { "startTime": "…Z", "endTime": "…Z" }
    },
    "queryInput": { "measures": [], "orderBy": {} }
  }
}
```

- **`queryInput.orderBy`** required for aggregates.
- **`noibu_page_visits`** with `groupBy` — field **`URL`** in `groupBy.fieldSegments`, not `PAGE_URL`.

Grouped page-visit rows often appear under `structuredContent.data.domain.<query>.records`.

## Common failures

| Symptom | Likely fix |
|---------|------------|
| Upstream text "Missing issueIds" on diagnosis | Use Opsphere `errorIds`; ensure gateway includes broker alias release |
| GraphQL invalid `$timePeriod` / `$currentInterval` on trends | Opsphere `days` only (`LAST7_DAYS`); broker must not inject enum vars — redeploy gateway |
| GraphQL missing `$steps` on trends | Broker should inject `[0,1,2,3,4]` after deploy |
| `select` GraphQL errors on session lookup | Object select items + `periodOptions.dateTimeRange`; no measures |
| `upstream_empty` on page visits with groupBy | `URL` groupBy + `orderBy` + `dateTimeRange` |
| Validation on `count` / `total` as strings | Fixed in gateway schema coercion — upgrade gateway if you still see MCP -32602 |

Gateway debug (operators): `NOIBU_DEBUG_PAYLOAD=1` on the gateway task — see `opsphere-broker-tools.md` in `mcp-ops-b`.
