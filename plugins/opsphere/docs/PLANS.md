# Opsphere plans and tool availability

Opsphere exposes a tenant-specific tool catalog through the remote MCP gateway at `mcp-cursor.opsphere.io`. PostgreSQL plan entitlements are authoritative; the plugin bundle does not grant tools and no client-side list can bypass the gateway.

## Current plans

| | **Community** | **Developer** | **Team** | **Enterprise / Custom** |
|---|:---:|:---:|:---:|:---:|
| **Intended use** | Individual operational workspace | Individual builders and small technical teams | Organization tenants | Organizations with unrestricted or contractual catalogs |
| **Counted-tool ceiling** | 100 | 250 | 400 | Unlimited |
| **Plan membership** | Curated individual-tool grants | Broader curated individual-tool grants | Broad curated individual-tool grants | Every globally available tool |
| **Personal Workspace** | Automatic at signup | Automatic | Automatic | Automatic |
| **External workspaces** | Not included | Per-plan quota | Per-plan quota | Contractual quota |
| **Write / mutate infrastructure** | Read-only plan boundary | Subject to policy and approval | Subject to policy and approval | Subject to policy and approval |
| **Configure tenant modules** | Within the Community catalog | Within the Developer catalog | Within the Team catalog | Within the globally available catalog |
| **Administration surface** | Plugin/chat | Plugin and admin when enabled | Admin portal | Admin portal |

The ceiling is not a promise that every account will see exactly that number. Tool availability is the intersection of:

1. the tool being globally available;
2. the tool being included in the tenant's plan;
3. the module being enabled for that tenant and runtime;
4. required integration credentials and Cloud Catalog context being configured; and
5. the gateway's security and execution-policy checks.

`ops_*` control-plane tools do not consume the 100/250/400 counted-tool capacity, but capped plans still need an explicit entitlement for them. Tools in the `repo` and `repos` modules are globally disabled because the gateway cannot safely use repositories from the user's local computer.

## How to know what you can use

- Trust the current MCP `tools/list` for the signed-in user, active workspace, and runtime.
- Use `ops_my_usage` to confirm the current plan and workspace.
- A tool shown by stable discovery is still subject to server-side authorization when called.
- The platform administrator can change plan membership without a plugin update, so static screenshots and historical tool totals are informational only.

Agents and skills must never invent a tool or assume that a paid plan has a fixed "full catalog". If an optional tool is absent, use an advertised alternative or explain the plan/configuration gap.

## Tenant administrators

Tenant administrators enable or disable modules and configure integrations only inside the catalog allowed by their plan. Enabling a tenant module never expands the plan. When the plan excludes a tool, the gateway returns `PLAN_TOOL_NOT_INCLUDED` even if stale tenant configuration still references its module.

## Platform administrators

Platform administrators manage individual tools and whole modules for Community, Developer, and Team in the admin portal. Totals are derived from the selected individual tools. Enterprise and Custom are unlimited and receive every globally available tool automatically; they do not use per-tool grant rows.

## Community

- Personal Workspace is created automatically after signup.
- Network and other curated operational tools can work immediately; integrations that need credentials must be configured first.
- External workspaces, mutating operations, and non-entitled tools remain unavailable.
- Use `ops_my_usage` for trial and daily usage status.

## Developer, Team, Enterprise, and Custom

- The visible catalog grows according to plan entitlements and tenant configuration.
- External workspace quota, execution budgets, sensitive actions, and approvals remain separate controls; tool membership does not disable them.
- Organization workspaces are administered at [admin.opsphere.io](https://admin.opsphere.io) when the account exposes that surface.

## Common errors

| Code | Meaning |
|------|---------|
| `PLAN_TOOL_NOT_INCLUDED` | The individual tool is not included in the current plan |
| `READ_ONLY_PLAN` | The plan blocks a mutating operation |
| `TRIAL_EXPIRED` | The trial ended |
| `RATE_LIMIT_EXCEEDED` | The daily usage limit was reached |
| `SINGLE_ENVIRONMENT_ONLY` | The request exceeds the plan's environment scope |

See [TOOLS.md](TOOLS.md) for tool behavior and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for recovery guidance.
