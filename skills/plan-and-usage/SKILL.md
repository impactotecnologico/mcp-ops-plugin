---
name: plan-and-usage
description: Show Opsphere plan, trial, daily and monthly usage, enabled tools, and integrations. Use when the user asks about their plan, usage, limits, trial, upgrade, or says "show my usage" / ops_my_usage.
---

# Plan and usage

## Tool

Call **`ops_my_usage`** (no parameters).

## Response presentation (mandatory)

**Never** paste the raw MCP tool envelope (`content`, `type`, JSON-RPC, or a `json` code block of the full tool result).

1. Read the markdown inside the tool's `text` field.
2. Reply in **natural language** with short sections (plan, usage today, monthly, tools, next steps).
3. Use bullets or a compact table — not a code fence unless the user explicitly asks for raw JSON or copy-paste debugging output.

### Good example

> You're on the **Community** plan (active, trial ends 16 Aug 2026 — 30 days left).
>
> **Today:** 10 / 100 tool calls (resets midnight UTC).
> **This month:** 10 calls.
> **Tools:** 31 MCP tools enabled · 0 integrations configured.
>
> Work context isn't set up yet — say *"set my work context"* if you want personalized defaults.
>
> Need more tools or unlimited daily calls? See [opsphere.io/pricing](https://opsphere.io/pricing).

### Bad example (do not do this)

Dumping `{ "content": [ { "type": "text", "text": "..." } ] }` or a `json` code block.

## After presenting usage

- If work context is **not configured**, offer `set-work-context`.
- If integrations are **0**, offer `configure-integration` for Datadog, AWS, GitHub, etc.
- On **Community**, mention read-only limits only when relevant to the user's next question.
- If the user asks to **enable K8s / ArgoCD / macros / other premium modules** in the admin portal while on **Community**: explain those modules are outside the Community allow-list. Point to [opsphere.io/pricing](https://opsphere.io/pricing). Do not suggest toggling them in admin Tools — the UI and API block it for non–platform admins.
