# Opsphere Plans

Commercial tiers for the Cursor plugin (remote MCP at `mcp-cursor.opsphere.io`).  
Paid plans are provisioned by Opsphere — not self-serve Sign up.

| | **Community** | **Professional** | **Team** | **Enterprise** |
|---|:---:|:---:|:---:|:---:|
| **Who** | Sign up / OAuth (individual) | Small teams (contact sales) | Org tenants (invite) | Custom contracts |
| **Personal Workspace** | Automatic at signup | Automatic | Automatic | Automatic |
| **External workspaces** | Not included (upgrade) | Per plan quota | Per plan quota | Custom |
| **MCP tools** | Community operational catalog (gateway is source of truth) | Expanded catalog | Full catalog | Full + custom |
| **Daily tool calls** | 100 / day (UTC) | Unlimited | Unlimited | Unlimited |
| **Trial** | 30 days | — | — | — |
| **Write / mutate infra** | No (read-only) | Yes | Yes | Yes |
| **Environments per request** | 1 | Multiple | Multiple | Multiple |
| **Premium providers** | — | Partial | K8s, ArgoCD, Azure, Akamai, Pingdom, … | All |
| **Configure integrations** | Plugin (`ops_configure_integration`) | Plugin + admin | Admin portal (primary) + plugin | Admin portal (primary) |
| **Enable MCP modules (Tools page)** | Plan matrix only (premium toggles blocked) | Admin portal | Admin portal | Admin portal |
| **Operational memory** | Yes | Yes | Yes | Yes |
| **Outage triage subagent** (`/outage-triage`) | Yes | Yes | Yes | Yes |
| **Endpoint health subagent** (`/endpoint-health`) | Yes | Yes | Yes | Yes |
| **Post-mortem writer subagent** (`/postmortem-writer`) | Yes | Yes | Yes | Yes |
| **CI Investigator subagent** (`/ci-investigator`) | No | Yes | Yes | Yes |
| **Users** | 1 | Up to 5 | Up to 20 | Custom |

## Community (free trial)

- **Connect** via Cursor OAuth (Sign up free / login) → Hub + **Personal Workspace** automatic (`subscription_id: community`).
- Operational tools available immediately — no manual Personal Workspace link and no manual session open for normal use.
- **Work Context** is optional stack notes; **External workspaces** require upgrade.
- Network tools (`dns_lookup`, `http_check`, `cert_status`) work immediately — no credentials.
- Check status anytime: **`ops_my_usage`** or _"Show my usage"_ in chat.
- **Basic CI in chat** — `bb_pipeline_diagnose`, `ghe_actions_latest` (not the **`/ci-investigator`** subagent; see below).
- **Developer** plan features are only available when that plan is enabled for the account — do not assume Developer is globally on.

After trial or when you need write access / external workspaces / full catalog → [opsphere.io/pricing](https://opsphere.io/pricing).

## Professional

- Expanded MCP catalog (includes `ghe_actions_diagnose` and related GitHub CI tools).
- **`/ci-investigator`** subagent — structured diagnosis for failed GitHub Actions and Bitbucket pipelines.
- Unlimited daily tool calls; write/mutate tools enabled.

Contact sales via [opsphere.io/pricing](https://opsphere.io/pricing).

## Team / Enterprise (invite)

Your org admin provisions access (e.g. `user@company.com` → your organization workspace).

- Full tool surface (200+ tools in Cursor).
- **`/ci-investigator`** subagent for multi-step CI failures (GitHub + Bitbucket).
- No daily rate limit.
- No read-only gate.
- **Connection Hub:** when you accept an admin invitation with the **same email** as your Hub on **Developer** or higher, that organization workspace is typically **linked automatically** — confirm with `ops_accounts_list`. Use **`/link-account`** if emails differ or you need to link manually.

Use **`ops_my_usage`** to confirm plan name and enabled tool count.

## Error codes (Community)

| Code | Meaning |
|------|---------|
| `TRIAL_EXPIRED` | 30-day trial ended — upgrade required |
| `RATE_LIMIT_EXCEEDED` | 100 daily calls used |
| `READ_ONLY_PLAN` | Mutating tool blocked on Community |
| `PLAN_TOOL_NOT_INCLUDED` | Tool / module outside the plan allow-list |
| `SINGLE_ENVIRONMENT_ONLY` | More than one env in a single request |

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and the plugin onboarding rule for agent behavior.
