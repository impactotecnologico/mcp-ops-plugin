# Connect Opsphere to OpenCode

<!-- Generated from src/client-connectivity; do not edit. -->

Use the same email to recover the same Hub, subscription and Personal Workspace. Complete OAuth independently in each client. Do not copy OAuth token files.

Each session is independently revocable. Preferences are per effective OAuth client ID; a new DCR registration can have a fresh preference.

Warp local, OpenCode and Antigravity are available across all Opsphere plans. No invitation or account allowlist is required. Account status, workspace permissions and quotas still apply; a global service switch can temporarily disable access.

MCP-only supplies tools, resources and OAuth. The optional plugin/package adds skills, rules and agents, not extra permissions.

When ops_my_usage reports catalog.mode=stable, tools/list is the public connector catalog, independent of workspace and plan. Listed does not mean permitted, configured or connected. Workspace switches require no reconnect. Every call validates the selected workspace, plan, enabled tools, permissions, credentials and limits. Never force Personal or switch automatically. One reload may be needed after activation or future tool/schema releases in clients that ignore change notifications.

Endpoint: https://mcp-cursor.opsphere.io/mcp (Streamable HTTP). OAuth authorization code, PKCE S256 and discovery; do not configure a static bearer token or client secret.

## OpenCode

1. Merge the OpenCode MCP object into <repo>/opencode.json, preserving other servers. Global MCP-only setup uses ~/.config/opencode/opencode.json; do not add both unintentionally.
2. Complete OAuth with opencode mcp auth opsphere or OpenCode /mcps. Use the same account. Do not copy token files.
3. Let OpenCode manage callbacks and credentials. Do not set a callback port or redirect URI unless the gateway reports invalid_redirect_uri.
4. Keep Code Mode disabled for Opsphere so gateway tools stay native. Raise the catalog timeout; the default is too low for this server.

## Remote MCP configuration

```json
{
  "mcp": {
    "opsphere": {
      "type": "remote",
      "url": "https://mcp-cursor.opsphere.io/mcp",
      "timeout": 60000,
      "codemode": false
    }
  }
}
```

If the installed OpenCode requires V2 `mcp.servers`, nest the same `opsphere` object under `mcp.servers` instead of next to it. Do not set `oauth: false` or a static client secret.

## Verify

- Call ops_my_usage and ops_accounts_list after login to verify the account and intended active workspace.
- Use live MCP discovery; do not promise a fixed count of tools or change workspace to test connectivity.

## Troubleshooting

- missing_server: Check the JSON, configuration path and local server enablement.
- invalid_redirect_uri: Callback registration compatibility error before account login, not a plan or invitation restriction. Report the callback shape and redacted error to support.
- authentication: For 401, invalid_grant or expired sessions, complete OAuth in the destination client and reconnect once. If it still fails, report the redacted error. Do not copy credentials.
- stale_catalog: Check catalog.mode in ops_my_usage. In stable mode, do not reconnect after workspace changes; inspect workspace availability or ops_list_integrations instead. Legacy mode with tools_discovery.stale=true may require client catalog refresh/reconnect. Future product/schema updates may need one reload. Never change workspace to repair discovery, and do not ask the agent to invoke tools/list if its host does not expose it.
- revocation: Revoke only the destination session. Removing configuration is not server-side revocation. Do not unlink workspaces or revoke other apps as a reconnect shortcut.

## Optional OpenCode package

Verify opsphere-opencode/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

[Public repository](https://github.com/opsphere-io/opsphere-plugin) · [Source ZIP](https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip) · [Support](mailto:contact@opsphere.io)

Install skills under .opencode/skills/. Merge AGENTS.md preserving existing instructions. Use opsphere-opencode markers; do not reuse Warp markers or install into .agents/skills/.

Keep codemode false so Opsphere gateway tools remain native. Revisit only if a session proves context overflow.

Set at least a 60000 ms catalog timeout. OpenCode defaults are too low for this server.
