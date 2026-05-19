# Changelog

All notable changes to Opsphere will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.2.0] - 2026-05-19

### Added

- `ops_my_usage` tool: shows plan, trial end date, days remaining, daily usage
  (used/limit/resetsAt), configured integrations count, and upgrade link.
- Trial expiration enforcement: gateway returns `TRIAL_EXPIRED` (HTTP 403) when
  a public_free tenant's 30-day trial has expired — blocks all `/mcp` methods.
- Rate limiting: gateway returns `RATE_LIMIT_EXCEEDED` (HTTP 429) after 100
  tool calls/day for free tenants, with `details.resetsAt` in the response.
- Usage nudge: tool responses above 80% of daily limit include a brief note
  with current usage and upgrade link (not shown on setup/meta tools).
- Rule updates: `TRIAL_EXPIRED`, `RATE_LIMIT_EXCEEDED`, and `ops_my_usage`
  sections are now active (previously marked as "activates in Sprint 4").

## [0.1.0] - 2026-05-19

### Added

- Cursor Marketplace plugin with remote MCP server connection to the Opsphere gateway.
- Account creation and login via `/opsphere-setup` command (signup/login via gateway API).
- Conversational integration setup for 8 providers: Datadog, Vercel, GitHub Enterprise,
  Bitbucket, Cloudflare, Jira, Sentry, and AWS (`configure-integration` skill).
- Always-applied `onboarding-guide` rule providing AI context about available tools,
  integration setup triggers, error handling (TRIAL_EXPIRED, RATE_LIMIT_EXCEEDED),
  and example prompts.
- `/integration-status` command to check connected services and get next-step suggestions.
- Welcome message on workspace open (`workspaceOpen` hook → `scripts/check-auth.sh`).
- `mcp.json` remote MCP server configuration using `${input:opsphere-token}` variable substitution.
- Operational tools across 10 provider modules (max 2 tools per provider in free tier).
- Network diagnostics (`dns_lookup`, `http_check`, `cert_status`) available immediately
  after login — no integration setup required.
- Plugin manifest (`.cursor-plugin/plugin.json`) with full marketplace metadata.
- Documentation: `docs/INSTALL.md`, `docs/TOOLS.md`, `docs/TROUBLESHOOTING.md`.
- MIT license.
