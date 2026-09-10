# Opsphere Warp agent catalog

Use these portable skills as focused local agents:

| Agent intent | Skill |
|---|---|
| Check DNS, HTTP and TLS for one endpoint | `endpoint-health` |
| Triage an outage or widespread degradation | `incident-investigation` |
| Diagnose a failed CI/CD workflow | `ci-investigation` |
| Produce a structured incident postmortem | `postmortem-writer` |
| Design QA cases and investigate a suspected bug | `qa-test-investigation` |
| Assess whether a release is ready to promote | `qa-release-readiness` |
| Start and verify account/workspace | `opsphere-onboarding` |
| Connect the same account in another app | `connect-another-client` |
| Configure an eligible provider securely | `configure-integration` |
| Review or update provider/account notes | `set-work-context` |

Each skill begins with live MCP discovery. They are not MCP tools and do not carry credentials. Oz cloud execution is unsupported until Opsphere provides workload or delegated identity.
