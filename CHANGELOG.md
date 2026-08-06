# Changelog

All notable changes to Opsphere will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.10] - 2026-08-06 (OAuth reconnect recovery)

### Changed
- `/opsphere-reconnect` now distinguishes terminal `invalid_grant` failures from rate limiting and transient network/server failures.
- Added explicit recovery paths for Cursor, Codex Desktop/ChatGPT, and Codex CLI, including post-login verification with `ops_my_usage`.
- Updated installation and troubleshooting guidance so recovery works even while the MCP server is disconnected.
- Cursor plugin **1.0.9 → 1.0.10**; Codex plugin **1.0.5 → 1.0.6** (`plugin.json`, `marketplace.json`, `package.json`).

## [1.0.9] - 2026-08-01 (Bedrock Agents documentation)

### Added
- **Amazon Bedrock Agents** (gateway `aws` module): document `aws_bedrock_agent_diagnose` and `aws_lambda_agent_diagnose` in [docs/TOOLS.md](docs/TOOLS.md); guided MCP prompt `investigate-bedrock-agent` in playbooks index.
- README discovery: Bedrock example prompts, AWS integration row, playbooks reference, and link to TOOLS.md.
- [`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc): Bedrock Agents flow (agent diagnose → Lambda diagnose → logs); example prompts; tool category row.
- [`commands/opsphere-welcome.md`](commands/opsphere-welcome.md): Bedrock agent example prompt.
- [`agents/ci-investigator.md`](agents/ci-investigator.md): cross-reference when user mentions Bedrock (not pure CI).

### Changed
- Cursor plugin **1.0.8 → 1.0.9**; Codex plugin **1.0.4 → 1.0.5** (`plugin.json`, `marketplace.json`, `package.json`).

### Note
- Bedrock diagnose tools execute on the **remote gateway** after `mcp-ops-b` deploy and tenant `aws` module enablement — this plugin release is documentation and agent guidance only.

## [1.0.8] - 2026-07-31 (New tools)

### Added
- **Cursor slash commands** `/link-account` and `/open-work-context` — parity with Codex `@link-account` / `@open-work-context` default prompts.
- **Connection Hub (multi-account broker):** skills [`link-account`](skills/link-account/SKILL.md) and [`open-work-context`](skills/open-work-context/SKILL.md) for Cursor and Codex; onboarding rules, [docs/TOOLS.md](docs/TOOLS.md#connection-hub-multi-account-broker), and [docs/INSTALL.md](docs/INSTALL.md#connection-hub-multi-account) updates; Hub MCP resources `opsphere://hub/active-context` and `opsphere://hub/connections` documented.
- **SonarQube conversational flows** (paid gateway module): `sq_projects_search` with SonarCloud URLs, `sq_last_scan_summary` for one-call last-scan snapshots; SonarQube provider section in [`skills/configure-integration/SKILL.md`](skills/configure-integration/SKILL.md); onboarding examples and [docs/TOOLS.md](docs/TOOLS.md) updates.
- **GitHub github.com**: `ghe_repo_summary` accepts `owner/repo` slug; github.com works with `GHE_TOKEN` only (no `GHE_BASE_URL`).
- **Railway integration** (gateway module; available on Community when enabled and configured): 17 read-only `railway_*` tools documented in [docs/TOOLS.md](docs/TOOLS.md) — projects, services, deployments, logs, metrics, env variable names, domains, volumes, health summary, and incident diagnosis. Provider setup in [`skills/configure-integration/SKILL.md`](skills/configure-integration/SKILL.md); onboarding table, prefix mapping, and example prompts in [`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc).
- **Algolia integration** (paid gateway module): `alg_*` Search API tools documented in [docs/TOOLS.md](docs/TOOLS.md); built-in `alg_status` / `alg_incidents` for global platform monitoring (no credentials). Provider setup in [`skills/configure-integration/SKILL.md`](skills/configure-integration/SKILL.md); onboarding table, prefix mapping, and example prompts in [`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc).

## [1.0.2] - 2026-07-20 (Codex plugin — OpenAI directory submission)

### Added
- Official public repository: [opsphere-io/opsphere-plugin](https://github.com/opsphere-io/opsphere-plugin) (sync from private `main` via `.github/workflows/sync-official.yml`).
- `@plan-and-usage` skill and enriched Codex marketplace SEO copy in `.codex-plugin/plugin.json`.

### Changed
- All public doc/repo links updated from `impactotecnologico/mcp-ops-plugin` → `opsphere-io/opsphere-plugin`.
- `SECURITY.md` vulnerability contact → `contact@opsphere.io`.
- CI: Gitleaks runs via MIT `gitleaks` CLI (org repos cannot use `gitleaks-action@v2` without `GITLEAKS_LICENSE`).
- [docs/PRE-PUBLISH-AUDIT.md](docs/PRE-PUBLISH-AUDIT.md) refreshed for OpenAI directory sign-off.

## [1.0.1] - 2026-07-17 (Codex plugin — `.codex-plugin/plugin.json`)

### Added
- [docs/CODEX-TEST-CASES.md](docs/CODEX-TEST-CASES.md) — seven E2E scenarios for OpenAI directory reviewers (OAuth, `ops_my_usage`, skills, re-auth).
- Demo Community account for reviewers (`demo@opsphere.io`) documented in test cases §5.

### Changed
- Codex plugin manifest **1.0.0 → 1.0.1** after CLI E2E sign-off (Fase 3).
- `.mcp.json` bundles `oauth.client_id`, `http_headers.User-Agent`, and `oauth_resource` for ChatGPT desktop (no CLI-only `config.toml` required).
- `.codex-plugin/plugin.json` adds `interface.websiteURL`, `developerName`, and `category` for the install surface.

## [1.0.0] - 2026-07-17 (Codex plugin initial — `.codex-plugin/plugin.json`)

### Added
- **Codex / ChatGPT plugin**: `.mcp.json`, eight skills (`@incident-investigation`, `@endpoint-health`, `@ci-investigation`, `@postmortem-writer`, plus existing integration/macro skills), `scripts/codex-install.sh` and `scripts/codex-mcp-config.sh`, CI validation for Codex manifests.

## [1.0.6] - 2026-07-15

### Added

- **MCP resources** — document the nine read-only gateway URIs (`opsphere://rules/operational`, `opsphere://tools/catalog`, `opsphere://playbooks/index`, `opsphere://tenant/account-context`, policies, severity taxonomy, critical assets) in [README.md](README.md), [`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc), [docs/TOOLS.md](docs/TOOLS.md#mcp-resources), and [`commands/opsphere-welcome.md`](commands/opsphere-welcome.md).
- **SonarQube guidance** (paid gateway module): `sq_*` prefix in onboarding provider mapping; Code Quality row in tool categories; SonarQube row in README integrations table; example prompt for quality-gate failures; reference to guided prompt `diagnose-sonarqube-quality-gate` in [docs/TOOLS.md](docs/TOOLS.md).

### Changed

- [`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc): clarifies when to fetch MCP resources vs call live tools (`deployment_status`, `macro_*`, atomic tools).
- Example prompts: GitLab pipeline diagnose alongside Bitbucket; SonarQube quality gate question.

## [1.0.5] - 2026-07-11

### Added

- **`configure-deployment-catalog` skill** — Community vs Team paths for deployment sources; links to `ops_set_work_context`, admin portal, and `deployment_status` gaps.
- [docs/TOOLS.md](docs/TOOLS.md): **`deployment_status`** section (multi-platform latest deploy, scopes, agent rules).
- Onboarding rule: **Latest deployment** section — any language → `deployment_status(scope=auto)` first; outage vs release distinction.

### Changed

- [`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc): Deployments category is multi-stack; `deployment_status` preferred over Vercel-only tools.
- [`skills/set-work-context/SKILL.md`](skills/set-work-context/SKILL.md): plan gate (Community only); deployment hints for ECS/S3/Vercel prose.
- [`docs/PLANS.md`](docs/PLANS.md): Community catalog includes `deployment_status`.
- [`commands/opsphere-welcome.md`](commands/opsphere-welcome.md): latest deployment example prompts.
- [`agents/ci-investigator.md`](agents/ci-investigator.md): deploy correlation via `deployment_status` when available.
- [`agents/outage-triage.md`](agents/outage-triage.md): deploy correlation prefers `deployment_status`; clarifies outage ≠ latest deployment.
- README: example prompts for multilingual latest-deploy queries.

## [1.0.4] - 2026-07-08

### Added

- **`ci-investigator` subagent** (`agents/ci-investigator.md`) — read-only GitHub Actions and Bitbucket pipeline diagnosis with structured root-cause reports (**Professional / Team / Enterprise**; Community receives upgrade guidance at `ops_my_usage` step 0).
- **`endpoint-health` subagent** (`agents/endpoint-health.md`) — single-host DNS + HTTP + TLS checks for **all plans**; optional TCP, DNSSEC, Cloudflare, Pingdom when in `tools/list`.
- **`postmortem-writer` subagent** (`agents/postmortem-writer.md`) — structured post-mortem / RCA for **all plans**; optional `memory_store` (`scope=incident`) after user approval.
- [docs/PLANS.md](docs/PLANS.md): subagent rows (outage triage, endpoint health, post-mortem writer, CI Investigator); Professional section.
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): CI Investigator blocked on Community.
- [docs/TOOLS.md](docs/TOOLS.md): `ghe_actions_diagnose` (paid); subagent notes under GitHub and Bitbucket.

### Changed

- **Subagents — ask the user:** all four agents (`outage-triage`, `endpoint-health`, `ci-investigator`, `postmortem-writer`) prompt for missing hostname, env, repo, timeline, or impact (2–4 questions per turn; no invented facts).
- Onboarding rule ([`rules/onboarding-guide.mdc`](rules/onboarding-guide.mdc)): subagent delegation for **endpoint-health** and **postmortem-writer** (all plans); **ci-investigator** plan gating; `ops_my_usage` before premium delegate when plan unknown.
- README: dedicated **Subagents** and **Rules, skills & commands** sections; example prompts for all subagents; Community plan subagent list.
- `/opsphere-welcome`: all four subagents plus integration example prompts.
- README screenshot caption: ~30 tools (was outdated "33 tools").

## [1.0.3] - 2026-07-05

### Added

- **`outage-triage` subagent** (`agents/outage-triage.md`) — read-only site-down and incident triage with structured evidence and verdict.
- Onboarding rule: delegate multi-step outages to `outage-triage`.

### Removed

- Internal **CodeGraphContext** rule and `.cgcignore` — maintainer-only; not part of the public thin-client bundle.

### Changed

- Merge `main` (AWS docs, CI checklist, security docs) with Community plans release.
- Version bump to **1.0.3** for publish (`v1.0.2` tag already existed on another commit).

## [1.0.2] - 2026-07-05

### Added

- **Commercial plans doc:** [docs/PLANS.md](docs/PLANS.md) — Community vs Professional vs Team vs Enterprise.
- Onboarding rule: `READ_ONLY_PLAN` and `SINGLE_ENVIRONMENT_ONLY` error handling.
- `ops_my_usage` docs: monthly usage, enabled tool count, plan display names.
- **CI submission checklist:** `ci-validate.sh` validates commands/skills frontmatter, logo files, manifest path hygiene, and version sync between `plugin.json` and `marketplace.json`.
- **MCP governance** note in [docs/SECURITY-AND-TRUST.md](docs/SECURITY-AND-TRUST.md) (enterprise blocklist behavior).
- **Network tools policy** in [SECURITY.md](SECURITY.md) — gateway-only execution, rate limits, legitimate SRE use.
- README AWS section: IAM key setup (not SSO), example prompts for `aws_cli_query`.
- `configure-integration` skill: AWS verification checklist and post-setup query guidance.

### Changed

- README Community section: ~30 tools, ~215 full catalog (was outdated "139 tools").
- `ops_my_usage` description aligned with gateway output.
- `/opsphere-welcome` command: AWS setup and S3 example prompts.

## [1.0.1] - 2026-06-09

### Added

- **`/opsphere-welcome`** command — user-invoked quick start (replaces auto shell hook).
- **Security & Trust documentation** for marketplace review: expanded [SECURITY.md](SECURITY.md), [docs/SECURITY-AND-TRUST.md](docs/SECURITY-AND-TRUST.md) (submission copy-paste), retention/isolation sections in [docs/PRIVACY.md](docs/PRIVACY.md), README Security & Trust table with links to privacy/terms.
- **Credential handling:** PRIVACY/README clarify secrets go **only** via `ops_configure_integration` (never plugin repo/Cursor files); onboarding rule + configure-integration skill reinforce no free-form secret paste; SECURITY docs describe gateway encryption, masked list, audit trail for reviewers.
- **Remote MCP architecture:** [docs/REMOTE-MCP-ARCHITECTURE.md](docs/REMOTE-MCP-ARCHITECTURE.md) (flow diagrams, single endpoint `mcp-cursor.opsphere.io`); marketplace/plugin descriptions updated to "thin client; all tools on gateway"; SECURITY-AND-TRUST flag #3 for reviewers.
- **Clean bundle (flags #5–6):** SECURITY-AND-TRUST + README cite Cursor security agent (*no secrets, no install hooks, no exfiltration*); CI badge and explicit links to [`scripts/ci-validate.sh`](scripts/ci-validate.sh) + Gitleaks ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)); `ci-validate.sh` checks npm lifecycle hooks and `scripts/` allowlist.
- **Publisher compliance:** incident notification to Cursor (`legal@cursor.com`); user reports via `security-reports@cursor.com`; no use of plugin data for model training (PRIVACY + SECURITY-AND-TRUST).
- **Local install testing** instructions in [docs/INSTALL.md](docs/INSTALL.md) (`~/.cursor/plugins/local/opsphere`).
- **Work context onboarding**: `set-work-context` skill, Step 3.5 in `/opsphere-setup`, `ops_set_work_context` and `ops_get_work_context` tools.
- Gateway injects tenant account context on MCP `initialize` (default account + index of others).
- MCP resource `opsphere://tenant/account-context` for full per-account context.
- **Operational memory** documented in `onboarding-guide` rule and `docs/TOOLS.md`:
  `memory_search`, `memory_store`, `memory_session_touch`, `memory_invalidate`.
- Agent guidance: when to search/store/invalidate memory; quick selection table; catalog duplicate guard (`catalog_context_duplicate`).
- Example prompts for recall and saving investigation summaries.

### Removed

- `hooks/hooks.json` (`workspaceOpen` → `check-auth.sh`) — no automatic shell execution on workspace open (marketplace security review).
- `scripts/check-auth.sh` — welcome text lives in `/opsphere-welcome` and README instead.

## [1.0.0] - 2026-05-19

### Added

- Cursor Marketplace plugin with remote MCP server connection to the Opsphere gateway.
- Account creation and login via `/opsphere-setup` command (signup/login/refresh via gateway API).
- Conversational integration setup for 8 providers: Datadog, Vercel, GitHub Enterprise,
  Bitbucket, Cloudflare, Jira, Sentry, and AWS (`configure-integration` skill).
- Always-applied `onboarding-guide` rule — AI context for available tools, integration triggers,
  error handling (`TRIAL_EXPIRED`, `RATE_LIMIT_EXCEEDED`), and example prompts.
- `/integration-status` command to check connected services and suggest next steps.
- Welcome message on workspace open (`workspaceOpen` hook → `scripts/check-auth.sh`).
- `mcp.json` remote MCP configuration with OAuth2 Connect flow (`auth.CLIENT_ID`).
- Operational tools across 10 provider modules (up to 2 tools per provider in free tier).
- Network diagnostics (`dns_lookup`, `http_check`, `cert_status`) — available immediately
  after login with no integration setup required.
- 30-day free trial with 100 daily tool calls (configurable via `FREE_DAILY_TOOL_LIMIT` env).
- `TRIAL_EXPIRED` (HTTP 403) gateway enforcement when a free tenant's trial has expired.
- `RATE_LIMIT_EXCEEDED` (HTTP 429) gateway enforcement after the daily call limit is reached,
  with `details.resetsAt` (midnight UTC) in the response body.
- Usage nudge appended to tool responses when above 80% of the daily limit.
- `ops_my_usage` tool — shows plan name, trial end date, days remaining, daily usage
  (used/limit/resetsAt), configured integrations count, and upgrade link.
- Plugin manifest (`.cursor-plugin/plugin.json`) with full marketplace metadata.
- Documentation: `docs/INSTALL.md`, `docs/TOOLS.md`, `docs/TROUBLESHOOTING.md`.
- MIT license.
