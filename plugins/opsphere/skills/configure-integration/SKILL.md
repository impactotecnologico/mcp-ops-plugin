---
name: configure-integration
description: Connect an eligible provider (Datadog, Vercel, GitHub, Cloudflare, Jira, Confluence, Sentry, Bitbucket, GitLab, Railway, …) when ops_list_integrations marks it available_to_connect — step-by-step guided setup from the chat. AWS is excluded (Cloud Catalog admin only). Use when the user wants to add, configure, or reconnect a provider that is configure_cta-eligible, or when a tool reports missing credentials for an eligible module.
---

# Configure Integration

This skill guides users through connecting their third-party services to Opsphere.
It uses four MCP tools from the backend:

- `ops_configure_integration(provider, credentials)` — **the only tool that persists integration secrets** on the gateway (encrypted, tenant-scoped)
- `ops_list_integrations()` — shows configured vs available-to-connect vs upgrade/beta (masked previews only) for the **active work context**; **trust this response for entitlement**
- `ops_test_integration(provider)` — verifies credentials actually work on that same workspace
- `ops_remove_integration(provider)` — removes all credentials for a provider

> **Work context:** On Connection Hub, list/test/configure apply to the open workspace (Personal Workspace by default, or a linked tenant after `/open-work-context`). Open the right context before guiding setup.

> **Security:** Collect credentials one at a time in conversation, but pass them to the gateway **only** in `ops_configure_integration`. Do not ask users to paste keys in unrelated messages, work context, or memory.

> **Integrations ≠ admin MCP modules.** Configuring Datadog/GitHub/etc. here stores credentials so existing plan tools can call those APIs. It does **not** enable premium MCP modules (Kubernetes, ArgoCD, macros, …). Module eligibility is controlled by the subscription plan; Team+ admins manage modules in the admin portal Tools page.

> **Entitlement:** Always call `ops_list_integrations` first. Only guide "Configure my [Provider]" for entries with `configure_cta: true` / `summary.available_to_connect`. If status is `upgrade_required`, `beta`, or `enterprise_only`, explain that — do not collect credentials as if setup were allowed now.

> **AWS exception:** AWS is never `configure_cta`. Accounts and keys (or SSO) live in **Admin → Cloud Catalog**. Verify with `ops_test_integration(provider: "aws", profile: "...")` and SSO login tools when needed — see [Provider: AWS](references/providers.md#provider-aws).

## General Flow

1. **Check current status**: Call `ops_list_integrations` to see what is already configured **and** what is eligible to connect on this plan.
2. **Identify the provider**: Determine which provider the user wants to configure. If it is not in `available_to_connect`, stop and explain upgrade/unavailable — do not start credential collection.
3. **Explain what is needed**: Tell the user which credentials are required and how to obtain them.
4. **Collect credentials**: Ask for each value conversationally — one prompt per credential, not all at once.
5. **Configure**: Call `ops_configure_integration` once with all credentials as a map.
   > **Important**: pass all keys for the provider in a single call, not one call per key.
6. **Verify**: Call `ops_test_integration(provider)` to confirm the connection works.
7. **Confirm**: Tell the user which tools are now available.

---

## Provider Setup

Provider-specific credential steps live in [references/providers.md](references/providers.md). Read **only** the section for the provider being configured (headings `## Provider: <Name>`): Datadog, Vercel, GitHub Enterprise, Bitbucket, GitLab, Cloudflare, Jira, Xray, Confluence, Sentry, SonarQube, AWS, Algolia, Railway.

---

## Handling "Missing Credentials" Errors

If a user tries a tool and gets an error about missing credentials or an unconfigured integration:

1. Identify the provider from the error or the tool name prefix (`dd_` → Datadog, `vercel_` → Vercel, `railway_` → Railway, `ghe_` → GitHub, `bb_` → Bitbucket, `gl_` → GitLab, `sq_` → SonarQube, `cf_` → Cloudflare, `jira_` → Jira, `xray_` → Xray, `sentry_` → Sentry, `alg_` → Algolia Search API, `aws_` → AWS). **`alg_status` and `alg_incidents` never require credentials** — if those fail, it is not a missing-integration error.
2. Call `ops_list_integrations` to confirm the provider is not configured.
   Inspect `runtime_status` too: credential state is not the same as module enablement, Cloud Catalog setup, AWS session state, or GitHub default-org routing.
3. Offer to set it up: "It looks like [Provider] is not configured yet. Would you like me to help you connect it?"
4. Follow the provider-specific steps in [references/providers.md](references/providers.md).

---

## Removing an Integration

If the user wants to disconnect a provider:

1. Call `ops_remove_integration(provider: "<name>")`.
2. Confirm: "The [Provider] integration has been removed. Its tools will not work until you reconfigure it."
3. Note: the change takes effect on the next tool call (the session reconnects automatically with updated credentials).

---

## Check Your Usage

To see your plan status, remaining trial days, and daily tool call usage:

> "Show my Opsphere usage"

The agent will use `ops_my_usage` to display your current plan details.
