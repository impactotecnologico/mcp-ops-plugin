# R08 — Supply chain controls

## Current status — 2026-09-20

This supersedes historical limitations below that have since been implemented. KMS is provisioned via the AWS infra repository; release evidence is signed and verified against `.github/artifact-signing-trust.json`. Shared policy/signature tests: 24 per repo, 144 total PASS. Scanner evidence is mandatory and image scans must match the release digest. HIGH/CRITICAL/UNKNOWN vulnerabilities block releases; licenses are inventoried for separate review, not legally approved.

Six source dependency scans including dev dependencies pass after pinned security updates. Gateway ARM64 build passes but its actual image has unresolved OS/tool/Python vulnerability findings, so R08 is **not closed**. No remote workflow, package publication or application deployment is claimed. Repository protection is the owner's responsibility. The shared signing role does not establish independent builder identity or SLSA certification.

Canonical verification, safety boundaries and next actions: `mcp-ops/docs/security-verification-2026-09-20.md`. AWS reuse/rotation: `mcp-ops-infra/infra/docs/artifact-signing-and-security.md`.

## Historical implementation record

Implemented locally on 2026-09-19; remote rollout unverified. Run `scripts/supply-chain/check.mjs` and `scripts/supply-chain/supply-chain.test.mjs` after installing the locked CI tools under `.github/supply-chain-tools`.

Reviewed pins are in `.github/supply-chain-policy.json`. Actions use upstream commit SHAs, direct npm versions (where applicable) match the existing lock resolution, and CI installs locked dependencies. Shared scripts are intentionally copied across gateway, chat, admin-api, admin-web, DB and plugin; test all copies when editing their contract.

Existing manifest/bundle/secret checks remain. Gitleaks downloads are checksum-verified. CI records a source-file inventory and a hash of the exact git source archive; this is not verification of marketplace delivery. The added scripts are maintainer-only, not plugin install hooks or runtime code.

Evidence goes to ignored `build-evidence/` and CI artifacts. It is CI-generated and **not independently signed**. No OWASP certification, SLSA level, vulnerability-free status or complete reproducibility is claimed. Runtime/session/auth code was not changed.

The canonical design, local test record, update procedure and residual risks are in `mcp-ops/docs/supply-chain-security.md`. Remaining work includes remote release verification, protected-branch checks/review, trusted-builder signing, OS/CLI download pinning and vulnerability policy. No new admin bypass or tenant settings are introduced.
