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
4. Open **MCP: List Servers**, select the plugin's **opsphere** server, start it and follow the browser authentication prompt.
5. Sign in with the same Opsphere account as your other clients. VS Code manages OAuth discovery, callbacks and credentials; never copy token files or configure a static token/client secret.
6. Start a new chat and try the read-only prompts below. Keep the workspace you explicitly selected during authentication.

Install only this VS Code package in the test profile. VS Code can also discover Copilot CLI plugins; avoid enabling both Opsphere packages or adding a second manual Opsphere server in workspace `.vscode/mcp.json` or user MCP settings. The server URL is `https://mcp-cursor.opsphere.io/mcp` using Streamable HTTP. The package grants no additional service permissions.

Do not use the bare repository URL in **Install Plugin From Source** to select this package: the repository root contains other client manifests. Use the marketplace entry above.

**Publication status:** this flow becomes available after `opsphere-vscode/` and its marketplace entry are published to GitHub. Automated checks do not verify browser OAuth or a published installation. Both live checks are pending; do not describe them as verified until completed.

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

Do not load a local copy and a marketplace copy together. Run **Developer: Reload Window**, then **Chat: Open Customizations** and check skills, agents and commands. Authenticate through **MCP: List Servers** as above. After editing the package, reload the window and start a new chat.

## Manual acceptance checks

1. Confirm exactly one Opsphere MCP server and one copy of its skills/commands are active.
2. Complete browser OAuth, then try:
   - “Use Opsphere onboarding and show my usage and workspace.”
   - “Check DNS, HTTP and TLS for https://example.com.”
   - “Which integrations are configured?”
3. Confirm tools report the active account/workspace and actual results or explicit plan/configuration denials. Do not switch workspaces to bypass a denial.
4. Cancel an OAuth attempt. Confirm it stays disconnected and setup/reconnect guidance points to **MCP: List Servers**. Retry browser authentication; never paste credentials into chat.
5. If discovery is duplicated, disable the extra local/marketplace/CLI copy or manual server in this profile. Preserve unrelated servers and credentials.
6. Disable the plugin from Agent Plugins. Confirm its tools/customizations disappear in a new chat. For local loading, set its `chat.pluginLocations` entry to `false` and reload.
7. After publication, repeat in a clean profile using only the GitHub marketplace instructions: no manual clone or local path. Record VS Code version, package version, date and results, redacting account data.

Local OAuth: **pending manual verification**. Published GitHub marketplace installation: **pending publication and manual verification**. Gateway/auth failures block release verification; do not change shared service behavior to work around them.

## Updates and removal

For marketplace installs, run **Extensions: Check for Extension Updates** and update **opsphere-vscode** in Agent Plugins. Use the same Extensions/Agent Customizations interface used to install it; chat `/plugin` operations may use a different inventory.

To disable or uninstall, open Extensions → Agent Plugins, select **opsphere-vscode** and use **Disable** or **Uninstall**. For local development, remove only this package's `chat.pluginLocations` entry and reload; preserve other registrations. Uninstalling a plugin does not delete your Opsphere account or integrations.

For local clones, update with `git pull --ff-only` and reload. Check out a published tag or commit for reproducible local testing. A full checkout is required for the existing repository-wide `npm test` suite (Git Bash on Windows or a Unix shell); sparse checkout supports the package-local checks only.

## Troubleshooting and boundaries

- Missing marketplace entry: verify publication, repository access and marketplace spelling, then refresh/reload. Do not install the root plugin as a substitute.
- Authentication cancellation or expiration: open **MCP: List Servers**, select Opsphere and follow its authentication prompt. After `invalid_grant`, stop tool retries until browser sign-in completes. Share only redacted errors with support.
- Network/5xx errors: check reachability and retry with bounded backoff; preserve saved credentials. Respect 429 `Retry-After`.
- Tools listed but unavailable: tool discovery is not authorization. Respect the active workspace, plan, integrations and permissions. Do not reconnect merely to change workspaces in stable catalog mode.
- v1 targets desktop VS Code with Copilot. Remote environments and cloud agents are outside the verified scope. Existing Cursor, Codex, Claude Code, Copilot CLI, Antigravity, Warp and OpenCode packages are unchanged.

Skills in this folder are a versioned snapshot. Future updates should be deliberately ported and validated here; existing shared generators do not write this package.

See [VS Code agent plugins documentation](https://code.visualstudio.com/docs/agent-customization/agent-plugins) for supported installation and local registration behavior. Support: [contact@opsphere.io](mailto:contact@opsphere.io).
