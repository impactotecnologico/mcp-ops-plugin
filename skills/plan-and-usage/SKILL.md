---
name: plan-and-usage
description: Show Opsphere plan, trial, usage, Personal Workspace, Work Context, and integrations. Use for plan/usage/limits/upgrade or ops_my_usage.
---

# Plan and usage

## Tool

Call **`ops_my_usage`** (no parameters).

## Response presentation (mandatory)

**Never** paste the raw MCP tool envelope (`content`, `type`, JSON-RPC, or a `json` code block of the full tool result).

1. Read the markdown inside the tool's `text` field.
2. Reply in **natural language** with short sections.
3. Use bullets or a compact table — not a code fence unless the user explicitly asks for raw JSON.

### Present these concepts separately

| Section | How to phrase |
|---------|----------------|
| Connection | Opsphere **connected** |
| Plan | e.g. Community (trial days if present) |
| Personal Workspace | **Active** (automatic — not blocked by Work Context) |
| Work Context | Configured / not configured — optional provider notes |
| External workspaces | Community: included Personal Workspace; additional links need upgrade |
| Integrations | Count / list next actions (Connect AWS, Datadog, …) if zero |
| Daily / monthly usage | From tool text |

### Good example

> You're **connected** on **Community** (trial ends 16 Aug 2026 — 30 days left).
>
> **Personal Workspace:** Active  
> **Work context:** Not configured — add details about the systems you usually work with anytime.  
> **Additional workspaces:** Your Personal Workspace is included; linking more requires Developer or higher.
>
> **Today:** 10 / 100 tool calls (resets midnight UTC).  
> **Integrations:** none yet — say _"Configure my Datadog"_ when ready.
>
> Need more capacity or external workspaces? See [opsphere.io/pricing](https://opsphere.io/pricing).

### Bad example (do not do this)

- Dumping raw MCP JSON
- Saying **"31 MCP tools enabled"** / **"20 MCP tools enabled"** / inventing a public tool count
- Implying Work Context "not configured" means Personal Workspace is broken
- Showing "0/0" external links without the upgrade explanation

## After presenting usage

- If Work Context is not configured, optionally offer `set-work-context` (does not block tools).
- If integrations are 0, offer `configure-integration` for providers allowed on the plan.
- On Community, do not promise Developer features unless plan status shows Developer is active.
- If the user asks to enable K8s / ArgoCD / macros on Community: those are outside Community — point to pricing.
