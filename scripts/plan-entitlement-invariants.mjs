#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');

const activeFiles = [
  'README.md',
  'docs/PLANS.md',
  'docs/TOOLS.md',
  'docs/TROUBLESHOOTING.md',
  'rules/onboarding-guide.mdc',
  'agents/ci-investigator.md',
  'agents/endpoint-health.md',
  'agents/postmortem-writer.md',
  'skills/ci-investigation/SKILL.md',
  'skills/endpoint-health/SKILL.md',
  'skills/opsphere-onboarding/SKILL.md',
  'skills/postmortem-writer/SKILL.md',
  'commands/opsphere-welcome.md',
];

for (const file of activeFiles) {
  assert.doesNotMatch(read(file), /\bProfessional\b/, `${file} references the retired Professional plan`);
}

const plans = read('docs/PLANS.md');
for (const plan of ['Community', 'Developer', 'Team', 'Enterprise', 'Custom']) {
  assert.match(plans, new RegExp(`\\b${plan}\\b`), `docs/PLANS.md missing ${plan}`);
}
for (const cap of ['100', '250', '400']) {
  assert.match(plans, new RegExp(`\\b${cap}\\b`), `docs/PLANS.md missing cap ${cap}`);
}
assert.match(plans, /tools\/list/);
assert.match(plans, /repo.*repos.*disabled/is);
assert.match(plans, /ops_.*do not (?:count|consume)/is);

console.log('Plan entitlement documentation invariants passed');
