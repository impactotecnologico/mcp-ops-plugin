---
name: execution-budget
description: Show the current Cursor investigation budget, remaining capacity, and reset time for the authenticated user and active workspace
---

# Execution budget

Call `ops_execution_budget` with no parameters.

- This capability is available on Team and Enterprise workspaces when advertised.
- Present workload, status, per-run usage and remaining calls, cost units, macros, retries, plus daily runs/calls/cost and both reset times when supplied.
- Treat the result as informational. Never send tenant, user, session, plan, profile, limit, or policy fields in tool arguments.
- Never claim the budget is global: per-run capacity is scoped to the authenticated user, active workspace, runtime, workload and MCP session; daily automation capacity is scoped to the authenticated user, active workspace, runtime, workload and UTC day.
- If the tool is absent or the gateway denies it for the plan, explain that execution-budget inspection is unavailable on the current plan; do not infer zero remaining budget.
- If `terminal_for_run=true`, do not retry operational calls or wait in the run. Return the useful partial result and tell the user which limit stopped it and when the relevant window resets.

**Claude Code:** invoke this command as `/opsphere:execution-budget`.
