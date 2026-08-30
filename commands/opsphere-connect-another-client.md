---
name: opsphere-connect-another-client
description: Connect your existing Opsphere account to Cursor, Codex, Claude Code, Warp, or another MCP client.
---

# Connect Opsphere to another client

Follow [`skills/connect-another-client/SKILL.md`](../skills/connect-another-client/SKILL.md).

Ask which client the user wants to connect, show only the relevant configuration, and guide its normal OAuth flow. Reuse the same account email; never copy or request tokens.

For Warp, configure the remote Streamable HTTP endpoint `https://mcp-cursor.opsphere.io/mcp` in Warp local. Explain that Opsphere OAuth MCP is not available inside Warp/Oz cloud environments.

**Claude Code:** invoke as `/opsphere:opsphere-connect-another-client`.

