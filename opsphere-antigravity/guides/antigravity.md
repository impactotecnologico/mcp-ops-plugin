# Connect Opsphere to Antigravity

<!-- Generated from src/client-connectivity; do not edit. -->

Use the same email to recover the same Hub, subscription and Personal Workspace. Complete OAuth independently in each client. Do not copy OAuth token files.

Each session is independently revocable. Preferences are per effective OAuth client ID; a new DCR registration can have a fresh preference.

Warp local, OpenCode and Antigravity are available across all Opsphere plans. No invitation or account allowlist is required. Account status, workspace permissions and quotas still apply; a global service switch can temporarily disable access.

MCP-only supplies tools, resources and OAuth. The optional plugin/package adds skills, rules and agents, not extra permissions.

When ops_my_usage reports catalog.mode=stable, tools/list is the public connector catalog, independent of workspace and plan. Listed does not mean permitted, configured or connected. Workspace switches require no reconnect. Every call validates the selected workspace, plan, enabled tools, permissions, credentials and limits. Never force Personal or switch automatically. One reload may be needed after activation or future tool/schema releases in clients that ignore change notifications.

Endpoint: https://mcp-cursor.opsphere.io/mcp (Streamable HTTP). OAuth authorization code, PKCE S256 and discovery; do not configure a static bearer token or client secret.

## Antigravity

1. Install the Opsphere plugin into the workspace (.agents/plugins/opsphere/) or globally (~/.gemini/config/plugins/opsphere/).
2. Reload the workspace or CLI so Antigravity discovers plugin.json and mcp_config.json (serverUrl).
3. Complete browser OAuth with the same account. Do not copy token files or add a duplicate opsphere server in ~/.gemini/config/mcp_config.json.
4. MCP-only can use mcp_config.json with serverUrl; the package adds skills, rules and agents, not extra permissions.

## Remote MCP configuration

```json
{
  "mcpServers": {
    "opsphere": {
      "serverUrl": "https://mcp-cursor.opsphere.io/mcp"
    }
  }
}
```

## Verify

- Call ops_my_usage and ops_accounts_list after login to verify the account and intended active workspace.
- Use live MCP discovery; do not promise a fixed count of tools or change workspace to test connectivity.

## Troubleshooting

- missing_server: Check the JSON, configuration path and local server enablement.
- invalid_redirect_uri: Callback registration compatibility error before account login, not a plan or invitation restriction. Report the callback shape and redacted error to support.
- authentication: For 401, invalid_grant or expired sessions, complete OAuth in the destination client and reconnect once. If it still fails, report the redacted error. Do not copy credentials.
- stale_catalog: Check catalog.mode in ops_my_usage. In stable mode, do not reconnect after workspace changes; inspect workspace availability or ops_list_integrations instead. Legacy mode with tools_discovery.stale=true may require client catalog refresh/reconnect. Future product/schema updates may need one reload. Never change workspace to repair discovery, and do not ask the agent to invoke tools/list if its host does not expose it.
- revocation: Revoke only the destination session. Removing configuration is not server-side revocation. Do not unlink workspaces or revoke other apps as a reconnect shortcut.

## Optional Antigravity package

Verify opsphere-antigravity/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

[Public repository](https://github.com/opsphere-io/opsphere-plugin) · [Source ZIP](https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip) · [Support](mailto:contact@opsphere.io)

Install the plugin directory as a whole. Do not add hooks.json or a default disabledTools list.

Do not add a second opsphere server in ~/.gemini/config/mcp_config.json or .agents/mcp_config.json when the plugin already defines serverUrl.
