---
name: integration-status
description: Show which of your 8 integrations are active, which tools they unlock, and get a recommended next step to expand your coverage
---

# Integration Status

Check the current state of all Opsphere integrations and guide the user on what to configure next.

## Steps

### 1. Fetch current status

Call `ops_list_integrations` to retrieve the live state of all providers.

### 2. Present results clearly

Format the response as a status table. For each provider, show:

- **Configured** (✅): all required credentials are present. List the tools that are now usable.
- **Partial** (⚠️): some credentials are set but required ones are missing. Mention what is missing.
- **Not configured** (❌): no credentials set. Briefly describe what the user would gain by connecting it.

Example format:

```
✅ Datadog       — dd_logs_search, dd_errors_by_service, dd_errors_recent
✅ Vercel        — vercel_deploys_latest, vercel_project_status
❌ GitHub        — pipeline status, repo summary, Actions runs
❌ Bitbucket     — PR search, pipeline diagnosis
❌ Cloudflare    — DNS records, zone health
❌ Jira          — issue search, issue details
❌ Sentry        — error tracking, issue list
❌ AWS           — identity check, CLI queries

✅ Network tools — dns_lookup, http_check, cert_status (always available)
```

### 3. Suggest the next most valuable integration

- If **nothing is configured**: recommend starting with Datadog.
  > "I'd recommend starting with **Datadog** — it unlocks log search, error tracking, and synthetic monitoring. Say **'Configure my Datadog'** to get started."

- If **some are configured**: suggest the next most impactful unconfigured one based on what is missing. For example, if Datadog is set but Vercel is not:
  > "You already have Datadog connected. Want to add **Vercel** next? It would let you check deploy status directly from here."

- If **all are configured**: celebrate and remind the user of what is available.
  > "All integrations are connected. You have access to the full free-tier tool catalog. Try asking: 'Search Datadog logs for errors in the last hour' or 'Check my latest Vercel deploys'."

### 4. Offer to configure

After presenting the status, ask: "Would you like to configure any of these? Just say which provider and I will walk you through it."
