# Opsphere in Cursor Automations

Cursor Automations must use the dedicated Opsphere MCP resource:

`https://mcp-cursor.opsphere.io/mcp/automation`

The normal Cursor plugin continues to use `https://mcp-cursor.opsphere.io/mcp` and remains interactive. Do not replace the plugin URL or reuse its authorization for an automation.

## Configure an automation

1. In the Cursor Automation, add or reconnect an MCP server named `opsphere-automation` using the dedicated URL above.
2. Complete a new browser OAuth authorization for that server. Do not copy a token, session id, API key, or header from the normal Opsphere plugin.
3. Keep the normal `opsphere` plugin connection unchanged for IDE conversations.
4. Run **Test** once. Test is a real automation run and consumes the same per-run and daily capacity as a scheduled or triggered run.

The automation resource is available only when the active workspace has an effective `automation` policy (normally Team or Enterprise). Community and Developer workspaces fail closed. Connection Hub users must open an eligible work context before the run starts.

## Prompt guard

Place this at the start of the automation instructions:

> Call `ops_execution_budget` before operational work. Continue only when the authoritative result reports `workload_type: automation`, `classification.entitlement_valid: true`, and `classification.run_session_valid: true`. Otherwise stop and report that the Opsphere Automation MCP connection must be configured or reauthorized. Never infer or claim a different workload. If any budget denial returns `terminal_for_run: true`, preserve the partial result and stop without waiting, retrying, or opening another session.

This text verifies the connection; it does not activate or enlarge the profile. The gateway derives the workload from the OAuth resource, validates the grant and current PostgreSQL policy, and creates a separate opaque `Mcp-Session-Id` for every Test, cron, webhook, or manual trigger.

## Expected budget

- Team normally resolves `automation_standard`.
- Enterprise normally resolves `automation_extended`.
- Tenant customizations may only reduce the plan ceiling.
- Automation never enables additional tools or sensitive actions.
- Per-run capacity is isolated by workspace, user, runtime, workload and run session.
- Daily automation capacity is shared by the same workspace, user, runtime, workload and UTC day.

If `ops_execution_budget` reports `interactive`, stop: the Automation is connected to the normal `/mcp` resource or is reusing its old authorization. Reconnect the dedicated `/mcp/automation` server and test again.

