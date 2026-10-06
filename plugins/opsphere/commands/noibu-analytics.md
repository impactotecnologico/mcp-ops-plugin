---
name: noibu-analytics
description: Noibu store health, conversion KPIs, and issue search via Opsphere (OAuth-linked). Use for Store Pulse-style snapshots, domain lookup, and ecommerce analytics.
---

# Noibu analytics

Follow skill **[`skills/noibu-analytics/SKILL.md`](../skills/noibu-analytics/SKILL.md)**.

## Steps

1. Call `noibu_link_status`. If `linked` is false, direct the user to **Admin → Integrations → Noibu** (tenant-wide OAuth; not `ops_configure_integration`). Scheduled automations should fail fast with that message — do not rely on `noibu_link_start` without a human browser.
2. Load the skill references for routing (`querying-noibu-data`) and, for "how's the store" / pulse questions, **Store Pulse (text)** workflow.
3. Always pass **`rationale`** and nest broker args under **`input`**.

## Related

- **`/integration-status`** — see whether the workspace has the `noibu` module
- Official Noibu Cowork features (widgets, saved dashboards, schedules) require the **Noibu MCP** directly, not Opsphere

**Claude Code:** invoke as `/opsphere:noibu-analytics` when the command is registered in your plugin copy.
