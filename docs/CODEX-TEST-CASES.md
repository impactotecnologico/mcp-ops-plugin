# Codex CLI — test cases for OpenAI reviewers

**Plugin:** Opsphere (`opsphere@opsphere` 1.0.2)  
**MCP gateway:** `https://mcp-cursor.opsphere.io/mcp`  
**Official client paths:** **Codex CLI** (validated E2E) and **ChatGPT desktop** (install + Try now; OAuth on install).

**Related:** [INSTALL.md](INSTALL.md#codex--chatgpt) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md#codex--chatgpt-cli) · [PRE-PUBLISH-AUDIT.md](PRE-PUBLISH-AUDIT.md)

---

## Prerequisites (reviewer machine)

### 1. Install plugin marketplace

```bash
npx @openai/codex plugin marketplace add opsphere-io/opsphere-plugin --ref main
```

Enable **Opsphere** in Codex plugins (`opsphere@opsphere`).

### 2. Configure MCP (one-time)

From a clone or use the helper script:

```bash
git clone https://github.com/opsphere-io/opsphere-plugin.git
cd opsphere-plugin
./scripts/codex-mcp-config.sh
```

This appends to `~/.codex/config.toml` (optional for desktop — `.mcp.json` in the plugin already bundles the same OAuth metadata):

- `[mcp_servers.opsphere]` with `User-Agent = codex-mcp/1.0`
- `[mcp_servers.opsphere.oauth] client_id = codex-mcp`

### 3. OAuth login (**outside** an interactive Codex session)

```bash
npx @openai/codex mcp login opsphere
# Browser opens → Sign up OR Log in on Opsphere gateway
```

### 4. Start Codex (cold start)

```bash
npx @openai/codex
```

**Success:** no banner `MCP startup incomplete (failed: opsphere)`.

### 5. Sign in (OpenAI reviewers)

At the OAuth browser step (`codex mcp login opsphere`):

- **Self-sign-up** with any email (free Community trial, no credit card) — recommended for reviewers.
- Or email **contact@opsphere.io** to request sandbox credentials (not published in this repo).

Gateway signup requires passwords **≥ 8 characters**.

---

## Test case 1 — Plan and usage (`ops_my_usage`)

**Goal:** Confirm OAuth, MCP connection, and tenant provisioning.

**Prompt in Codex chat:**

```text
What is my Opsphere plan and usage? Summarize in plain language — do not show raw JSON.
```

**Expected:**

| Field | Expected value |
|-------|----------------|
| Plan | `Community` (or paid plan if upgraded) |
| Status | Active |
| Daily usage | `N / 100` calls |
| Integrations | `0` (fresh account) or configured list for your tenant |
| Work context | `Not configured` (acceptable) |
| Upgrade link | `https://opsphere.io/pricing` |

**Fail if:** Tool not exposed; 401/403 on MCP; empty error without OAuth prompt.

---

## Test case 2 — Endpoint health (public hostname)

**Goal:** Read-only diagnostics without integrations.

**Prompt:**

```text
@endpoint-health Is https://opsphere.io up? Check DNS, HTTP, and TLS certificate.
```

**Expected:**

- Skill `endpoint-health` invoked (or equivalent tool sequence).
- `dns_lookup` → `NOERROR` on public resolvers.
- `http_check` → `200` for `https://opsphere.io`.
- `cert_status` → `valid: true`, `daysUntilExpiry` > 0.
- Verdict: **healthy** (or equivalent).

**Fail if:** MCP tools not called; all steps error with auth failure.

---

## Test case 3 — Incident investigation (no integrations)

**Goal:** Multi-step skill; graceful degradation without Datadog.

**Prompt:**

```text
@incident-investigation Is https://opsphere.io down right now?
```

**Expected:**

- External checks pass (HTTP, DNS, TLS) — same as TC2.
- If `dd_logs_search` runs without Datadog configured: error like `api.undefined` or clear “integration not configured” — **acceptable**.
- Verdict: site **up** / **inconclusive** on internal observability — **not** “down” based on external checks alone.

**Fail if:** MCP session dead; skill not found; unhandled gateway 500.

---

## Test case 4 — CI investigation plan gate (Community)

**Goal:** Paid feature blocked on Community with upgrade path.

**Prompt:**

```text
@ci-investigation Why did CI fail on main for my-repo?
```

**Expected (Community tenant):**

- Skill calls `ops_my_usage` first (or states Community plan).
- Does **not** successfully run `ghe_actions_diagnose` / `bb_pipeline_diagnose` (Team+ tools).
- User directed to upgrade at `https://opsphere.io/pricing` or read-only alternative documented in skill.

**Fail if:** Full pipeline diagnose runs on Community without upgrade.

---

## Test case 5 — OAuth re-authentication

**Goal:** Token lifecycle and MCP reconnect.

**Steps:**

1. `npx @openai/codex mcp logout opsphere`
2. `npx @openai/codex` → expect MCP **not** connected for opsphere.
3. `npx @openai/codex mcp login opsphere` (terminal, not inside Codex chat).
4. New `npx @openai/codex` session → TC1 passes again.

**Expected:** Login succeeds; TC1 passes after cold start.

**Note:** Login **inside** an active Codex chat does not reload MCP — by design.

---

## Test case 6 — Configure integration (optional)

**Goal:** Guided onboarding skill (no secret required to pass).

**Prompt:**

```text
@configure-integration I want to connect Datadog read-only.
```

**Expected:**

- Skill asks clarifying questions (site, API key, etc.).
- Does **not** instruct user to paste secrets into repo files.
- Points to `ops_configure_integration` when user supplies credentials.

**Skip** if reviewer has no sandbox API key.

---

## Test case 7 — Gateway health (smoke)

**Shell only — no Codex required:**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -H 'User-Agent: codex-mcp/1.0' \
  https://mcp-cursor.opsphere.io/health
curl -sS -H 'User-Agent: codex-mcp/1.0' \
  https://mcp-cursor.opsphere.io/.well-known/oauth-protected-resource
```

**Expected:** HTTP `200` on `/health`; JSON with `resource` and `authorization_servers` on PRM endpoint.

---

## Test case 8 — ChatGPT desktop (optional)

**Goal:** End-user UI path (not CLI).

**Prerequisites:** Developer mode on; plugin **1.0.2+** with enriched `.mcp.json`.

**Steps:**

1. Add Git marketplace: `https://github.com/opsphere-io/opsphere-plugin`
2. Install **Opsphere** → complete OAuth if browser opens (on install).
3. Open plugin detail → **Try now** (no Connect button on this page — expected).
4. Ask: *"What is my Opsphere plan and usage?"* or `@endpoint-health` on a hostname.

**Expected:** Model calls `ops_my_usage` or skill tools; no `No authorization support detected`. Response is **conversational prose**, not a raw `json` code block of the MCP envelope.

**Fail if:** MCP never authenticates after install; check **Settings → MCP** or `/mcp` for reconnect. **Fail if:** assistant dumps full tool JSON unless user asked for debug output.

---

## Summary matrix

| TC | Area | Blocker? |
|----|------|----------|
| 1 | OAuth + MCP + usage | **Yes** |
| 2 | Diagnostics tools | **Yes** |
| 3 | Incident skill | **Yes** |
| 4 | Plan gating | **Yes** |
| 5 | Re-auth | Recommended |
| 6 | Integration skill | Optional |
| 7 | Gateway smoke | **Yes** |
| 8 | ChatGPT desktop | Optional |

---

## Troubleshooting (reviewers)

| Symptom | Fix |
|---------|-----|
| No **Connect** on plugin detail page | Expected — OAuth on **Install** or **Try now** / MCP settings |
| Desktop shows plugin **1.0.0** | Reinstall from marketplace after pull **1.0.2+** |
| `No authorization support detected` | Update plugin; `.mcp.json` must include `client_id` + `User-Agent` |
| `MCP startup incomplete` | Run `mcp login` **before** starting Codex; use new session |
| Tools not exposed after login in same chat | Exit Codex; login in terminal; start fresh session |
| OAuth 403 on authorize | Contact `contact@opsphere.io` (WAF / redirect_uri) |

Full guide: [TROUBLESHOOTING.md#codex--chatgpt-cli](TROUBLESHOOTING.md#codex--chatgpt-cli)

---

## Contact

**Opsphere:** contact@opsphere.io  
**Repository:** https://github.com/opsphere-io/opsphere-plugin
