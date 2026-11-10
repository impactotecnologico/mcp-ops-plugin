#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SPEC="${ROOT}/.github/rulesets/main-supply-chain-gate.json"
REPO="${GITHUB_REPOSITORY:-impactotecnologico/mcp-ops-plugin}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

existing="$(gh api "repos/${REPO}/rulesets" --jq '.[] | select(.name=="main — supply chain gate") | .id' 2>/dev/null || true)"
if [[ -n "${existing}" ]]; then
  gh api --method PUT "repos/${REPO}/rulesets/${existing}" --input "${SPEC}"
  echo "Updated ruleset id=${existing}"
else
  gh api --method POST "repos/${REPO}/rulesets" --input "${SPEC}"
  echo "Created ruleset"
fi

gh api "repos/${REPO}/rules/branches/main" --jq '.[] | select(.type=="required_status_checks") | .parameters'
