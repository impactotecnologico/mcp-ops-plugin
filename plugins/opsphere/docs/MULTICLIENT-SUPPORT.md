# Multiclient support and recovery

The same account can connect independently from supported local clients. Global access is already enabled; there is no pending canary invitation. Use the [generated connection guide](../skills/connect-another-client/references/connect.md) and [Warp package](../opsphere-warp/README.md), not copied setup instructions from old conversations.

## What to include in a support request

Email **contact@opsphere.io** with client name/version, plugin version, local versus cloud mode, approximate UTC timestamp, selected workspace label, operation name, and redacted error/status. Include whether the issue started after a reconnect, workspace change or upgrade. Never send access/refresh tokens, authorization codes, PKCE verifiers, credential files, provider secrets, or full unredacted logs. Share internal request/session identifiers only with private support when requested.

## Safe recovery

1. For a temporary MCP startup timeout, wait for the server to become ready and retry one read-only call. If it still fails, stop and collect the redacted error.
2. For authentication failures, use the client's normal OAuth flow. Do not copy another client's credentials or rewrite callback URLs.
3. After a requested workspace change, inspect the live tool catalog. A manual reconnect is a fallback, not proof that automatic catalog updates passed.
4. If usage breakdown is temporarily unavailable, the previous reader may be serving results because reconciliation failed. This must not change subscription limits or credentials.

## Removing a client and rolling back a package

Disconnecting MCP or deleting its configuration does **not** revoke server-side OAuth access. Removing an integration is also **not** client-session revocation. Ask support to identify and revoke only the intended client session; do not unlink a workspace to disconnect one application.

For Warp, run the explicit package uninstaller from the package version you installed; see its README. User-modified files are preserved and unchanged owned skill files are moved to a recovery directory. Review preserved files before installing an older package. Keep other MCP entries and project rules. Uninstalling does not revoke OAuth or delete account data.

Plugin rollback means reinstalling a known published version using that client's supported installation flow. Do not copy cache folders or token files between clients. Gateway rollback and package rollback are separate operations; neither recovers usage events deleted by retention.

## Release verification boundary

Published manifests, downloadable sources and passing CI prove distribution, not an end-to-end pass for every client and plan. Warp cloud/Oz/Slack-triggered cloud agents remain outside this package's support scope. The operational release owner tracks the real-client matrix separately and must not mark unexecuted tests as passed.
