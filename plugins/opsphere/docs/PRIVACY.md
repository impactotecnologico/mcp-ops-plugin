# Privacy — Opsphere Cursor Plugin

## What this plugin is

The Opsphere plugin is a **client configuration bundle** for Cursor: rules, skills, commands, and an `mcp.json` entry pointing at the Opsphere remote MCP gateway. It does not run a backend on your machine.

## Data sent to Opsphere

When you use Opsphere tools through Cursor:

| Data | When | Purpose |
|------|------|---------|
| OAuth access / refresh tokens | After you click **Connect** | Authenticate MCP requests to the gateway |
| Tool call parameters | Each tool invocation | Execute the requested operation (e.g. DNS lookup, log query) |
| Integration credentials | When you run **`ops_configure_integration`** during setup | Store encrypted credentials for your tenant (Datadog, Vercel, AWS, etc.) |
| Usage metadata | Each tool call | Enforce plan limits, billing, and abuse prevention |

Opsphere does **not** receive your Cursor source code unless you paste it into chat yourself.

## How integration credentials are collected

Third-party API keys (AWS, Datadog, GitHub PATs, etc.) are sent to Opsphere **only** through the MCP tool **`ops_configure_integration`** during a guided setup flow — not by writing them into this repository or into plugin files.

| Location | Are integration secrets stored? |
|----------|--------------------------------|
| This plugin repo / marketplace bundle | **Never** |
| Your Cursor workspace or `.cursor` folder | **Never** (plugin has no local credential store) |
| Cursor chat history | Avoid pasting secrets in free-form messages — use the integration flow (see below) |
| Opsphere gateway (your tenant only) | **Yes** — encrypted at rest, HTTPS in transit |

**Recommended flow:** say _"Configure my Datadog"_ → agent runs the `configure-integration` skill → you provide each value when asked → agent calls `ops_configure_integration(provider, credentials)` once per provider. Do **not** paste API keys in unrelated chat messages, work-context text (`ops_set_work_context`), or memory (`memory_store`).

## What stays local

- Your IDE workspace and files
- OAuth tokens managed by Cursor (not written into this plugin repo)
- Integration secrets — **never** stored in the plugin folder, manifest, or this Git repository

## Credential storage (gateway — not in this repo)

Integration API keys and tokens are stored **encrypted at rest on Opsphere servers**, isolated per account (strict `tenant_id` scoping — no cross-tenant access). They are transmitted only over HTTPS when `ops_configure_integration` runs. Values are not written to the plugin bundle, not returned by `ops_list_integrations` (masked previews only), and not logged in plaintext on the gateway.

## Retention & deletion

| Data | How long | How to delete |
|------|----------|---------------|
| Integration credentials | Until you remove them or delete your account | `ops_remove_integration` or [contact@opsphere.io](mailto:contact@opsphere.io) |
| OAuth sessions | Until disconnect, expiry, or security revoke | Cursor Settings → MCP → disconnect Opsphere |
| Usage metadata | Rolling retention (~90 days) | Automatic |
| Work context / memory (if enabled) | Until updated or account deletion | Overwrite via tools or email support |

Suspended free-trial accounts may have credentials purged after a grace period. See [SECURITY.md](../SECURITY.md#retention--deletion) for the full policy.

## Data processors & model training

| Processor | Role |
|-----------|------|
| **Opsphere gateway** (`mcp-cursor.opsphere.io`) | OAuth validation, tool execution, encrypted credential storage, usage limits |
| **Cursor** | OAuth token storage after you click Connect (managed by Cursor, not this plugin) |
| **Third-party providers you configure** | Datadog, Vercel, AWS, GitHub, etc. — contacted **only** by the gateway when you invoke tools for that provider |

Opsphere does **not** sell or transfer plugin or account data to third parties for advertising. We do **not** use plugin data, tool parameters, credentials, or chat content sent through Opsphere for **AI model training** (Cursor Marketplace Publisher Terms §6.3).

## Revoking access

1. **Disconnect MCP**: Cursor Settings → MCP → disable or remove Opsphere.
2. **Sign out / rotate OAuth**: use Cursor’s MCP reconnect flow or revoke the Opsphere application in your account settings when available at [opsphere.io](https://opsphere.io).
3. **Remove integrations**: in chat, ask to remove a provider or use integration management tools (`ops_remove_integration`).
4. **Delete account**: contact [contact@opsphere.io](mailto:contact@opsphere.io).

## Uninstall

Remove the plugin from Cursor Marketplace / Team Marketplace, or delete the plugin folder from your workspace. Removing the plugin does not delete your Opsphere account or server-side integrations — revoke those separately (above).

## Legal

- **Terms of Service**: https://opsphere.io/terms
- **Privacy Policy**: https://opsphere.io/privacy
- **Security & Trust**: [SECURITY.md](../SECURITY.md) · [SECURITY-AND-TRUST.md](SECURITY-AND-TRUST.md) (marketplace reviewers)

This document summarizes plugin behavior; the website policies govern the SaaS service.
