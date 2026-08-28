---
name: opsphere-onboarding
description: Opsphere operational context for Claude Code — tool catalog by provider, integration prefixes, error codes (TRIAL_EXPIRED, RATE_LIMIT_EXCEEDED, READ_ONLY_PLAN, SINGLE_ENVIRONMENT_ONLY), Connection Hub concepts, and response presentation rules. Run this once per session (or when unsure which tool/skill/agent applies) — Claude Code has no always-on rule mechanism, so this skill is the substitute for Cursor's rules/onboarding-guide.mdc.
---

# Opsphere Onboarding (Claude Code)

Claude Code plugins do not load a `CLAUDE.md` or any file as always-on project context — unlike Cursor's `alwaysApply: true` rule. Invoke this skill (`/opsphere:opsphere-onboarding`) at the start of a session, or whenever a request touches Opsphere and you are unsure which tool, skill, or subagent applies.

Opsphere connects your DevOps stack to Claude Code through a **remote MCP gateway**. All tool calls go to `https://mcp-cursor.opsphere.io/mcp` — no tool logic runs locally, and no hidden scripts execute from this plugin.

## Live capability discovery (mandatory)

The table below is a routing reference for the full Opsphere product. It is **not**
proof that a provider or tool is active in the current workspace.

- The current MCP `tools/list` is the authority for what can be used now.
- When the user asks what Opsphere can do, present tools/providers that are in the
  current `tools/list` under **Available now**.
- Do not describe absent provider tools as active integrations. If setup/status
  tools are available, use `ops_list_integrations` and put disabled, unassigned,
  upgrade-only, or misconfigured providers under **Not active** or **Needs action**.
- Mention an inactive provider only as a clearly labelled setup/admin possibility;
  never mix it into the list of capabilities available now.
- Re-evaluate the live list after a workspace switch. A static skill catalog from
  an earlier workspace must not override the newly advertised MCP tools.

## Tool categories (routing reference only)

| Category | Provider | Tools |
|----------|----------|-------|
| Monitoring | Datadog | `dd_logs_search`, `dd_errors_by_service`, `dd_errors_recent`, `dd_synthetics_summary`, `dd_synthetics_results`, `synthetics_summary_by_location` |
| Deployments | Multi-stack (catalog) | **`deployment_status`** (preferred) — Vercel, CI, GitOps, S3+CloudFront, ECS from configured sources |
| Deployments | Vercel / Railway (direct) | `vercel_deploys_latest`, `vercel_project_status`; `railway_*` (17 read-only tools) — only when the user asks provider-specific or `deployment_status` gaps point there |
| Source control | GitHub / Bitbucket / GitLab | `ghe_org_repos` (discover) → `ghe_repo_summary`, `ghe_actions_latest`; `bb_pipelines_latest`, `bb_pipeline_diagnose`; `gl_pipelines_latest`, `gl_pipeline_diagnose` |
| CDN / DNS | Cloudflare | `cf_quick_status`, `cf_dns_records` |
| Issue tracking | Jira | `jira_issue_get`, `jira_issues_search` |
| Knowledge base | Confluence | `confluence_search`, `confluence_page_read` |
| Error tracking | Sentry | `sentry_issues_list`, `sentry_issues_search` |
| Code quality | SonarQube (paid) | `sq_projects_search` → `sq_last_scan_summary` / `sq_quality_gate_status` + `sq_issues_search`; `sq_duplications_show` for duplication drill-down |
| Search | Algolia (paid) | `alg_indices_list`, `alg_index_settings`, `alg_search`, `alg_object_get`, `alg_logs`; `alg_status` / `alg_incidents` are built-in (no credentials) |
| Cloud | AWS | `aws_sts_whoami`, `aws_cli_query`, `aws_bedrock_agent_diagnose`, `aws_lambda_agent_diagnose`, `aws_cloudwatch_logs_search` (Bedrock Agents — paid `aws` module) |
| AWS user sessions | AWS SSO | `check_aws_session_for_env`, `aws_session_status`, `aws_session_revoke`, `aws_sso_logout` (separate `aws-sessions` module) |
| Network (built-in) | — | `dns_lookup`, `http_check`, `cert_status` — work immediately after login, no setup needed |
| Integration mgmt | — | `ops_configure_integration`, `ops_list_integrations`, `ops_test_integration`, `ops_remove_integration` |
| Plan & usage | — | `ops_my_usage` (Connection Hub/self-service sessions when advertised) |
| Work context | — | `ops_set_work_context`, `ops_get_work_context` |
| Connection Hub | — | `ops_accounts_list`, `ops_account_link_start`, `ops_account_unlink`, `ops_context_open`, `ops_context_close` (only when in `tools/list`) |
| Operational memory | — | `memory_search`, `memory_store`, `memory_session_touch`, `memory_invalidate` |
| Macro workflows (Team+) | — | `macro_outage_triage`, `macro_endpoint_health`, `macro_env_health` |

