# Recommended local profile: Opsphere investigation

Create a Warp Agent Profile using the settings available in your installed version:

- Enable only the Opsphere MCP server needed for this task.
- Require approval for mutating MCP operations, shell commands, file writes and external changes. Do not use unrestricted auto-approval.
- Scope file access to the intended project; choose the model yourself.
- Include the repository AGENTS.md and the installed skills. Do not add competing WARP.md rules.

This is a settings checklist, not an importable profile or security boundary. The live gateway still enforces plan/workspace permissions. A profile does not change the Opsphere runtime profile.

For the locally inspected Oz CLI, select an existing profile with `--profile <profile-id>` on `oz agent run`. Obtain the ID from Warp; never invent one. Cloud profiles are not part of this package.

Reference: [Warp Agent Profiles](https://docs.warp.dev/reference/cli/agent-profiles). Warp now documents a replacement Agent CLI; check your installed command's help rather than assuming CLI versions are interchangeable.
