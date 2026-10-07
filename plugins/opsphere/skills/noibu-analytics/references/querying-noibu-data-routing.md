# Noibu routing (Opsphere tool names)

Adapted from Noibu [querying-noibu-data](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/SKILL.md). Use **Opsphere** names below; semantics are unchanged.

| Official | Opsphere |
|----------|----------|
| `noibu_get_domain` | `noibu_domain_get` |
| `noibu_list_domains` | `noibu_domains_list` |
| `noibu_get_company` | `noibu_company_get` |
| `noibu_search_sessions` | `noibu_sessions_search` |
| `noibu_get_page_visits` | `noibu_page_visits` |
| `noibu_search_errors` | `noibu_issues_search` |
| `noibu_get_error` | `noibu_issue_get` |

Place upstream args under **`input`**. Siblings on the Opsphere tool: **`rationale`** (always) and **`preset: checkout`** on `noibu_issues_search` when listing checkout/payment/cart issues (avoids ad/analytics noise from `LAST_SEEN_AT` alone).

## Canonical entrypoints (order)

1. **`noibu_domain_get`** — resolve hostname → UUID (`input.name`). Skip if user gave UUID. Fallback: **`noibu_domains_list`**.
2. **`noibu_sessions_search`** — session-level aggregates (CVR, revenue, sources, products). Requires **`orderBy`** inside `queryInput`.
3. **`noibu_page_visits`** — page-level aggregates, web vitals, per-URL behaviour. Requires **`orderBy`**. Top URLs: `groupBy.fieldSegments` with field **`URL`** (not `PAGE_URL`).

## Top-level routing

- Conversion rate, revenue by X, AOV, "% of sessions" → **`noibu_sessions_search`** ([sessions.md](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/references/sessions.md)).
- Traffic source / channel — usually sessions (`UTM_SOURCE`, `UTM_MEDIUM`). If UTM empty for paid, use **`noibu_page_visits`** + `REFERRING_URL CONTAINS "gclid"` (see official **Recovering URL parameters**).
- Slow/broken pages, LCP/CLS/INP, per-URL traffic → **`noibu_page_visits`** ([page-visits.md](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/references/page-visits.md)).
- Store health / "how's my store" / pulse → skill **`store-pulse-opsphere.md`** (not error tools first).
- Errors / bugs — **only when explicit** → **`noibu_issues_search`** (`preset: checkout` for storefront checkout lists) / **`noibu_issue_get`** ([errors.md](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/references/errors.md)). Use **`issueUrl`** / **`noibuConsoleLinks`** in reports — see **`noibu-console-links-automation.md`**.

**Not brokered on Opsphere:** `noibu_visualize_page_visits`, AB tests, releases, journeys/replay, `noibu_send_feedback`, funnel chart renderer — official MCP only.

## Before reporting "no data"

1. Check **URL parameters** via page visits + `REFERRING_URL` (not sessions for param recovery).
2. Check **sibling domains** via **`noibu_company_get`** — storefront vs checkout often split.

## Domain resolution

1. User UUID → use directly.
2. Hostname → **`noibu_domain_get`** with `input.name`.
3. Miss → **`noibu_domains_list`**; surface suggestions from errors if present; never silently substitute.

## Query constraints

- Row caps: sessions ~100 rows; page visits ~1500.
- **`orderBy` is required** inside `queryInput`.
- Unique measures by (field, func).
- Time series resolution: 24h → HOUR, 7d → DAY, 90d → WEEK.

## Lead with analytics

Start with sessions/page visits unless the user explicitly asks about errors. Analytics frames scope; errors explain root cause when requested.
