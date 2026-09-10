---
name: integration-status
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

| Group | Field | Meaning |
|-------|--------|---------|
| Configured | `summary.configured` | Credentials present and usable on the current plan |
| Available to connect | `summary.available_to_connect` | Plan/lifecycle eligible, still missing credentials |
| Requires upgrade | `summary.requires_upgrade` | GA provider known but not in the current plan |
| Unavailable / beta | `summary.unavailable_beta` | Not offered as a normal configure-now capability |
| Configured but unavailable | `summary.configured_unavailable` | Credentials exist but plan/lifecycle currently blocks use |

Do not translate `runtime_status.aws.modules.aws_sessions = disabled/not_assigned` into "AWS credentials are broken". Likewise, a missing GitHub default org is a routing gap, not proof that the token is invalid.

For Confluence, a 403 from a tool means Atlassian denied product/space/page access; it is not evidence that the integration is unconfigured. A 404 can mean a missing or permission-hidden page/space.

Example presentation:

```
Configured
✅ Datadog

Available to connect now
• Vercel, GitHub, Cloudflare, …

Requires upgrade
• Akamai, Pingdom, … (do not say “configure now”)

Unavailable / beta
• SonarQube, … (omit configure CTA)
```

### 3. Suggest the next configure step (CTA rules)

- Offer **"Configure my [Provider]"** **only** for providers in `summary.available_to_connect` (or entries with `configure_cta: true`).
- Never offer that CTA for `upgrade_required`, `beta`, `enterprise_only`, or `configured_unavailable`.
- If `available_to_connect` is empty and `requires_upgrade` is non-empty, explain upgrade — do not walk the user through credentials for those providers.
- Prefer `summary.configure_hint` when present.

### 4. Offer to configure

After presenting status, ask only about providers that are actually available to connect — e.g. "Would you like to configure one of the providers listed under available to connect?"

**Claude Code:** invoke this command as `/opsphere:integration-status`.
