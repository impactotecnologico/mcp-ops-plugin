# Local examples

After installation and independent MCP authorization, ask Warp:

- “Use opsphere-onboarding to show my plan and active workspace. Do not change anything.”
- “Use endpoint-health to check https://example.com. Read-only; do not change infrastructure.”
- “Use configure-integration to show whether I can connect Datadog here. Do not collect secrets in chat.”
- “Use set-work-context to review my provider notes before updating them.”
- “Use connect-another-client to help me use the same account in another app.”

For the inspected local Oz CLI, run from your project:

```sh
oz agent run --skill opsphere-onboarding --mcp /path/to/opsphere-warp/mcp/oz-local.json --profile <profile-id> --strict-mcp-startup
```

Use the real package path and an existing profile ID from Warp. Check `oz agent run --help` first. Complete Opsphere OAuth in desktop before this command; if the CLI cannot reuse authorization, stop and use the desktop conversation rather than copying credentials. The CLI JSON shape differs from desktop's mcpServers wrapper and is generated from the same endpoint. No token belongs in the command. Do not use `run-cloud`.

References: [local CLI](https://docs.warp.dev/reference/cli) and [skills](https://docs.warp.dev/reference/cli/skills). The examples do not claim that your local credentials are cloud-compatible.
