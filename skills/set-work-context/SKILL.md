---
name: set-work-context
description: Capture or update what the user usually works with so Opsphere can personalize DevOps assistance. Use after signup, when ops_my_usage shows work context not configured, or when the user asks to update their stack context.
---

# Set Work Context

Help the user describe their operational environment in plain language. This is **not** credential setup — use `configure-integration` for API keys.

## Tools

- `ops_set_work_context(context)` — save context (**Community / free-tier plugin accounts only**)
- `ops_get_work_context()` — read full context (all cloud accounts)
- `ops_my_usage()` — check `Work context` status and **Catalog configuration** (`plugin` vs `admin_portal`)

On MCP connect, the gateway injects a **summary** (default account + index of others) into server instructions. Use `ops_get_work_context` or resource `opsphere://tenant/account-context` for non-default accounts.

## Plan gate (mandatory)

Call `ops_my_usage` before `ops_set_work_context` if plan is unknown.

- **`catalog_config_surface: plugin`** and **`work_context_editable_via_plugin: yes`** → proceed with `ops_set_work_context`.
- **`admin_portal`** or **`work_context_editable_via_plugin: no`** → **do not** call `ops_set_work_context`. Use skill **`configure-deployment-catalog`** and direct the user to their admin at **https://admin.opsphere.io**.

Team/Enterprise users who try anyway get `WorkContextForbiddenError`: _"Contact your admin to update catalog context."_

## When to run

1. After `/opsphere-setup` Step 3 if `ops_my_usage` shows work context **not configured yet**.
2. When the user says "update my context", "I now work with…", or similar.
3. **Do not** block other work if the user skips — they can configure later.

## Conversation script

Ask once:

> "To help me assist you better, tell me what you usually work with: projects, cloud providers (Datadog, Vercel, AWS…), environments, naming conventions, on-call teams, etc. Write freely — no API keys."

Wait for their answer, then call:

```
ops_set_work_context(context: "<user text>")
```

Confirm briefly and suggest the next step (e.g. "Configure my Datadog").

## Good examples

- "SaaS on Vercel + Datadog. Prod project `acme-storefront-prod`. Jira project PROJ. No Kubernetes."
- "AWS eu-west-1, ECS service `web` on cluster `acme-prod`. Bitbucket workspace `acmecorp`. Escalate prod issues to #platform-oncall."
- "Static site: S3 bucket `ug-static-prod` behind CloudFront. No Vercel."

Mentioning Vercel project names, CI repos, S3 buckets, or ECS services here helps **`deployment_status`** even before structured Deployment sources exist (Team admins configure JSON in admin portal).

## After saving context

Suggest: _"Ask me for the latest deployment"_ → agent should call **`deployment_status(scope=auto)`**. If gaps remain, run **`configure-deployment-catalog`** skill.

## Avoid

- Pasting API keys, passwords, or tokens — `ops_set_work_context` rejects obvious secrets.
- Duplicating the same text in `memory_store` later (use memory for session-specific findings only).

## Updating

Call `ops_set_work_context` again with the full revised text (it replaces the previous default-account context).
