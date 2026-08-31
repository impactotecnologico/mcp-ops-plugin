---
name: opsphere-connect-another-client
description: Connect your existing Opsphere account to Cursor, Codex, Claude Code, Warp, or another MCP client.
---

# Connect Opsphere to another client

Follow [`skills/connect-another-client/SKILL.md`](../skills/connect-another-client/SKILL.md).

Ask which client the user wants to connect, show only the relevant configuration, and guide its normal OAuth flow. Reuse the same account email; never copy or request tokens.

When available, begin with `ops_my_usage` to confirm the current account and plan. Explain the difference between connecting only the MCP and installing the destination's plugin/package. Finish by verifying `ops_my_usage` and `ops_accounts_list`, without changing workspace automatically.

For Warp, explain that local MCP access is available across all Opsphere plans, without a per-user invitation; account permissions and quotas still apply. Configure the remote Streamable HTTP endpoint `https://mcp-cursor.opsphere.io/mcp` and offer the optional `opsphere-warp/` package for skills/rules. Explain that Opsphere OAuth MCP is not available inside Warp/Oz cloud environments.

Apply the skill's Warp-specific checks. Give literal, copyable JSON, the Settings > Agents > MCP servers enablement step, and explicit project approval. If the user wants Personal, tell them to select Personal Workspace in the OAuth picker. Offer the optional package only with a verified public download or the support fallback; never assume access to the private repo. Cloud restrictions here are Opsphere's current support boundary. Callback registration failures happen before login and are not account eligibility failures.

**Claude Code:** invoke as `/opsphere:opsphere-connect-another-client`.
