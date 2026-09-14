---
description: Show which integrations are configured, available to connect on your plan, require upgrade, or are unavailable — and suggest a safe next configure step
---

# Integration Status

Check the current state of Opsphere integrations using the **live** gateway response. Do not assume every catalog provider is configurable.

## Steps

### 1. Fetch current status

Call `ops_list_integrations` to retrieve the live state of providers for this account/plan.

Also read `runtime_status` when present. It is workspace-scoped and distinguishes credentials from runtime facts that the summary alone cannot prove:

- AWS `aws` versus `aws-sessions` module enablement, Cloud Catalog setup, and caller session state.
- GitHub module/token state and whether a default org comes from credentials or Cloud Catalog.

For providers with `auth_dependency`, use that field too. Confluence inherits Jira authentication: when its Jira dependency is satisfied, report Confluence authentication as configured even if Confluence has no separate token keys.

### 2. Present results from the response groups

Use `summary` (and each entry’s `status` / `configure_cta`) — do **not** invent entitlement:

- Configured — `summary.configured`
- Available to connect — `summary.available_to_connect`
- Requires upgrade — `summary.requires_upgrade`
- Unavailable / beta — `summary.unavailable_beta`
- Configured but unavailable — `summary.configured_unavailable`

Do not translate `runtime_status.aws.modules.aws_sessions = disabled/not_assigned` into "AWS credentials are broken". Likewise, a missing GitHub default org is a routing gap, not proof that the token is invalid.

### 3. Suggest the next configure step (CTA rules)

- Offer **"Configure my [Provider]"** **only** for providers in `summary.available_to_connect` (or entries with `configure_cta: true`).
- Never offer that CTA for `upgrade_required`, `beta`, `enterprise_only`, or `configured_unavailable`.
- Prefer `summary.configure_hint` when present.

### 4. Offer to configure

After presenting status, ask only about providers that are actually available to connect.
