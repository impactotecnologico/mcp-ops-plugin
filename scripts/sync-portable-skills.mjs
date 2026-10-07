#!/usr/bin/env node
// Portable packages share these client-independent skills and rules with the root plugin.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['opsphere-warp', 'opsphere-opencode', 'opsphere-antigravity', 'opsphere-copilot'];
const skills = [
  'endpoint-health',
  'incident-investigation',
  'ci-investigation',
  'postmortem-writer',
  'qa-test-investigation',
  'qa-release-readiness',
  'configure-deployment-catalog',
  'configure-integration',
];
const portableRules = [{ source: 'rules/onboarding-guide.mdc', destination: 'rules/onboarding-guide.mdc' }];

function syncFile(sourceRelative, destinationRelative, check) {
  const source = fs.readFileSync(path.join(root, sourceRelative), 'utf8');
  for (const pkg of packages) {
    const destination = path.join(root, pkg, destinationRelative);
    if (check) {
      assert.equal(fs.readFileSync(destination, 'utf8'), source, `Portable drift: ${destination}`);
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, source);
    }
  }
}

const check = process.argv.includes('--check');
for (const skill of skills) {
  syncFile(path.join('skills', skill, 'SKILL.md'), path.join('skills', skill, 'SKILL.md'), check);
}
for (const { source, destination } of portableRules) {
  syncFile(source, destination, check);
}
console.log('Portable skills and rules synchronized');
