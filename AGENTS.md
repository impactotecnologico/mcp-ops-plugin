# mcp-ops-plugin agent instructions

## Cursor Cloud Agent (`opsphere-plugin`)

Environment **`opsphere-plugin`** (`impactotecnologico/mcp-ops-plugin`). No npm runtime dependencies.

| Allowed | Forbidden |
|---------|-----------|
| Manifest, rules, skills, docs sync scripts | Committing secrets; marketplace publish without human process |

**Build:** Node **22.x**, no install step. **Runtime:** `npm test` (`npm run validate`) before PR. Do not treat Cursor's `validate-plugins.mjs` as a release gate here: per-channel versions in `.cursor-plugin`, `.codex-plugin`, and `.claude-plugin` are intentional; `ci-validate.sh` enforces Cursor marketplace sync and Codex/Claude manifest rules separately.

After gateway releases: update `docs/TOOLS.md`, ChatGPT submission JSON (generated from ops-b), portable skill sync per add-mcp-tool phase 6.
