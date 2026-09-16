# Opsphere operational rules

- Start with live MCP discovery for public definitions, not authorization. Check `ops_my_usage` for catalog mode and active workspace availability.
- Use read-only investigation first and ask before any sensitive or state-changing action.
- Treat the current Personal Workspace or explicitly selected external workspace as the effective scope.
- Never change workspace without explicit user consent. A resource name is not consent.
- Never request, display or copy OAuth tokens, refresh tokens, client secrets or provider credentials.
- In stable catalog mode, approved workspace changes require no tool refresh or reconnect. The list is independent of the workspace; credentials, enabled tools, plan and permissions still apply on every call. Only legacy stale discovery or a new product/schema release may require a catalog reload. Never force Personal to obtain a larger list.
- Opsphere MCP OAuth is supported in local Antigravity IDE and CLI. Complete CIMD OAuth in this client. Do not copy credentials from Cursor, Codex, Claude Code, Warp or OpenCode.
- Do not add a second Opsphere server named opsphere in native MCP settings when this plugin is installed. Duplicate entries double the tool catalog.
- Do not ship or invent a default `disabledTools` list. Gateway plan, workspace and credentials still authorize every call. If a session hits context limits, the user may hide unused provider prefixes locally.
- For feature validation or suspected defects, use `qa-test-investigation`; start with `qa_catalog_get` when available, distinguish proposed, blocked, passed and failed tests, and never execute discovered commands or stateful business journeys.
- For promotion or go-live decisions, use `qa-release-readiness`; tie every required result to the same immutable release, workspace and environment before recommending Go. `READY_WITH_UNCONFIRMED_POLICY` is not an unconditional approval.
- QA discovery is tenant-agnostic. Never infer a repository by name; require an explicit user choice before persisting an ambiguous source with `qa_source_confirm`.
