# R08 — Supply chain controls

Implemented locally on 2026-09-19; remote rollout unverified. Run `scripts/supply-chain/check.mjs` and `scripts/supply-chain/supply-chain.test.mjs` after installing the locked CI tools under `.github/supply-chain-tools`.

Reviewed pins are in `.github/supply-chain-policy.json`. Actions use upstream commit SHAs, direct npm versions (where applicable) match the existing lock resolution, and CI installs locked dependencies. Shared scripts are intentionally copied across gateway, chat, admin-api, admin-web, DB and plugin; test all copies when editing their contract.

Existing manifest/bundle/secret checks remain. Gitleaks downloads are checksum-verified. CI records a source-file inventory and a hash of the exact git source archive; this is not verification of marketplace delivery. The added scripts are maintainer-only, not plugin install hooks or runtime code.

Evidence goes to ignored `build-evidence/` and CI artifacts. It is CI-generated and **not independently signed**. No OWASP certification, SLSA level, vulnerability-free status or complete reproducibility is claimed. Runtime/session/auth code was not changed.

The canonical design, local test record, update procedure and residual risks are in `mcp-ops/docs/supply-chain-security.md`. Remaining work includes remote release verification, protected-branch checks/review, trusted-builder signing, OS/CLI download pinning and vulnerability policy. No new admin bypass or tenant settings are introduced.