Never invent tool names — only call tools present in the current session's `tools/list`.
In particular, `ops_my_usage` and the other self-service `ops_*` tools are not
guaranteed in a direct corporate-workspace login. Their absence does not mean the
operational provider integrations in that workspace are disconnected.

## Provider routing rules

- **GitHub**: prefer `repo: "owner/name"` when known. If the repository is unknown, call `ghe_org_repos`; a bare repo name uses only the active workspace's configured default org. A successful GitHub test/tool call means the token works—do not diagnose credentials as invalid until explicit repository routing and access have been checked.
- **AWS modules are separate**: `aws_sso_login_device_start`, its poll tool, STS, and AWS queries belong to `aws`. Session preflight/status/revoke/logout belong to `aws-sessions`. Enabling one does not expose the other.
- **AWS SSO prerequisites**: an enabled module is not enough; the SSO profile must exist in the active workspace Cloud Catalog/runtime. Local laptop SSO does not populate the remote gateway. A reconnect refreshes session/catalog state but does not create modules or profiles.
- **Atlassian shared authentication**: Confluence inherits Jira's site/email/API token unless an optional Confluence base URL is set. A Confluence 403 is an access/space-permission result, not “credentials missing”; a Jira/Confluence 404 can also hide resources the account cannot browse.
- **Jira retry discipline**: a 401 means the configured Atlassian identity/token
  must be repaired. On repeated 403/404 results for the same project or issue,
  make at most one exact-key lookup and one materially different diagnostic
  search, then stop and report the required Jira product, Browse Projects, and
  issue-security checks. Do not brute-force query variants or consume the
  workspace execution budget retrying the same denied resource.

## Three concepts — never mix them

| Concept | What it is | User-facing |
|---------|------------|-------------|
| **Personal Workspace** | Automatic operational workspace created at signup | Always **Active** after Community signup — no manual link |
| **Work Context** | Optional provider/account/environment notes (`ops_set_work_context`) | May show "not configured" — that does **not** mean Personal Workspace is broken |
| **External Workspace** | Extra workspace linked via Connection Hub OAuth | Community quota = **0**; upgrade required |

## Workspace switching requires explicit consent

A request for a ticket, zone, repository, project, provider, or tool associated
with another workspace is not permission to switch. Explain the likely mismatch,
name the target workspace when known, and ask whether the user wants to switch.
Call `ops_context_open` only after an explicit request or confirmation.

The switch is persistent: it changes the active workspace and client preference.
Never switch temporarily to answer, promise to switch back, or switch back
automatically. Keep the current workspace unchanged until the user decides.

## Subagent delegation (`@opsphere:<agent>`)

| Subagent | Invoke | Plans | Use for |
|----------|--------|-------|---------|
| `outage-triage` | `@opsphere:outage-triage` | All | Site-down, widespread failures, multi-step incident triage |
| `endpoint-health` | `@opsphere:endpoint-health` | All | One hostname/URL: DNS + HTTP + TLS |
| `ci-investigator` | `@opsphere:ci-investigator` | Professional+ | Failed CI/CD pipelines (Community gets an upgrade message) |
| `postmortem-writer` | `@opsphere:postmortem-writer` | All | Post-mortem / RCA drafting, optional `memory_store` |

