# Connect Opsphere to another client

<!-- Generated from src/client-connectivity; do not edit. -->

Use the same email to recover the same Hub, subscription and Personal Workspace. Complete OAuth independently in each client. Do not copy OAuth token files.

Each session is independently revocable. Preferences are per effective OAuth client ID.

For clients that use DCR, including OpenCode, a new DCR registration can have a fresh preference.

Antigravity workspace preference is bound to the stable CIMD client_id. It does not create a new DCR client per install.

Warp local, OpenCode and Antigravity are available across all Opsphere plans. No invitation or account allowlist is required. Account status, workspace permissions and quotas still apply; a global service switch can temporarily disable access.

MCP-only supplies tools, resources and OAuth. The optional plugin/package adds skills, rules and agents, not extra permissions.

When ops_my_usage reports catalog.mode=stable, tools/list is the public connector catalog, independent of workspace and plan. Listed does not mean permitted, configured or connected. Workspace switches require no reconnect. Every call validates the selected workspace, plan, enabled tools, permissions, credentials and limits. Never force Personal or switch automatically. One reload may be needed after activation or future tool/schema releases in clients that ignore change notifications.

Endpoint: https://mcp-cursor.opsphere.io/mcp (Streamable HTTP). OAuth authorization code, PKCE S256 and discovery; do not configure a static bearer token or client secret.

## Cursor

1. Install the Opsphere plugin, enable its remote MCP server and complete browser OAuth.

## Codex

1. Install the Opsphere plugin and complete MCP OAuth when prompted. The plugin supplies skills and its MCP server definition.

## Claude Code

1. Install the Opsphere plugin; open /mcp, select opsphere and follow its authentication prompt.

## Warp local

1. Merge the configuration below into ~/.warp/.mcp.json (global) or <repo>/.warp/.mcp.json (project), preserving other servers.
2. Open Settings > Agents > MCP servers. Global configs auto-spawn; project configs require explicit approval and may need enabling after a restart.
3. Complete browser OAuth with the same account. If you want Personal, select Personal Workspace in the OAuth picker. Do not assume another client's workspace is inherited.
4. Let Warp manage callbacks and credentials. Desktop uses warp://mcp/oauth2callback; the local CLI may use http://127.0.0.1:<port>/mcp/oauth2callback. Do not set a callback port manually.

## OpenCode

1. Merge the OpenCode MCP object into <repo>/opencode.json, preserving other servers. Global MCP-only setup uses ~/.config/opencode/opencode.json; do not add both unintentionally.
2. Complete OAuth with opencode mcp auth opsphere or OpenCode /mcps. Use the same account. Do not copy token files.
3. Let OpenCode manage callbacks and credentials. Do not set a callback port or redirect URI unless the gateway reports invalid_redirect_uri.
4. Keep Code Mode disabled for Opsphere so gateway tools stay native. Raise the catalog timeout; the default is too low for this server.

## Antigravity

1. Choose one mode: plugin or MCP-only. Do not enable both for a server named opsphere.
2. Plugin: run agy plugin install /absolute/path/to/opsphere-antigravity. Official install lands in ~/.gemini/config/plugins/opsphere/ with plugin.json, mcp_config.json, mcp.json and skills/.
3. Confirm agy plugin validate reports mcpServers processed. Current agy loads mcp_config.json (serverUrl), not Agent Plugins mcp.json. Then start a new session. Let Antigravity discover OAuth, use the CIMD client_id, start PKCE S256 and open the browser. Sign in with the same account and choose a workspace. If Antigravity asks for a code, paste the one-time authorization code into the terminal. Do not log, share or put that code in documentation. Do not configure client_id, callback, tokens or secrets yourself.
4. MCP-only: add the same gateway as serverUrl in Antigravity native MCP settings (~/.gemini/config/mcp_config.json). Do not install the plugin at the same time.

## Other MCP client

1. Configure the remote URL with Streamable HTTP, OAuth discovery, PKCE S256 and DCR. Compatibility is not guaranteed; do not use static bearer credentials.

## Remote MCP configuration

Warp local and generic `mcpServers` shape:

```json
{
  "mcpServers": {
    "opsphere": {
      "url": "https://mcp-cursor.opsphere.io/mcp"
    }
  }
}
```

OpenCode (`opencode.json`):

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

Antigravity plugin MCP that current agy loads (`mcp_config.json`):

