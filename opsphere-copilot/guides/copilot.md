# Connect Opsphere to GitHub Copilot CLI

<!-- Generated from src/client-connectivity; do not edit. -->

Use the same email to recover the same Hub, subscription and Personal Workspace. Complete OAuth independently in each client. Do not copy OAuth token files.

Each session is independently revocable. Preferences are per effective OAuth client ID.

For clients that use DCR, including OpenCode and GitHub Copilot CLI, a new DCR registration can have a fresh preference.

Warp local, OpenCode, Antigravity and GitHub Copilot CLI are available across all Opsphere plans. No invitation or account allowlist is required. Account status, workspace permissions and quotas still apply; a global service switch can temporarily disable access.

MCP-only supplies tools, resources and OAuth. The optional plugin/package adds skills, rules and agents, not extra permissions.

When ops_my_usage reports catalog.mode=stable, tools/list is the public connector catalog, independent of workspace and plan. Listed does not mean permitted, configured or connected. Workspace switches require no reconnect. Every call validates the selected workspace, plan, enabled tools, permissions, credentials and limits. Never force Personal or switch automatically. One reload may be needed after activation or future tool/schema releases in clients that ignore change notifications.

Endpoint: https://mcp-cursor.opsphere.io/mcp (Streamable HTTP). OAuth authorization code, PKCE S256 and discovery; do not configure a static bearer token or client secret.

## GitHub Copilot CLI

1. Choose one mode: plugin or MCP-only. Do not enable both for a server named opsphere.
2. Plugin: obtain opsphere-copilot/, then run copilot plugin install /absolute/path/to/opsphere-copilot. From GitHub without cloning: copilot plugin install opsphere-io/opsphere-plugin:opsphere-copilot. Marketplace: copilot plugin marketplace add opsphere-io/opsphere-plugin then copilot plugin install opsphere@opsphere.
3. Start a new Copilot CLI session. Let Copilot discover OAuth, use DCR and PKCE S256 and open the browser. Sign in with the same account and choose a workspace. Do not configure client_id, callback, tokens or secrets yourself. Do not copy token files.
4. MCP-only: copilot mcp add --transport http opsphere https://mcp-cursor.opsphere.io/mcp. Do not install the plugin at the same time.

## Remote MCP configuration

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "opsphere": {
      "type": "streamable-http",
      "url": "https://mcp-cursor.opsphere.io/mcp"
    }
  }
}
```

This is the Agent Plugins `mcp.json` that Copilot CLI loads. OAuth stays in the client. Do not put client_id, callback, tokens or secrets in it.

GitHub Copilot CLI uses DCR. Do not configure client_id, callback, tokens or secrets in the plugin.

MCP-only is a separate mode: `copilot mcp add --transport http opsphere https://mcp-cursor.opsphere.io/mcp`. Do not also install the plugin.

## Verify

- Call ops_my_usage and ops_accounts_list after login to verify the account and intended active workspace.
- Use live MCP discovery; do not promise a fixed count of tools or change workspace to test connectivity.

## Troubleshooting

- missing_server: Check the JSON, configuration path and local server enablement.
- invalid_redirect_uri: Callback registration compatibility error before account login, not a plan or invitation restriction. Report the callback shape and redacted error to support.
- authentication: For 401, invalid_grant or expired sessions, complete OAuth in the destination client and reconnect once. If it still fails, report the redacted error. Do not copy credentials.
- stale_catalog: Check catalog.mode in ops_my_usage. In stable mode, do not reconnect after workspace changes; inspect workspace availability or ops_list_integrations instead. Legacy mode with tools_discovery.stale=true may require client catalog refresh/reconnect. Future product/schema updates may need one reload. Never change workspace to repair discovery, and do not ask the agent to invoke tools/list if its host does not expose it.
- revocation: Revoke only the destination session. Removing configuration is not server-side revocation. Do not unlink workspaces or revoke other apps as a reconnect shortcut.

## Optional GitHub Copilot CLI package

Verify opsphere-copilot/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

[Public repository](https://github.com/opsphere-io/opsphere-plugin) · [Source ZIP](https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip) · [Support](mailto:contact@opsphere.io)

The package ships plugin.json, mcp.json and skills/. Copilot-specific agents, commands and rules live under com.github.copilot/.

Copilot plugin MCP file is mcp.json using streamable-http url only. Do not put client_id, callback, tokens, secrets or headers in it.

copilot plugin install /absolute/path/to/opsphere-copilot; copilot plugin install opsphere-io/opsphere-plugin:opsphere-copilot

copilot plugin marketplace add opsphere-io/opsphere-plugin then copilot plugin install opsphere@opsphere

copilot plugin uninstall opsphere

GitHub Copilot CLI uses DCR. Do not configure client_id, callback, tokens or secrets in the plugin.

Do not install the plugin and a manual MCP entry named opsphere at the same time; that duplicates the server.

This repo's Copilot marketplace is .github/plugin/marketplace.json with source ./opsphere-copilot. Do not use .claude-plugin/marketplace.json for Copilot.

Copilot cloud agent remains outside this package's Opsphere support boundary.
