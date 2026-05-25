# Changelog

All notable changes to Opsphere will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
