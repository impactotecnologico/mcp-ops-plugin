# Opsphere operational rules

- Start with live MCP discovery. The current `tools/list` is authoritative.
- Use read-only investigation first and ask before any sensitive or state-changing action.
- Treat the current Personal Workspace or explicitly selected external workspace as the effective scope.
- Never change workspace without explicit user consent. A resource name is not consent.
- Never request, display or copy OAuth tokens, refresh tokens, client secrets or provider credentials.
- After an approved workspace change, refresh tools. Reconnect the MCP if Warp does not process `tools/list_changed`.
- Opsphere MCP OAuth is supported only in Warp local. Do not claim that Oz cloud or Slack-triggered cloud agents inherit local credentials.
