---
name: noibu-analytics
description: Noibu ecommerce analytics on Opsphere — routing (querying-noibu-data), Store Pulse text snapshots, issues, and session/page KPIs. Use when the user asks about conversion, store health, checkout errors, Noibu domains, or "how is the store doing".
---

# Noibu analytics (Opsphere)

Use **Opsphere MCP** `noibu_*` tools on the remote gateway. Noibu is **not** configured via `ops_configure_integration` — the tenant links **one** OAuth connection in **Admin → Integrations → Noibu** (`noibu_link_start` / `noibu_link_status`, `scope: tenant`).

**Explicit opt-out is authoritative.** If the user refused Opsphere for this task, do not call Noibu tools indirectly.

## Before any data call

1. Confirm `noibu_link_status` shows `linked: true` and `scope: tenant` (any tenant admin can connect once for the whole workspace).
2. Confirm `noibu_domains_list` (or another `noibu_*` data tool) appears in `tools/list` — module `noibu` must be enabled for the workspace.
3. Read **`references/querying-noibu-data-routing.md`** — same routing semantics as Noibu's [querying-noibu-data](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/SKILL.md), with Opsphere tool names.
4. Read **`references/opsphere-broker-tools.md`** — JSON under **`input`**, optional top-level **`rationale`** (forwarded upstream).

Field-level measure docs remain on Noibu's GitHub (`references/sessions.md`, `references/page-visits.md`, `references/errors.md`, … under [ai-plugin](https://github.com/Noibu/ai-plugin/tree/main/src/skills/querying-noibu-data/references)).

## Intent routing

| User intent | Follow |
|-------------|--------|
| Conversion, revenue, AOV, traffic sources, cohorts, funnels (counts) | `querying-noibu-data` routing → usually `noibu_sessions_search` |
| Per-page traffic, web vitals, scroll/clicks, landing/exit | `noibu_page_visits` |
| **Store health**, "how's the store", daily snapshot, pulse | **`references/store-pulse-opsphere.md`** (text-first; no Cowork widgets) |
| Errors / bugs / issues (explicit) | `noibu_issues_search`, `noibu_issue_get` — after domain UUID |
| Domain / company scope | `noibu_domains_list`, `noibu_domain_get` (`input.name`), `noibu_company_get` |

Lead with **analytics** unless the user explicitly asks about errors.

## Store Pulse on Opsphere

When the user wants an at-a-glance **last 24h** health read (same intent as Noibu's [store-pulse](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/SKILL.md)):

1. Open **`references/store-pulse-opsphere.md`** and execute that workflow.
2. Use measure definitions from Noibu's [core-kpis](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/references/blocks/core-kpis.md) and [purchase-funnel](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/references/blocks/purchase-funnel.md) blocks inside `noibu_sessions_search`.
3. Present a short prose summary (KPI row + funnel steps + one investigative follow-up). **Do not** call `show_widget`, `create_artifact`, `list_artifacts`, or schedule tools — they are not brokered.

## Opsphere vs official Noibu MCP

| Official | Opsphere |
|----------|----------|
| `noibu_list_domains` | `noibu_domains_list` |
| `noibu_get_domain` | `noibu_domain_get` |
| `noibu_get_company` | `noibu_company_get` |
| `noibu_search_errors` | `noibu_issues_search` |
| `noibu_get_error` | `noibu_issue_get` |
| `noibu_search_sessions` | `noibu_sessions_search` |
| `noibu_get_page_visits` | `noibu_page_visits` |

Upstream arguments belong under **`input`**. **`rationale`** is a sibling field on the Opsphere tool call — always set it.

## Out of scope (Opsphere allowlist)

Writes, AB tests, replays, platform logs, visualizations (`noibu_visualize_page_visits`), feedback, releases, and Cowork UI are **not** brokered. Say so clearly and point to the official Noibu MCP or Noibu Console when the user asks for those capabilities.

## Report

- State domain name and UUID used, time window (UTC), and sibling-domain checks when conversion looked zero.
- Separate live tool results from inference.
- If tools return GraphQL or validation errors, quote the gateway message; fix args using `references/opsphere-broker-tools.md` before retrying.