When `ops_my_usage` is advertised, call it before delegating a premium subagent if
the plan is unknown. In a direct corporate workspace where it is absent, use the
live availability of the requested operational tools and let gateway execution
policy remain authoritative; do not report the whole workspace as disabled.
Don't delegate single-tool requests (one `http_check`, one log search) — handle
those inline.

## Error codes — agent action

| Code | Meaning | Action |
|------|---------|--------|
| `TRIAL_EXPIRED` | 30-day trial ended | Point to https://opsphere.io/pricing; do not retry or suggest re-login |
| `RATE_LIMIT_EXCEEDED` | Daily call limit hit | Show `details.resetsAt`; suggest `ops_my_usage`; do not retry automatically |
| `READ_ONLY_PLAN` | Community blocks mutating tools | Suggest upgrade; integration setup tools remain allowed |
| `SINGLE_ENVIRONMENT_ONLY` | Community allows one env per request | Ask the user to narrow scope or upgrade |
| `WORKSPACE_SUSPENDED` | Tenant/workspace suspended | Tell the user to contact support/admin — not an expired trial |
| `BROKER_LINK_LIMIT_EXCEEDED` | External workspace quota exceeded | Personal Workspace is included; additional links need Developer+ |
| `PERSONAL_WORKSPACE_UNLINK_FORBIDDEN` | Attempted to unlink Personal Workspace | Explain it is part of the account, cannot be unlinked |
| `PLAN_WORKSPACE_NOT_INCLUDED` | Feature/workspace not on plan | Upgrade guidance |
| `MACROS_PAID_ONLY` | Macro tools require Team+ | Upgrade guidance, or fall back to subagents/atomic tools |

### JSON-RPC execution denials

The gateway enforces execution policy on every `tools/call`. **Never** send policy fields (`tenant_id`, `plan`, `max_tool_calls`, `enabled_tools`, etc.) as tool arguments.

| Code | `data.reason` | Action |
|------|---------------|--------|
| `-32003` | `execution_policy_missing` | Policy not configured — tell user to contact admin, don't retry blindly |
| `-32003` | `execution_module_not_enabled` | Tool/module not on plan — suggest `ops_my_usage` or upgrade |
| `-32003` | `execution_sensitive_action_denied` | Pick a read-only alternative |
| `-32004` | `max_tool_calls` / `max_cost_units` / `max_macro_calls` | Budget exhausted — wait for `resetsAt`, don't spam retries |

## Datadog Synthetics (outage triage)

- `dd_synthetics_summary` = inventory + config status (`live`/`paused`), **not** pass/fail of the last run.
- `synthetics_summary_by_location(hours)` = regional execution up/down; if `dataQuality=no_execution_results_in_window`, do **not** claim 100% healthy.
- Failing or ambiguous test → `dd_synthetics_results(publicId|nameContains, from/to)`.

## Amazon Bedrock Agents (paid `aws` module)

For **Bedrock Agent**, **action group**, **knowledge base**, or **agent alias** issues (not **Agent Core** — clarify scope if mentioned):

1. Call `aws_bedrock_agent_diagnose` first (`agentId`, `region`).
2. For each Lambda in `lambdas[]`, call `aws_lambda_agent_diagnose` (`functionName`, same `region`).
3. If findings cite CloudWatch errors, use `aws_cloudwatch_logs_search` on the cited log group.
4. When listed in playbooks, use MCP prompt `investigate-bedrock-agent`.

## Integration credentials

Always use the `configure-integration` skill (`/opsphere:configure-integration`). Collect credentials one at a time, then call `ops_configure_integration(provider, credentials)` in a single tool call. Never ask the user to paste secrets into free-form chat, and never store them via `ops_set_work_context` or `memory_store`.

## Response presentation

Opsphere tools return human-readable markdown in `content[].text`. Parse it and answer in natural language — do not paste raw `{ "content": [...] }` JSON or wrap tool output in a `json` code block unless the user explicitly asks for raw/debug output.

## Reload after changes

After pulling plugin updates or editing files locally with `--plugin-dir`, run `/reload-plugins` before re-testing skills, agents, or the MCP connection.
