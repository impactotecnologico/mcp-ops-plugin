# Privacy — Opsphere Cursor Plugin

## What this plugin is

The Opsphere plugin is a **client configuration bundle** for Cursor: rules, skills, commands, and an `mcp.json` entry pointing at the Opsphere remote MCP gateway. It does not run a backend on your machine.

## Data sent to Opsphere

When you use Opsphere tools through Cursor:

| Data | When | Purpose |
|------|------|---------|
| OAuth access / refresh tokens | After you click **Connect** | Authenticate MCP requests to the gateway |
| Tool call parameters | Each tool invocation | Execute the requested operation (e.g. DNS lookup, log query) |
| Integration credentials | When you configure a provider in chat | Store encrypted credentials for your tenant so tools can call Datadog, Vercel, etc. |
| Usage metadata | Each tool call | Enforce plan limits, billing, and abuse prevention |

Opsphere does **not** receive your Cursor source code unless you paste it into chat yourself.

## What stays local

- Your IDE workspace and files
- OAuth tokens managed by Cursor (not written into this plugin repo)
- Integration secrets are **not** stored in the plugin folder

## Credential storage

Integration API keys and tokens are stored **encrypted on Opsphere servers**, isolated per account. They are transmitted only over HTTPS when you configure or use an integration.

## Revoking access

1. **Disconnect MCP**: Cursor Settings → MCP → disable or remove Opsphere.
2. **Sign out / rotate OAuth**: use Cursor’s MCP reconnect flow or revoke the Opsphere application in your account settings when available at [opsphere.io](https://opsphere.io).
3. **Remove integrations**: in chat, ask to remove a provider or use integration management tools (`ops_remove_integration`).
4. **Delete account**: contact [contact@opsphere.io](mailto:contact@opsphere.io).

## Uninstall

Remove the plugin from Cursor Marketplace / Team Marketplace, or delete the plugin folder from your workspace. Removing the plugin does not delete your Opsphere account or server-side integrations — revoke those separately (above).

## Legal

- **Terms of Service**: https://opsphere.io/terms (publish before marketplace launch if not live)
- **Privacy Policy**: https://opsphere.io/privacy (publish before marketplace launch if not live)

This document summarizes plugin behavior; the website policies govern the SaaS service.
