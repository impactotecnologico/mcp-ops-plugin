#!/usr/bin/env node
/**
 * Phase 6 UX content invariants for mcp-ops-plugin.
 * Fails if legacy Hub onboarding copy resurfaces in always-on / primary surfaces.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @type {{ file: string, forbid: RegExp[], require?: RegExp[] }[]} */
const checks = [
  {
    file: 'rules/onboarding-guide.mdc',
    forbid: [
      /not an operational workspace/i,
      /Pass `context_id` on every scoped call/i,
      /\*\*Tools:\*\*\s*\d+\s*MCP tools enabled/i,
    ],
    require: [
      /Personal Workspace/i,
      /Work Context/i,
      /External Workspace/i,
      /BROKER_LINK_LIMIT_EXCEEDED/,
      /PERSONAL_WORKSPACE_UNLINK_FORBIDDEN/,
      /WORKSPACE_SUSPENDED/,
    ],
  },
  {
    file: 'skills/link-account/SKILL.md',
    forbid: [
      /after Hub signup with zero connections/i,
      /accounts:\s*\[\]/,
    ],
    require: [
      /Personal Workspace/i,
      /upgrade/i,
      /BROKER_LINK_LIMIT_EXCEEDED/,
      /PERSONAL_WORKSPACE_UNLINK_FORBIDDEN/,
    ],
  },
  {
    file: 'skills/open-work-context/SKILL.md',
    forbid: [
      /every tenant-scoped tool call needs the returned `context_id`/i,
      /Pass `context_id` as a \*\*tool argument\*\* on every tenant-scoped/i,
    ],
    require: [
      /Personal Workspace is already active/i,
      /Not required for Community/i,
    ],
  },
  {
    file: 'skills/plan-and-usage/SKILL.md',
    forbid: [/\*\*Tools:\*\*\s*\d+\s*MCP tools enabled/i],
    require: [
      /Personal Workspace/i,
      /Work context/i,
      /If \*\*`ops_my_usage`\*\* is present/i,
      /direct\s+corporate-workspace session/i,
      /do not infer that Opsphere or the active\s+workspace is disconnected/i,
    ],
  },
  {
    file: 'skills/opsphere-onboarding/SKILL.md',
    forbid: [],
    require: [
      /Live capability discovery \(mandatory\)/i,
      /current MCP `tools\/list` is the authority/i,
      /under \*\*Available now\*\*/i,
      /Re-evaluate the live list after a workspace switch/i,
      /self-service `ops_\*` tools are not\s+guaranteed in a direct corporate-workspace login/i,
      /Jira retry discipline/i,
      /Do not brute-force query variants/i,
    ],
  },
  {
    file: 'commands/opsphere-setup.md',
    forbid: [
      /If empty, offer skill \*\*`link-account`\*\*/i,
      /tenant-scoped calls include `context_id`/i,
    ],
    require: [/Personal Workspace: Active/i],
  },
  {
    file: 'commands/opsphere-reconnect.md',
    forbid: [/invalid_grant.*automatically retry indefinitely/i],
    require: [
      /zero additional Opsphere tool calls/i,
      /Opsphere unavailable/i,
      /exactly once/i,
      /30 s, 60 s, then 120 s/i,
      /ten-minute negative cache/i,
    ],
  },
  {
    file: 'skills/reconnect/SKILL.md',
    forbid: [/invalid_grant.*automatically retry indefinitely/i],
    require: [
      /zero additional Opsphere tool calls/i,
      /exactly once/i,
      /Opsphere unavailable/i,
      /ten-minute negative cache/i,
    ],
  },
  {
    file: 'docs/PLANS.md',
    forbid: [/OPS_DEVELOPER_PLAN_ENABLED=true/i],
    require: [/Personal Workspace/i, /Developer.*only available when/i],
  },
];

let failed = 0;

for (const check of checks) {
  const full = path.join(root, check.file);
  const text = fs.readFileSync(full, 'utf8');
  for (const re of check.forbid) {
    if (re.test(text)) {
      console.error(`FAIL ${check.file}: forbidden pattern ${re}`);
      failed += 1;
    }
  }
  for (const re of check.require ?? []) {
    if (!re.test(text)) {
      console.error(`FAIL ${check.file}: missing required pattern ${re}`);
      failed += 1;
    }
  }
  if (failed === 0 || check.forbid.every((re) => !re.test(text))) {
    // keep going; report ok per file only if no fails for this file
  }
}

if (failed > 0) {
  console.error(`phase6-ux-invariants: ${failed} failure(s)`);
  process.exit(1);
}

console.log('phase6-ux-invariants: ok');