```json
{
  "mcpServers": {
    "opsphere": {
      "serverUrl": "https://mcp-cursor.opsphere.io/mcp"
    }
  }
}
```

Agent Plugins portable (`mcp.json`). Current agy skips this file:

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

OAuth is client-managed. Antigravity uses stable CIMD:

- client_id: https://antigravity.google/oauth/client-metadata.json
- callback: https://antigravity.google/oauth-callback
- identity: antigravity / local

Do not put client_id, callback, tokens or secrets in the plugin. MCP-only uses ~/.gemini/config/mcp_config.json with the same serverUrl.

## Verify

- Call ops_my_usage and ops_accounts_list after login to verify the account and intended active workspace.
- Use live MCP discovery; do not promise a fixed count of tools or change workspace to test connectivity.

## Troubleshooting

- missing_server: Check the JSON, configuration path and local server enablement.
- empty_mcp_panel: If the plugin appears in agy plugin list but the session MCP section is empty, current agy did not find mcp_config.json. Agent Plugins mcp.json is ignored. Reinstall the package that ships mcp_config.json, confirm agy plugin validate reports mcpServers processed, then start a new agy session.
- invalid_redirect_uri: Callback registration compatibility error before account login, not a plan or invitation restriction. Report the callback shape and redacted error to support.
- unknown_client_id: Antigravity CIMD client_id was not recognized. Report the redacted error. Do not register a DCR client or change Cursor, Codex or Claude Code client IDs.
- token_issuance_failed: Token exchange failed after authorization. Retry OAuth once in Antigravity. Do not paste tokens. If it persists, report the redacted error.
- authentication: For 401, invalid_grant or expired sessions, complete OAuth in the destination client and reconnect once. If it still fails, report the redacted error. Do not copy credentials.
- stale_catalog: Check catalog.mode in ops_my_usage. In stable mode, do not reconnect after workspace changes; inspect workspace availability or ops_list_integrations instead. Legacy mode with tools_discovery.stale=true may require client catalog refresh/reconnect. Future product/schema updates may need one reload. Never change workspace to repair discovery, and do not ask the agent to invoke tools/list if its host does not expose it.
- revocation: Revoke only the destination session. Removing configuration is not server-side revocation. Do not unlink workspaces or revoke other apps as a reconnect shortcut.

## Optional packages

Verify opsphere-warp/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

Verify opsphere-opencode/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

Verify opsphere-antigravity/ is actually published before promising a download. If unavailable, contact support. MCP-only needs neither a download nor access to a private repository.

[Public repository](https://github.com/opsphere-io/opsphere-plugin) · [Source ZIP](https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip) · [Support](mailto:contact@opsphere.io)

Warp: Install skills under .agents/skills/. Merge AGENTS.md preserving existing instructions. Do not also install WARP.md or assume precedence between competing files.

Warp/Oz cloud and Slack-triggered cloud agents are outside Opsphere support for this package, not generally incapable of MCP. Never upload local OAuth credentials.

OpenCode: Install skills under .opencode/skills/. Merge AGENTS.md preserving existing instructions. Use opsphere-opencode markers; do not reuse Warp markers or install into .agents/skills/.

Keep codemode false so Opsphere gateway tools remain native. Revisit only if a session proves context overflow.

Set at least a 60000 ms catalog timeout. OpenCode defaults are too low for this server.

Antigravity: The package ships plugin.json, mcp_config.json, mcp.json and skills/. Current agy loads mcp_config.json with serverUrl. Agent Plugins mcp.json is portable and skipped by agy 1.2.x. agy plugin install /absolute/path/to/opsphere-antigravity Official path: ~/.gemini/config/plugins/opsphere/ agy plugin validate must report mcpServers processed. Current agy plugin list may only show skills and agents even when MCP is installed. agy plugin uninstall opsphere

agy plugin MCP file is mcp_config.json using serverUrl only. Do not put client_id, callback, tokens, secrets or headers in it.

Antigravity uses stable CIMD, not dcr_*. Do not configure client_id, callback, tokens or secrets in the plugin.

Do not install the plugin and a manual MCP entry named opsphere at the same time; that duplicates the server.

rules/ and agents/ are unconfirmed extras for discovery testing. They are not portable plugin capabilities.

.agents/plugins/opsphere/ and ~/.gemini/antigravity-cli/plugins/opsphere/ are experimental and unsupported.
