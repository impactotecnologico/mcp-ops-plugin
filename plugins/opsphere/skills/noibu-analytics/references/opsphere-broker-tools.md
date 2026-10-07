# Noibu broker — tool args (Opsphere)

Opsphere brokers a **read-only allowlist** of [Noibu MCP](https://mcp.noibu.com) tools. OAuth is **one link per tenant** (`noibu_link_*`, `scope: tenant`); data calls use **`input`** plus optional top-level **`rationale`** (forwarded upstream).

Routing and field semantics match Noibu's open plugin skills — start with [querying-noibu-data](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/SKILL.md). **Store Pulse** ([skill](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/SKILL.md)) is adapted in Opsphere as text + `noibu_sessions_search` queries (no Cowork `show_widget` / artifacts).

## Opsphere vs official Noibu MCP

| Official tool | Opsphere tool | Notes |
|---------------|---------------|--------|
| `noibu_list_domains` | `noibu_domains_list` | `input.pagination` required |
| `noibu_get_domain` | `noibu_domain_get` | `input.name` required (hostname) |
| `noibu_get_company` | `noibu_company_get` | `input.name` required (company name) |
| `noibu_search_errors` | `noibu_issues_search` | `input.issuesSearch` object |
| `noibu_get_error` | `noibu_issue_get` | `input.domainId`, `humanId`, `days` |
| `noibu_search_sessions` | `noibu_sessions_search` | `input.domainId` + nested `input.input.queryInput` |
| `noibu_get_page_visits` | `noibu_page_visits` | same nesting as sessions |

Everything upstream expects at the **top level** of the MCP call must be placed under Opsphere **`input`**. Siblings on the Opsphere tool: **`rationale`** and **`preset`** (`checkout` on `noibu_issues_search` only).

## Domain resolution

1. `noibu_domains_list` with `{ "pagination": { "limit": 50, "offset": 0 } }`
2. `noibu_domain_get` with `{ "name": "www.example.com" }`
3. Sibling storefront/checkout domains: `noibu_company_get` with `{ "name": "COMPANY" }`

## Examples (Opsphere MCP)

### List domains

```json
{
  "rationale": "User asked which storefronts are monitored.",
  "input": { "pagination": { "limit": 50, "offset": 0 } }
}
```

### Domain / company lookup

```json
{
  "rationale": "Resolve hostname before issue search.",
  "input": { "name": "www.breitling.com" }
}
```

```json
{
  "rationale": "Check sibling domains before reporting zero conversion.",
  "input": { "name": "BREITLING" }
}
```

### Issue search — checkout preset (recommended)

```json
{
  "rationale": "Top checkout issues last 7 days on production storefront.",
  "preset": "checkout",
  "input": {
    "issuesSearch": {
      "domainId": "<uuid-from-domains-list>",
      "days": "LAST7_DAYS",
      "pagination": { "limit": 15, "pageDir": "NEXT_PAGE" }
    }
  }
}
```

### Top pages (`noibu_page_visits`)

Use `groupBy.fieldSegments` with field **`URL`** (not `PAGE_URL`).

```json
{
  "rationale": "Top storefront URLs by visit count last 24h.",
  "input": {
    "domainId": "<uuid>",
    "input": {
      "periodOptions": {
        "dateTimeRange": {
          "startTime": "2026-10-04T00:00:00Z",
          "endTime": "2026-10-05T00:00:00Z"
        }
      },
      "queryInput": {
        "measures": [
          {
            "aggregate": {
              "measureAlias": "visits",
              "measureFunc": "COUNT",
              "target": { "field": "PAGE_VISIT_ID" }
            }
          }
        ],
        "groupBy": { "fieldSegments": [{ "field": "URL" }] },
        "orderBy": { "measureAlias": "visits", "direction": "DESCENDING" },
        "limit": 15
      }
    }
  }
}
```

### Store Pulse–style KPIs (24h)

Use `noibu_sessions_search` with measures from [core-kpis.md](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/references/blocks/core-kpis.md). Engagement = `1 - bounce_rate` from predefined `BOUNCE_RATE`.

```json
{
  "rationale": "Store health snapshot — sessions and conversion last 24h.",
  "input": {
    "domainId": "<uuid>",
    "input": {
      "periodOptions": {
        "dateTimeRange": {
          "startTime": "2026-10-04T18:00:00Z",
          "endTime": "2026-10-05T18:00:00Z"
        }
      },
      "queryInput": {
        "measures": [
          {
            "aggregate": {
              "measureAlias": "sessions",
              "measureFunc": "COUNT",
              "target": { "field": "SESSION_ID" }
            }
          },
          { "predefined": { "measure": "BOUNCE_RATE", "measureAlias": "bounce_rate" } },
          { "predefined": { "measure": "CONVERSION_RATE", "measureAlias": "cvr" } }
        ],
        "orderBy": { "measureAlias": "sessions", "direction": "DESCENDING" }
      }
    }
  }
}
```

## Not brokered (official MCP only)

Writes, AB tests, replays, platform logs, visualizations, and Cowork UI (`show_widget`, artifacts, schedules) are **out of scope** for the Opsphere allowlist. Use the official Noibu MCP connection for those capabilities.

Metadata source: Noibu MCP `tools/list` (plugin) + [ai-plugin skills](https://github.com/Noibu/ai-plugin/tree/main/src/skills).
