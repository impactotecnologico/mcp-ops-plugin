# Opsphere for Warp local

This package adds Opsphere's remote MCP plus portable operational skills and project rules to Warp local.

Warp access is initially canary-gated. Use the same email as your existing Opsphere account; each client receives an independent OAuth session. Never copy OAuth tokens from Cursor, Codex or Claude Code.

## Install

### Confirm access and obtain the optional package

Ask Opsphere to confirm canary access for your existing account before expecting OAuth to succeed. Your plan and `ops_my_usage` do not establish eligibility. If access is not confirmed, you can prepare the configuration but must not assume authorization will succeed. A server missing from Warp's list is a local configuration/discovery issue, not proof of canary rejection.

MCP-only setup needs no repository download. For the optional skills and rules, check the [public repository](https://github.com/opsphere-io/opsphere-plugin) for `opsphere-warp/`, then [download the source ZIP](https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip) and extract it. Use the `opsphere-warp/` directory inside the extracted folder. If the directory is not published yet, request the canary package from [Opsphere support](mailto:contact@opsphere.io); do not use the private development repo or assume a release asset exists.

### Configure MCP

Save or merge this literal JSON in `~/.warp/.mcp.json` (global) or `<repo>/.warp/.mcp.json` (project), preserving other servers:

```json
{
  "mcpServers": {
    "opsphere": {
      "url": "https://mcp-cursor.opsphere.io/mcp"
    }
  }
}
```

Open **Settings > Agents > MCP servers**. Global Warp servers auto-spawn by default. Project servers require explicit approval/toggling; after restarting Warp, enable the project server again if requested. Complete OAuth in the browser using the same account email. If you want your personal workspace, select **Personal Workspace** in the OAuth picker; Warp does not inherit Cursor's active workspace. Let Warp manage its callback and credentials.

### Optional package installation and verification

1. From the obtained `opsphere-warp/` folder, copy the selected directories under `skills/` into `<repo>/.agents/skills/`.
2. Merge `rules/AGENTS.md` into the repository's `AGENTS.md`, preserving existing instructions. Do not install a competing `WARP.md`.
3. After MCP authorization, ask Warp to call `ops_my_usage` and `ops_accounts_list`. Verify the account and intended active workspace; do not change workspace just to test connectivity.

The MCP URL is `https://mcp-cursor.opsphere.io/mcp` using remote HTTP transport. Opsphere OAuth MCP in Warp/Oz cloud and Slack-triggered cloud agents is outside this package's current support boundary, not a general limitation of Warp's cloud MCP capabilities. Do not copy local OAuth credentials to cloud environments.

If tools do not refresh after an explicitly confirmed workspace change, reconnect the MCP and request `tools/list` again.
