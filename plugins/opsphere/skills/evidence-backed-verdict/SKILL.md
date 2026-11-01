---
name: evidence-backed-verdict
description: After macro_* or investigation_close, read the Veredicto section from tool text; do not re-parse JSON sections or raise confidence without explicit rejects/supports.
---

# Evidence-backed verdict (IDE)

When **`macro_*`**, **`investigation_close`**, or **`ops_incident_rollup`** returns structured investigation output, the authoritative narrative is in **`content[].text`**, not in ad-hoc JSON parsing of `sections`.

## Required behavior

1. **Read the markdown sections** — especially `## Veredicto`, `## Confianza`, `## Evidencia`, `## Next checks`, and `## Gaps`.
2. **Copy the verdict into your reply** — paraphrase, do not invent a stronger RCA than the tool stated.
3. **Confidence mapping**
   - Treat **HIGH** with supporting evidence and **no contradicting rejects** as *confirmed* for user-facing language only when the tool text says so.
   - **MEDIUM** / **LOW** → hypothesis language; never claim certainty.
4. **Do not** rebuild diagnosis from raw `sections` blobs when `diagnosis` is present in structuredContent — the gateway already ran investigation-core.
5. **Precedentes** blocks are **non-authoritative**; verify live state before acting.

## Session workflow (Community / no macros)

1. **`investigation_open`** — paste **Slack/Sentry alert text** into `query` (project slug, culprit, “First Seen”). Read `playbook.suggested_tools` and `sentry_project_slug` from structuredContent.
2. Run atomic tools with **`arguments._meta.investigation_id`** — **always scope Sentry** with `projectSlug` from the playbook (never org-wide sort-by-date alone).
3. Optional: `dd_logs_search` with `service:` from playbook, `k8s_pods_list` for the app label, `dns_lookup` / `cf_firewall_events` if gaps mention edge attribution.
4. **`investigation_close`** — paste **Veredicto**, **Gaps**, and **Next checks** into the user summary.

## Alert / security triage (Saleor, Sentry “New issue”)

- If the notification names **`saleor-replicadb-client`**, **`saleor-orders`**, or “Replica App”, do **not** pivot to a different Sentry project based on volume alone.
- Clustered errors on **`/saleor/manifest`**, **`SecretId` length 0**, **`download_file` + fake job IDs** → treat as **reconnaissance/noise** until WAF/IP evidence says otherwise; confirm pods healthy via `k8s_pods_list`.
- When `## Gaps` lists missing Cloudflare evidence, say attribution is incomplete — do not claim “attack” or “no attack” with HIGH confidence without edge logs.

## Prohibited

- Closing an outage RCA using only atomic tools without `macro_outage_triage` or `investigation_close` when structured verdict was available.
- Raising confidence because logs “look bad” when the tool band is LOW or evidence is neutral-only.
- Identifying the wrong microservice because Datadog org-wide error volume dominated the search.
