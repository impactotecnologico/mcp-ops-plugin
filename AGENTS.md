# mcp-ops-plugin agent instructions

## Cursor Cloud Agent (`opsphere-plugin`)

Environment **`opsphere-plugin`** (`impactotecnologico/mcp-ops-plugin`). No npm runtime dependencies.

| Allowed | Forbidden |
|---------|-----------|
| Manifest, rules, skills, docs sync scripts | Committing secrets; marketplace publish without human process |

**Build:** Node **22.x**, no install step. **Runtime:** `npm test` (`npm run validate`) before PR.

After gateway releases: update `docs/TOOLS.md`, ChatGPT submission JSON (generated from ops-b), portable skill sync per add-mcp-tool phase 6.
