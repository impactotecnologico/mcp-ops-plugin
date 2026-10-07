# Noibu console links — automation & Slack

Opsphere broker adds **`noibuConsoleLinks`** on `structuredContent.data` for:

- `noibu_domain_get` → `issuesListUrl`, `domainId`, `hostname`
- `noibu_issues_search` → `issuesListUrl`, `issues[]` (when upstream returns `issueUrl`)
- `noibu_issue_get` → `issueUrl`, `issues[]` (single row)

## Rules for any scheduled job

1. **Issues:** Use `issueUrl` from each issue row or from `noibuConsoleLinks.issues[]`. Never build `console.noibu.com/.../issues/{uuid}` yourself.
2. **Issues list:** Use `issuesListUrl` for “open all issues in Noibu” (section 1 footer or executive summary).
3. **KPIs / funnel / page visits:** No per-metric deep links — optional `issuesListUrl` only if you already resolved the domain in Phase 1.
4. **Slack mrkdwn:** When `issueUrl` is present: `<issueUrl|#humanId · short title>` (see weekly playbook Phase 6).
5. **Run log (markdown):** `[#humanId · title](issueUrl)` or bare URL in the issues table.

Policy source: [Noibu console-urls.md](https://github.com/Noibu/ai-plugin/blob/main/src/skills/querying-noibu-data/references/console-urls.md).
