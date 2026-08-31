---
name: opsphere-onboarding
description: Get started with Opsphere in Warp local; discover tools, account and workspace without changing configuration.
---

# Opsphere in Warp local

Use live MCP discovery, then `ops_my_usage` and `ops_accounts_list` to identify the active workspace and plan. Personal Workspace availability does not mean it is currently selected. Do not expose internal IDs unless diagnosing a mismatch.

If disconnected, read the installed `connect-another-client` skill and its reference. Never copy tokens from another app. Installing a skill does not install or authorize MCP.

Ask what the user wants to do. For integration setup use `configure-integration`; for provider/account notes use `set-work-context`. For an operational investigation choose the installed incident, endpoint, CI or postmortem skill. A listed tool may still require credentials; respect its live eligibility and errors.

Keep the active workspace unless the user explicitly requests a change. Start with read-only diagnostics; ask before state-changing operations. Do not manually pass or invent a `context_id` for normal operations.

The package supports Warp local. Local credentials are not cloud workload identity; do not promise Opsphere support in cloud agents.
