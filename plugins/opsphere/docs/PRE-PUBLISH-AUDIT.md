# Pre-publish audit — Opsphere plugin (Codex / OpenAI directory)

**Purpose:** Checklist before submitting Opsphere to the **public OpenAI plugins directory** or any external marketplace review beyond the existing Git marketplace.

**Related:** [SECURITY-AND-TRUST.md](SECURITY-AND-TRUST.md) (Cursor copy-paste) · [CODEX-TEST-CASES.md](CODEX-TEST-CASES.md) · [INSTALL.md](INSTALL.md#codex--chatgpt)

**Last run:** 2026-07-20 (securing branch — public repo URL, demo re-check, Gitleaks investigation)

---

## 1. Git history and sensitive content

### 1.1 Automated scans (run before every publish request)

```bash
# From repo root
npm test                    # scripts/ci-validate.sh
# CI also runs Gitleaks on full history — see .github/workflows/ci.yml
```

| Check | Command / location | Pass criteria |
|-------|-------------------|---------------|
| Manifest hygiene | `npm test` | `=== done (failures: 0) ===` |
| Secret patterns (HEAD) | `ci-validate.sh` §7 | No `AKIA…`, `ghp_…`, `sk-…` in tracked files |
| Private IPs (HEAD) | `ci-validate.sh` §8 | No `10.x`, `192.168.x`, `172.16–31.x` literals |
| Gitleaks (history) | GitHub Actions `CI` job | Green on `main` |
| `.env` not committed | `ci-validate.sh` §4 | `.env` gitignored and absent |

**2026-07-20 baseline:** `npm test` passed locally (0 failures).

**2026-07-20 Gitleaks investigation:** `gitleaks detect` on full `opsphere-io/opsphere-plugin` mirror → **no leaks**. The 2026-07-18 CI failure was **`gitleaks/gitleaks-action@v2` license gate** (`opsphere-io` is a GitHub Organization; the action requires `GITLEAKS_LICENSE` or the MIT CLI binary). Fixed in `.github/workflows/ci.yml` (run `gitleaks` binary directly).

### 1.2 Manual history searches (client PII / internal docs)

Run from repo root. Investigate any hit **before** public directory submission.

```bash
# Client or tenant names that must not appear in public history
git log --all -S'<internal_client_name>' --oneline
git log --all -S'<internal_client_email_domain>' --oneline

# Real reviewer emails / personal accounts
git log --all -S'@gmail.com' --oneline

# AWS / API key prefixes
git log --all -S'AKIA' --oneline
git log --all -S'ghp_' --oneline
```

| Finding | Action |
|---------|--------|
| Hit only in **old** commits, **absent** on `main` HEAD | Document below; consider `git filter-repo` if strings are customer PII |
| Hit on **current** `main` | **Block publish** — remove in PR, re-run audit |
| Only generic examples (`tenant_id`, `contact@opsphere.io`) | OK |

**2026-07-17 notes:**

- `<internal_client_name>` appears in **historical** commits (sanitized in `4d61ca2 feat(codex): scaffold Codex plugin and sanitize docs`). **Not present** in current tree (`rg -i <internal_client_name>` → 0).
- `@gmail.com` only in initial release commits — verify no real addresses remain in blob content.
- No `AKIA` / `ghp_` in history search sample.

### 1.3 `git filter-repo` decision

Use **only** if manual review finds irrecoverable PII or secrets in history that Gitleaks or reviewers would flag.

```bash
# Example — adjust paths/strings after legal review
# pip install git-filter-repo
# git filter-repo --path-glob 'docs/*' --replace-text expressions.txt
```

After filter-repo: force-push coordination, re-clone for all contributors, re-run Gitleaks.

| Decision | Status |
|----------|--------|
| filter-repo required? | **No** — HEAD clean; historical `breitling` only in old commits; no real secrets in history |

---

## 2. Current tree — PII and client data

Scan tracked files (not git history):

```bash
rg -i '<internal_client_name>|gmail\.com|@[a-z0-9.-]+\.(internal|local)' --glob '!node_modules'
rg 'AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}' 
```

| Item | Status |
|------|--------|
| Customer tenant slugs / emails | ✅ None in HEAD (2026-07-17) |
| Private hostnames / RFC1918 IPs | ✅ `ci-validate` clean |
| Embedded API keys | ✅ `ci-validate` clean |
| `_internal/` tracked | ✅ Not tracked |

**Allowed public strings:** `contact@opsphere.io`, `mcp-cursor.opsphere.io`, `opsphere.io`, example hostnames (`example.com`), env var **names** in docs (not values).

---

## 3. Bundle hygiene (Codex + Cursor)

| Requirement | Evidence |
|-------------|----------|
| Markdown + JSON only in bundle | No binaries except `assets/*` images |
| No `hooks/hooks.json` / workspace-open shell | `ci-validate` §3 |
| No install lifecycle in `package.json` | `ci-validate` §5 |
| Only maintainer scripts in `scripts/` | `ci-validate.sh`, `codex-install.sh`, `codex-mcp-config.sh` |
| Single public MCP URL | `mcp.json` + `.mcp.json` → `https://mcp-cursor.opsphere.io/mcp` |
| Codex manifest valid | `.codex-plugin/plugin.json` v1.0.2, `ci-validate` §16 |

---

## 4. Legal and manifest URLs

| Field | Value | Live? |
|-------|-------|-------|
| `interface.privacyPolicyURL` | `https://opsphere.io/en/privacy` | ✅ HTTP 200 (2026-07-17) |
| `interface.termsOfServiceURL` | `https://opsphere.io/en/terms` | ✅ HTTP 200 (2026-07-17) |
| `homepage` | `https://opsphere.io` | ✅ |
| `repository` | `https://github.com/opsphere-io/opsphere-plugin` | Public |

**Legal coherence review (2026-07-20):** `docs/PRIVACY.md` + `SECURITY.md` match product behavior (thin client, remote MCP, `ops_configure_integration` only path for secrets, tenant isolation, OAuth PKCE, usage limits, revocation). Website policies at `/en/privacy` and `/en/terms` cover the same model (MCP gateway, encrypted integration creds, no sale of personal data, free tier/limits). **Optional hardening before OpenAI portal:** add “ChatGPT/Codex plugin” alongside Cursor in website intro, and mirror the explicit **no AI model training** sentence from `docs/PRIVACY.md` onto opsphere.io (currently only in repo docs).

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://opsphere.io/en/privacy
curl -sS -o /dev/null -w '%{http_code}\n' https://opsphere.io/en/terms
```

---

## 5. Remote MCP disclosure (reviewer narrative)

Copy-paste block for OpenAI submission — same substance as [SECURITY-AND-TRUST.md](SECURITY-AND-TRUST.md):

- Thin client; **all tools execute on** `https://mcp-cursor.opsphere.io/mcp`.
- OAuth 2.0 + PKCE; tokens stored by Codex/Cursor host, not in plugin files.
- Integration secrets only via `ops_configure_integration` after explicit user action.
- Per-tenant isolation on gateway (backend not in this repo).
- **Codex CLI path:** users run `codex-mcp-config.sh` + `codex mcp login opsphere` (see [INSTALL.md](INSTALL.md)).

---

## 6. Demo account (required for directory review)

| Item | Status |
|------|--------|
| Dedicated Community tenant (`demo-c3c991`) | ✅ `demo@opsphere.io` — `POST /api/plugin/login` → 200, tenant `demo-c3c991`, plan `public_free` (2026-07-20) |
| Read-only integrations (sandbox Datadog or none) | ✅ None configured (Community defaults) |
| Credentials for OpenAI reviewers | ✅ In [CODEX-TEST-CASES.md](CODEX-TEST-CASES.md) §5 (public demo password) |
| Documented in [CODEX-TEST-CASES.md](CODEX-TEST-CASES.md) § Prerequisites | ✅ |

---

## 7. Sign-off checklist

Complete before clicking **Submit** on OpenAI directory:

- [x] `npm test` green (`ci-validate.sh` — 0 failures, 2026-07-20)
- [ ] GitHub `CI` green on `main` after merge (validate + Gitleaks CLI — re-run post-merge)
- [x] §1.2 manual history review documented (no blockers; filter-repo **not** required)
- [x] §2 PII scan on HEAD clean
- [x] Privacy + Terms URLs return 200 (`curl` → 200 both, 2026-07-17)
- [x] [CODEX-TEST-CASES.md](CODEX-TEST-CASES.md) attached / linked
- [x] Demo account active (`demo@opsphere.io` — credentials in CODEX-TEST-CASES §5; login verified 2026-07-20)
- [x] `.codex-plugin/plugin.json` at **1.0.2** (Codex OpenAI submission version)
- [x] `CHANGELOG.md` updated for 1.0.2
- [ ] Git tag + GitHub Release on `main` after merge (see § release freeze)

| Role | Name | Date | Approved |
|------|------|------|----------|
| Engineering | Jose Ariza | 2026-07-20 | ✅ (docs + demo + Gitleaks root cause) |
| Legal / privacy | Jose Ariza | 2026-07-20 | ✅ (docs + website aligned; optional Codex/no-training line on site) |

---

## 8. Out of scope (this audit)

- Gateway backend penetration test — separate ops process
- Fase 4 Apps SDK / ChatGPT desktop DCR
- Cursor Marketplace re-submission (use [SECURITY-AND-TRUST.md](SECURITY-AND-TRUST.md) directly)
