# Changelog

All notable changes to Opsphere will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **CI submission checklist:** `ci-validate.sh` validates commands/skills frontmatter, logo files, manifest path hygiene, and version sync between `plugin.json` and `marketplace.json`.
- **MCP governance** note in [docs/SECURITY-AND-TRUST.md](docs/SECURITY-AND-TRUST.md) (enterprise blocklist behavior).
- **Network tools policy** in [SECURITY.md](SECURITY.md) — gateway-only execution, rate limits, legitimate SRE use.

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
