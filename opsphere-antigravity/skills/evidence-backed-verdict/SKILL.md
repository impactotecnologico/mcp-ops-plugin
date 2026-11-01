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

1. `investigation_open` with env/hostname/query.
2. Atomic tools with `arguments._meta.investigation_id` set to the returned id.
3. `investigation_close` — paste **Veredicto** and **Next checks** into the user summary.

## Prohibited

- Closing an outage RCA using only atomic tools without `macro_outage_triage` or `investigation_close` when structured verdict was available.
- Raising confidence because logs “look bad” when the tool band is LOW or evidence is neutral-only.
