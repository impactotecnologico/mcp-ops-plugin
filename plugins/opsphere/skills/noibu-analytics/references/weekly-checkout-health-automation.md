# Weekly checkout health — automation contract (public)

Opsphere/Noibu **contract** for scheduled **checkout health** jobs (KPIs, funnel, checkout issues, optional correlation, Slack digest). The **full run prompt** (phases, caps, probes, channel IDs) lives in **Cursor Automation only** — not in this repository.

When updating an in-product automation after a gateway release, apply the deltas below to your private prompt. Related: [noibu-console-links-automation.md](./noibu-console-links-automation.md), [opsphere-broker-tools.md](./opsphere-broker-tools.md).

---

## Noibu console links (broker)

On **`noibu_domain_get`**, **`noibu_issues_search`**, and **`noibu_issue_get`**, read `structuredContent.data.noibuConsoleLinks` when present:

| Field | Use |
|-------|-----|
| `issuesListUrl` | Domain Issues tab (`https://console.noibu.com/{domainId}/issues`) — report header + optional Slack |
| `issues[]` | `{ humanId, title?, issueUrl }` for table + Slack bullets |
| `issueUrl` on issue rows | **Copy verbatim** — never construct issue deep links |

**Slack mrkdwn** when `issueUrl` is set: `<issueUrl|#humanId · short title>`.

**Run log markdown:** `[#humanId · title](issueUrl)` or full URL in the **Noibu link** column.

---

## Phase 1 — `noibu_domain_get`

Always `{ "input": { "name": "<hostname>" } }`. Store `domainId` and, if present, **`noibuConsoleLinks.issuesListUrl`**.

---

## Phase 4 — `noibu_issues_search`

Use top-level **`preset: "checkout"`** (do not rely on `LAST_SEEN_AT` alone for checkout health):

```json
{
  "rationale": "Top checkout-related issues for the reporting week.",
  "preset": "checkout",
  "input": {
    "issuesSearch": {
      "domainId": "<UUID from Phase 1>",
      "days": "LAST7_DAYS",
      "pagination": { "limit": 50, "pageDir": "NEXT_PAGE" }
    }
  }
}
```

Parse structured JSON; use **`noibuConsoleLinks.issues`** when row-level `issueUrl` is missing. Issues table: include **Noibu link** column from upstream URLs.

---

## Phase 6 — Slack (issues block)

- Optional: `<issuesListUrl|View all issues in Noibu>` when known from Phase 1 or Phase 4.
- Per issue: `<issueUrl|#<humanId> · <theme> · <short title>>` — same rows as the run-log issues table; plain text if `issueUrl` absent (do not invent links).

---

## Other broker notes

| Topic | Rule |
|-------|------|
| `noibu_page_visits` (if used) | `groupBy.fieldSegments: [{ "field": "URL" }]` — not `PAGE_URL` |
| OAuth | `noibu_link_status` only in automation — no `noibu_link_start` |

---

## Anti-patterns

- Fabricated `console.noibu.com` issue URLs
- `noibu_issues_search` **without** `preset: checkout` for checkout-health weekly jobs
- Slack bullets with invented links when `issueUrl` was returned for that `humanId`

---

## Changelog

**2026-10-07** — `noibuConsoleLinks`, `preset: checkout`, Slack mrkdwn issue links; full prompt removed from public plugin repo (maintained in Cursor Automation).
