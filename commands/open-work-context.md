---
name: open-work-context
description: Switch to an external linked workspace (paid Hub). Not needed for Community Personal Workspace.
---

# Open Work Context (External Switch)

Follow skill **[`skills/open-work-context/SKILL.md`](../skills/open-work-context/SKILL.md)**.

## Steps

1. If Community / only Personal Workspace → tell the user it is already active; do **not** run a manual open step or teach `context_id`.
2. If the user wants another workspace on Community → point to upgrade / **`/link-account`** CTA.
3. Paid multi-link only: list connections, switch to the requested **external** workspace, confirm by label/slug.
4. Do not confuse this with **Work Context** prose (`/opsphere-setup` Step 3.5 / `set-work-context`).

## Related

- **`/link-account`** — add external workspaces when the plan allows
- **`/opsphere-setup`** — signup/login status (Personal Workspace Active)
