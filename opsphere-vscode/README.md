# Opsphere for VS Code

Agent Plugins 1.0 package for desktop VS Code with GitHub Copilot. Includes skills, agents, commands, rules and one remote MCP server. Version 1.0.0. No runtime dependencies, hooks or installer.

## Install from GitHub (no manual clone)

Requires desktop VS Code with agent plugin support, Git available to VS Code, Copilot enabled and an Opsphere account. Organization policies can restrict plugins or MCP servers. If the settings or commands below are missing, update VS Code and check your organization's policy.

1. Run **Preferences: Open User Settings (JSON)**. Append `opsphere-io/opsphere-plugin` to your existing `chat.plugins.marketplaces` array, preserving other entries. Enable plugin support if disabled:

   ```json
   {
     "chat.plugins.enabled": true,
     "chat.plugins.marketplaces": ["opsphere-io/opsphere-plugin"]
   }
   ```

2. Open Extensions and search **`@agentPlugins`**.
3. Select **opsphere-vscode** from the **opsphere** marketplace and click **Install**. Review and accept the marketplace trust prompt. VS Code fetches the package from GitHub automatically.
4. Continue with [Start Opsphere and verify the connection](#start-opsphere-and-verify-the-connection) below. Use the same chat throughout startup and verification.

Install only this VS Code package in the test profile. VS Code can also discover Copilot CLI plugins; avoid enabling both Opsphere packages or adding a second manual Opsphere server in workspace `.vscode/mcp.json` or user MCP settings. The server URL is `https://mcp-cursor.opsphere.io/mcp` using Streamable HTTP. The package grants no additional service permissions.

Do not use the bare repository URL in **Install Plugin From Source** to select this package: the repository root contains other client manifests. Use the marketplace entry above.

**Publication status:** this flow requires `opsphere-vscode/` and its marketplace entry to be published to GitHub. Installation from the published marketplace has not yet been manually verified. Local server startup has been user-confirmed; browser OAuth and authenticated tool calls remain unverified.

## Local development

Node.js 22+ is needed only for validation. Clone the repo if needed:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/opsphere-io/opsphere-plugin.git
cd opsphere-plugin
git sparse-checkout set opsphere-vscode
node --test opsphere-vscode/tests/package.test.mjs
```

Use a temporary VS Code profile with Copilot enabled and a disposable workspace. In that profile's **user settings**, replace `<absolute-path-to-cloned-repo>` with the absolute path to your clone (use forward slashes on Windows):

```json
{
  "chat.plugins.enabled": true,
  "chat.pluginLocations": {
    "<absolute-path-to-cloned-repo>/opsphere-vscode": true
  }
}
```

Do not load a local copy and a marketplace copy together. Run **Developer: Reload Window**, then **Chat: Open Customizations** and check skills, agents and commands. Continue with the startup steps below. After editing the package, reload the window and repeat startup in a new chat.

## Start Opsphere and verify the connection

Follow these steps after either installation method. Installing the package makes its customizations available; sending the first chat message initializes the session runtime; a successful authenticated tool call verifies account access.

1. Open the workspace you want to use and open a new VS Code chat. Select the **Copilot** harness/session target for the desktop session. This is separate from choosing a model or an Opsphere custom agent. Do not select the Cloud execution target for this local test.
2. **Send a first message before manually starting the server:** “Use Opsphere to show my usage and workspace; do not change configuration.” Wait for the session to initialize. Opening an empty chat or viewing installed skills is not sufficient. If authentication is requested during initialization, complete it and continue.
3. In the **same chat/workspace**, run **MCP: List Servers**, select **opsphere**, and choose **Start Server** if it is stopped or errored. If the menu already shows **Stop Server — Running**, leave it running. Do not create another server through **Edit Configuration** or **MCP: Add Server**.
4. Follow any browser authentication prompt. Sign in with the same Opsphere account as your other clients and select the intended workspace if asked. VS Code manages discovery, callbacks and credentials; do not configure tokens, client secrets or callback URLs. If no prompt appears, credentials may already be saved; confirm access with the next step rather than assuming a new login is required.
5. Check the chat's tool picker (**Configure Tools**) and enable Opsphere tools if they are disabled. In that same chat, ask “Call Opsphere `ops_my_usage` and show my current usage and active workspace.” Approve the read-only call if VS Code asks. A successful tool result confirms account access; **Running** alone does not.
6. Try “Check DNS, HTTP and TLS for https://example.com” and “Which integrations are configured?” Keep the explicitly selected workspace. A provider or plan denial should be reported as such, not treated as a plugin installation failure.

If a new chat reports “Send a message first,” repeat step 2 in that chat before starting its server. For a persistent failure, use **Show Output** and the troubleshooting section below. Do not reset credentials for a runtime-initialization error.

## Manual acceptance checks

1. Confirm exactly one Opsphere MCP server and one copy of its skills/commands are active.
2. Follow the startup sequence above (first message → runtime initialization → server running → authentication if prompted → successful read-only tool call), then try:
   - “Use Opsphere onboarding and show my usage and workspace.”
   - “Check DNS, HTTP and TLS for https://example.com.”
   - “Which integrations are configured?”
3. Confirm tools report the active account/workspace and actual results or explicit plan/configuration denials. Do not switch workspaces to bypass a denial.
4. Cancel an OAuth attempt. Confirm it stays disconnected and setup/reconnect guidance points to **MCP: List Servers**. Retry browser authentication; never paste credentials into chat.
5. If discovery is duplicated, disable the extra local/marketplace/CLI copy or manual server in this profile. Preserve unrelated servers and credentials.
6. Disable the plugin from Agent Plugins. Confirm its tools/customizations disappear in a new chat. For local loading, set its `chat.pluginLocations` entry to `false` and reload.
7. After publication, repeat in a clean profile using only the GitHub marketplace instructions: no manual clone or local path. Record VS Code version, package version, date and results, redacting account data.

Local server startup: **user-confirmed on 19 October 2026 after sending the first chat message**. Local OAuth and authenticated read-only tool calls: **pending manual verification**. Published GitHub marketplace installation: **pending publication and manual verification**. Gateway/auth failures block release verification; do not change shared service behavior to work around them.

## Updates and removal

For marketplace installs, run **Extensions: Check for Extension Updates** and update **opsphere-vscode** in Agent Plugins. Use the same Extensions/Agent Customizations interface used to install it; chat `/plugin` operations may use a different inventory.

To disable or uninstall, open Extensions → Agent Plugins, select **opsphere-vscode** and use **Disable** or **Uninstall**. For local development, remove only this package's `chat.pluginLocations` entry and reload; preserve other registrations. Uninstalling a plugin does not delete your Opsphere account or integrations.

For local clones, update with `git pull --ff-only` and reload. Check out a published tag or commit for reproducible local testing. A full checkout is required for the existing repository-wide `npm test` suite (Git Bash on Windows or a Unix shell); sparse checkout supports the package-local checks only.

## Sign out and retry a clean local install

Removing the plugin or closing a chat does not necessarily clear saved MCP authentication. To test installation and browser login again, sign out before removing the package:

1. Run **MCP: List Servers** and select **opsphere**. If **Sign Out** or **Disconnect Account** is offered, use it. These account actions are conditional: some server menus show only **Stop Server**, enable/disable actions and **Show Output**. A **Running** status confirms the server connection, not that VS Code exposes a removable OAuth session in that menu. If the account actions are absent, open VS Code's **Accounts** menu and look for the Opsphere authentication account; sign out there if available, or continue with the provider reset in step 2. Do not sign out your GitHub/Copilot account for this test. When **Disconnect Account** is offered for a shared account, it removes this server's access rather than signing out the shared account. See [VS Code MCP authentication management](https://code.visualstudio.com/updates/v1_102#_quick-management-of-mcp-authentication).
2. Select **Stop Server** for Opsphere. For a full reset of its saved OAuth registration, run **Authentication: Remove Dynamic Authentication Providers** from the Command Palette and select only the provider associated with Opsphere. The entry may identify the OAuth authorization issuer rather than the MCP URL (`mcp-cursor.opsphere.io`); select it only when you can establish that it belongs to this Opsphere connection. This removes that provider's saved registration and account data in VS Code. Skip this reset if the provider is shared with another VS Code connection you need to preserve, or if you cannot identify it confidently. Do not remove unrelated providers. If no Opsphere provider is listed, do not assume credentials were cleared: use **Show Output** to identify which client/authentication flow owns this server connection, sharing only redacted diagnostics. See [VS Code dynamic authentication cleanup](https://code.visualstudio.com/updates/v1_103#_remove-dynamic-auth-provider-from-account-menu).
3. Remove the installation: for a marketplace install, select **opsphere-vscode → Uninstall** in Extensions → Agent Plugins. For a local registration, remove only `"<absolute-path-to-cloned-repo>/opsphere-vscode"` from `chat.pluginLocations` in the active profile's user settings and any workspace settings that register it. Keep the source folder so you can reinstall it.
4. Check that no duplicate Opsphere package or manual server remains active in this test profile. Disable any auto-discovered Copilot CLI Opsphere plugin in VS Code for this test; do not uninstall it from the CLI or change other IDEs. Preserve unrelated MCP servers.
5. Run **Developer: Reload Window** and start a new chat. Confirm the removed package's customizations and server are no longer available. A new chat clears conversation context; it does not itself sign out of OAuth.
6. Follow **Local development** above to register the local package again and reload, then follow **Start Opsphere and verify the connection**, including sending the first message before starting the server. Confirm exactly one Opsphere server is present and repeat the read-only acceptance prompts.
7. If browser login happens automatically and you need to test the login form, sign out on the Opsphere authentication page in your browser or clear site data only for the authentication origin shown there, then retry. Browser login cookies are separate from VS Code's MCP credentials; avoid clearing unrelated browser sessions.

For an isolated test configuration, create an **Empty Profile** through **Profiles: Create Profile**, keep Settings Sync off for it, enable Copilot, and open a disposable workspace. Profiles isolate settings and customizations; do not assume a fresh profile also clears saved authentication. Use the sign-out/reset steps above when testing OAuth. These steps clear local access; they do not establish that a server-side token was revoked or delete your Opsphere account or integrations.

## Troubleshooting and boundaries

- **“Cannot start an MCP server before the session runtime has been created. Send a message first.”**: this is an Agent Host session-lifecycle error, raised before the runtime can start the server. In the same workspace/chat, send a first message (for example, “Use Opsphere to show my usage and workspace; do not change configuration”), wait for initialization, then retry starting Opsphere and complete OAuth if prompted. If it persists after a completed message, check the chat's selected harness and **Show Output** for initialization errors; reload and repeat in a new chat. Selecting a model or viewing installed skills does not create the session runtime. No extra OAuth fields, headers or callback configuration are needed to address this error. This startup sequence is based on the installed Agent Host error path; live OAuth verification remains pending.
- **Runtime configuration displays `servers` / `type: "http"`**: VS Code's native MCP configuration uses this shape. The packaged Agent Plugins `mcp.json` uses `mcpServers` / `type: "streamable-http"`. Seeing the native shape in the server editor does not by itself indicate a package error. Keep the package format intact and do not add a duplicate manual server to work around a session-lifecycle error.
- Missing marketplace entry: verify publication, repository access and marketplace spelling, then refresh/reload. Do not install the root plugin as a substitute.
- Authentication cancellation or expiration: open **MCP: List Servers**, select Opsphere and follow its authentication prompt. After `invalid_grant`, stop tool retries until browser sign-in completes. Share only redacted errors with support.
- Network/5xx errors: check reachability and retry with bounded backoff; preserve saved credentials. Respect 429 `Retry-After`.
- Tools listed but unavailable: tool discovery is not authorization. Respect the active workspace, plan, integrations and permissions. Do not reconnect merely to change workspaces in stable catalog mode.
- v1 targets desktop VS Code with Copilot. Remote environments and cloud agents are outside the verified scope. Existing Cursor, Codex, Claude Code, Copilot CLI, Antigravity, Warp and OpenCode packages are unchanged.

Skills in this folder are a versioned snapshot. Future updates should be deliberately ported and validated here; existing shared generators do not write this package.

See [VS Code agent plugins documentation](https://code.visualstudio.com/docs/agent-customization/agent-plugins) for supported installation and local registration behavior. Support: [contact@opsphere.io](mailto:contact@opsphere.io).
