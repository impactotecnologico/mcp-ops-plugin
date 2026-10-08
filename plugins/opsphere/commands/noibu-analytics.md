---
name: noibu-analytics
description: Noibu store health, conversion KPIs, and issue search via Opsphere (OAuth-linked). Use for Store Pulse-style snapshots, domain lookup, and ecommerce analytics.
---

# Noibu analytics

Follow skill **[`skills/noibu-analytics/SKILL.md`](../skills/noibu-analytics/SKILL.md)**.

## Steps

1. Call `noibu_link_status`. If `linked` is false, direct the user to **Admin → Integrations → Noibu** (tenant-wide OAuth; not `ops_configure_integration`). Scheduled automations should fail fast with that message — do not rely on `noibu_link_start` without a human browser.
2. Load **`skills/noibu-analytics/references/querying-noibu-data-routing.md`**, **`opsphere-broker-tools.md`**, and **`opsphere-broker-aliases.md`** (shapes, `preset: checkout`, diagnosis `errorIds`, trends `days`, page visits `groupBy` → field `URL`).
3. For checkout issue lists use **`preset: checkout`** on `noibu_issues_search`; for Slack/weekly jobs follow **`weekly-checkout-health-automation.md`** and **`noibu-console-links-automation.md`** (full automation prompt stays in Cursor, not the public repo).
4. Always pass **`rationale`**; nest upstream args under **`input`**.

## Related

- **`/integration-status`** — see whether the workspace has the `noibu` module
- Official Noibu Cowork features (widgets, saved dashboards, schedules) require the **Noibu MCP** directly, not Opsphere

**Claude Code:** invoke as `/opsphere:noibu-analytics` when the command is registered in your plugin copy.
