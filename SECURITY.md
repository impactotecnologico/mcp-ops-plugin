# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a vulnerability

**Do not** open public GitHub issues for security problems.

Email [contact@opsphere.io](mailto:contact@opsphere.io) if the security alias is not yet active with:

- Description of the issue and impact
- Steps to reproduce
- Affected plugin version and Cursor version (if relevant)

We aim to acknowledge within **2 business days** and provide a remediation timeline for confirmed issues.

## Scope

**In scope**

- This repository (plugin manifest, rules, skills, commands, docs)
- Public Opsphere gateway endpoints referenced in `mcp.json`
- OAuth2 / MCP authentication flow as exposed to Cursor users

**Out of scope**

- Proprietary Opsphere backend code (not in this repo)
- Customer integration credentials stored encrypted on Opsphere servers
- Third-party provider APIs (Datadog, Vercel, etc.)

## Security model (summary)

- **Authentication**: OAuth2 Authorization Code + PKCE via Cursor; no long-lived secrets in the plugin bundle.
- **Integration credentials**: Entered in chat, sent over HTTPS to Opsphere, encrypted at rest per tenant; not stored in Cursor or in this repo.
- **Plugin contents**: Markdown, JSON, shell helper scripts only — no backend logic or API keys embedded.

See [README.md](README.md#security) and [docs/PRIVACY.md](docs/PRIVACY.md) for user-facing details.
