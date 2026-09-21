# Tool security review for contributors

Gateway R06 adds an explicit, versioned security inventory for new MCP tools. This is gateway build/CI validation; the plugin does not enforce it locally and does not grant execution permissions from discovery metadata.

When documenting or exposing a new remote tool:

1. Coordinate the gateway PR with its `scripts/tool-security/manifest.json` entry, DB module registration and execution metadata. Do not infer safety from a read-sounding name.
2. Link the handler security review and positive/denial tests. Stateful tools must meet the gateway release policy; historical exemptions cannot be extended to new tools.
3. Update tool descriptions/skills and credential guidance only where that capability needs them. Preserve plan, tenant and active-work-context restrictions. An item in the public catalog does not imply access.
4. Record the gateway release-gate result and consumed DB version before calling the control operational. Plugin manifest validation alone is not evidence that gateway checks ran.

Initial status (2026-09-19): implemented and tested locally in the gateway; remote CI rollout not verified. Fourteen legacy gateway classification gaps are explicitly frozen pending separate review. This is not an OWASP certification or a guarantee of secure tool behavior.

No plugin runtime, MCP endpoint, session flow, tool count, credential field or version changes are required by this CI-only change. The canonical procedure is `mcp-ops/docs/tool-security-ci.md` alongside `docs/may-2026/adding-tools-mayo-2026.md` in the gateway repository.
