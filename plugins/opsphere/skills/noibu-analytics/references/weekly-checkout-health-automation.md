# Weekly checkout health — automation prompt (canonical)

Breitling **www.breitling.com** weekly job. Base playbook lives in Cursor Automation; **this file tracks Opsphere/Noibu contract changes** so you can diff before deploy.

Unchanged sections (Phases 0–3, 5, 7, anti-patterns except noted) match the production prompt as of 2026-10-07. Below: **insertions and replacements** only.

See also: [noibu-console-links-automation.md](./noibu-console-links-automation.md).

---

## INSERT — after “API shapes (future-proof)” discovery list item 4

### Noibu console links (broker)

On **`noibu_domain_get`**, **`noibu_issues_search`**, and **`noibu_issue_get`**, read `structuredContent.data.noibuConsoleLinks` when present:

| Field | Use |
|-------|-----|
| `issuesListUrl` | Domain Issues tab in Noibu (`https://console.noibu.com/{domainId}/issues`) — section 1 + optional Slack footer |
| `issues[]` | `{ humanId, title?, issueUrl }` for table + Slack bullets |
| `issueUrl` on issue rows | Same URL; **copy verbatim** — never construct issue deep links |

Slack mrkdwn when `issueUrl` is set: `<issueUrl|#humanId · short title>`.

Run-log markdown: `[#humanId · title](issueUrl)` or full URL in the link column.

---

## REPLACE — Phase 1 step 2

2. **`noibu_domain_get`** — `input.name` = `STOREFRONT_HOST`. Store `domainId` (UUID) and, if present, `noibuConsoleLinks.issuesListUrl` for section 1 and Slack.

---

## REPLACE — Phase 4 (entire section)

## Phase 4 — Checkout issues (1 call)

**`noibu_issues_search`** with top-level **`preset: "checkout"`** (avoids ad/analytics noise from `LAST_SEEN_AT`):

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

Parse structured JSON (`structuredContent.data`). Use **`noibuConsoleLinks.issues`** for links when row-level `issueUrl` is missing. **Do not** grep local artifact files unless the tool reports truncation.

**Issue selection:** Top ≤5 from this response only (same rules as before: checkout/payment themes, exclude ad noise, no padding).

**Table columns:** `humanId`, short title, theme, `revLost90d`, key `topUrls` or signal, `lastSeenAt`, **Noibu link** (`issueUrl` or `noibuConsoleLinks.issues[].issueUrl` — full URL, not the word “Console”).

**`noibu_issue_get`:** only if `ISSUE_DETAIL_MAX` > 0; use returned `issueUrl` / `noibuConsoleLinks` in the run log if you drill down.

---

## REPLACE — Report section 1 bullet list (add one line)

After domain UUID: **Noibu issues list:** `issuesListUrl` from Phase 1 `noibu_domain_get` (or Phase 4 `noibuConsoleLinks`).

---

## REPLACE — Phase 6 Slack template block “Checkout issues”

```
*Checkout issues (top ≤5)* · totalMatched=<n>
<Optional one line: <issuesListUrl|View all issues in Noibu> when URL known from Phase 1 or Phase 4>
• <issueUrl|#<humanId> · <theme> · <short title>> · revLost90d=<n> · <one URL or signal>
(repeat only rows from section 5; use plain text bullet if issueUrl missing — do not invent a link)
```

---

## INSERT — Anti-patterns (add bullets)

- Hand-building `console.noibu.com` issue URLs instead of using `issueUrl` / `noibuConsoleLinks`
- Slack issue bullets without `issueUrl` when the structured response included one for that `humanId`
- Phase 4 `noibu_issues_search` **without** `preset: checkout` when the goal is checkout health (unless explicitly testing manual filters)
