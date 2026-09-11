---
name: execution-budget
description: Show the current Cursor investigation budget, remaining capacity, and reset time for the authenticated user and active workspace
---

# Execution budget

Call `ops_execution_budget` with no parameters.

- This capability is available on Team and Enterprise workspaces when advertised.
- Present status, used and available tool calls, cost units, macros, retries, and the reset time in concise natural language.
- Treat the result as informational. Never send tenant, user, session, plan, profile, limit, or policy fields in tool arguments.
- Never claim the budget is global: it is scoped by the gateway to the authenticated user, active workspace, runtime, and MCP session.
- If the tool is absent or the gateway denies it for the plan, explain that execution-budget inspection is unavailable on the current plan; do not infer zero remaining budget.
- If the budget is exhausted, do not retry operational calls. Tell the user when it resets and suggest reducing the investigation scope after reset.

**Claude Code:** invoke this command as `/opsphere:execution-budget`.
