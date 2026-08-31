# Connect Opsphere to Warp local

<!-- Generated from src/client-connectivity; do not edit. -->

Use the same email to recover the same Hub, subscription and Personal Workspace. Complete OAuth independently in each client. Do not copy OAuth token files.

Each session is independently revocable. Preferences are per effective OAuth client ID; a new DCR registration can have a fresh preference.

Warp local is available across all Opsphere plans. No invitation or account allowlist is required. Account status, workspace permissions and quotas still apply; a global service switch can temporarily disable access.

MCP-only supplies tools, resources and OAuth. The optional plugin/package adds skills, rules and agents, not extra permissions.

Endpoint: https://mcp-cursor.opsphere.io/mcp (Streamable HTTP). OAuth authorization code, PKCE S256 and discovery; do not configure a static bearer token or client secret.

## Warp local

1. Merge the configuration below into ~/.warp/.mcp.json (global) or <repo>/.warp/.mcp.json (project), preserving other servers.
2. Open Settings > Agents > MCP servers. Global configs auto-spawn; project configs require explicit approval and may need enabling after a restart.
3. Complete browser OAuth with the same account. If you want Personal, select Personal Workspace in the OAuth picker. Do not assume another client's workspace is inherited.
4. Let Warp manage callbacks and credentials. Desktop uses warp://mcp/oauth2callback; the local CLI may use http://127.0.0.1:<port>/mcp/oauth2callback. Do not set a callback port manually.

## Remote MCP configuration

```json
{
  "mcpServers": {
    "opsphere": {
      "url": "https://mcp-cursor.opsphere.io/mcp"
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
- stale_catalog: After an explicitly requested workspace change, refresh tools/list; reconnect if notifications/tools/list_changed is not processed. Do not silently switch workspace.
- revocation: Revoke only the destination session. Removing configuration is not server-side revocation. Do not unlink workspaces or revoke other apps as a reconnect shortcut.

## Optional Warp package

Verify opsphere-warp/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

[Public repository](https://github.com/opsphere-io/opsphere-plugin) · [Source ZIP](https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip) · [Support](mailto:contact@opsphere.io)

Install skills under .agents/skills/. Merge AGENTS.md preserving existing instructions. Do not also install WARP.md or assume precedence between competing files.

Warp/Oz cloud and Slack-triggered cloud agents are outside Opsphere support for this package, not generally incapable of MCP. Never upload local OAuth credentials.
