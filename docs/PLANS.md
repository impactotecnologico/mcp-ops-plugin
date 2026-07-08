# Opsphere Plans

Commercial tiers for the Cursor plugin (remote MCP at `mcp-cursor.opsphere.io`).  
Paid plans are provisioned by Opsphere — not self-serve Sign up.

| | **Community** | **Professional** | **Team** | **Enterprise** |
|---|:---:|:---:|:---:|:---:|
| **Who** | Sign up / OAuth (individual) | Small teams (contact sales) | Org tenants (e.g. Breitling) | Custom contracts |
| **MCP tools** | ~30 read-focused | Expanded catalog | Full catalog (~215) | Full + custom |
| **Daily tool calls** | 100 / day (UTC) | Unlimited | Unlimited | Unlimited |
| **Trial** | 30 days | — | — | — |
| **Write / mutate infra** | No (read-only) | Yes | Yes | Yes |
| **Environments per request** | 1 | Multiple | Multiple | Multiple |
| **Premium providers** | — | Partial | K8s, ArgoCD, Azure, Akamai, Pingdom, … | All |
| **Operational memory** | Yes | Yes | Yes | Yes |
| **Outage triage subagent** (`/outage-triage`) | Yes | Yes | Yes | Yes |
| **Endpoint health subagent** (`/endpoint-health`) | Yes | Yes | Yes | Yes |
| **Post-mortem writer subagent** (`/postmortem-writer`) | Yes | Yes | Yes | Yes |
| **CI Investigator subagent** (`/ci-investigator`) | No | Yes | Yes | Yes |
| **Users** | 1 | Up to 5 | Up to 20 | Custom |

## Community (free trial)

- **Connect** via Cursor OAuth → creates an isolated tenant (`subscription_id: community`).
- **~30 tools** across Datadog, Vercel, GitHub, Bitbucket, Cloudflare, Sentry, Jira, AWS (CLI), diagnostics, memory, and integration setup.
- **Network tools** (`dns_lookup`, `http_check`, `cert_status`) work immediately — no credentials.
- Check status anytime: **`ops_my_usage`** or _"Show my usage"_ in chat.
- **Basic CI in chat** — `bb_pipeline_diagnose`, `ghe_actions_latest` (not the **`/ci-investigator`** subagent; see below).

After trial or when you need write access / full catalog → [opsphere.io/pricing](https://opsphere.io/pricing).

## Professional

- Expanded MCP catalog (includes `ghe_actions_diagnose` and related GitHub CI tools).
- **`/ci-investigator`** subagent — structured diagnosis for failed GitHub Actions and Bitbucket pipelines.
- Unlimited daily tool calls; write/mutate tools enabled.

Contact sales via [opsphere.io/pricing](https://opsphere.io/pricing).

## Team / Enterprise (invite)

Your org admin provisions access (e.g. `jose.ariza@breitling.com` → tenant `breitling`, plan `team`).

- Full tool surface (200+ tools in Cursor).
- **`/ci-investigator`** subagent for multi-step CI failures (GitHub + Bitbucket).
- No daily rate limit.
- No read-only gate.

Use **`ops_my_usage`** to confirm plan name and enabled tool count.

## Error codes (Community)

| Code | Meaning |
|------|---------|
| `TRIAL_EXPIRED` | 30-day trial ended — upgrade required |
| `RATE_LIMIT_EXCEEDED` | 100 daily calls used |
| `READ_ONLY_PLAN` | Mutating tool blocked on Community |
| `SINGLE_ENVIRONMENT_ONLY` | More than one env in a single request |

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and the plugin onboarding rule for agent behavior.
