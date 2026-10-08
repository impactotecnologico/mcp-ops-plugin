# Store Pulse on Opsphere (text-first)

Noibu's [store-pulse](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/SKILL.md) skill targets **Cowork**: inline HTML widgets, saved dashboards, and scheduled email/Slack. Opsphere exposes **`noibu_sessions_search`** (upstream `noibu_search_sessions`) only — no `show_widget`, `create_artifact`, or cron tools.

## What you can reproduce in Cursor / Opsphere MCP

| Store Pulse step | Opsphere approach |
|------------------|-------------------|
| Resolve domain | `noibu_domains_list` → `noibu_domain_get` if user named a host |
| Core KPIs (24h vs prior 24h) | Two `noibu_sessions_search` calls (or `compareToPrevious` if used in query) — see [core-kpis block](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/references/blocks/core-kpis.md) |
| Purchase funnel | Second query with funnel step measures — [purchase-funnel block](https://github.com/Noibu/ai-plugin/blob/main/src/skills/store-pulse/references/blocks/purchase-funnel.md) |
| Narrative summary | Agent prose in chat (2–3 sentences), no widget |
| Save dashboard / schedule | Not available — use Noibu Console or Cowork with official MCP |

## Agent workflow

1. Confirm domain (list or get by name).
2. Run session queries for **current** and **prior** 24h windows (UTC ISO ranges).
3. Compute engagement from bounce rate; quote conversion, AOV, RPS from predefined/aggregate measures.
4. Optionally run funnel step counts (session fields / predefined measures per Noibu docs).
5. End with one investigative follow-up question (same intent as Store Pulse "Where to next?" — without `AskUserQuestion` UI).

Always set **`rationale`** on each tool call.

For Cursor Automations, this remains an atomic-tool workflow: cap the whole run at 48 Noibu data calls, retry an invalid query at most once, checkpoint `ops_execution_budget` after KPIs and issues, and stop with a partial report when `terminal_for_run=true`. Do not wait inside the run for a budget reset.

See `references/opsphere-broker-tools.md` in this skill for JSON shapes under Opsphere `input`.
