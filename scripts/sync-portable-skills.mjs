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
const portableAgents = [
  {
    source: 'agents/ci-investigator.md',
    destinations: [
      'opsphere-opencode/agents/ci-investigator.md',
      'opsphere-antigravity/agents/ci-investigator.md',
      'opsphere-copilot/com.github.copilot/agents/ci-investigator.agent.md',
    ],
  },
  {
    source: 'agents/endpoint-health.md',
    destinations: [
      'opsphere-opencode/agents/endpoint-health.md',
      'opsphere-antigravity/agents/endpoint-health.md',
      'opsphere-copilot/com.github.copilot/agents/endpoint-health.agent.md',
    ],
  },
  {
    source: 'agents/postmortem-writer.md',
    destinations: [
      'opsphere-opencode/agents/postmortem-writer.md',
      'opsphere-antigravity/agents/postmortem-writer.md',
      'opsphere-copilot/com.github.copilot/agents/postmortem-writer.agent.md',
    ],
  },
];

function splitFrontmatter(content, filename) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  assert.ok(match, `Expected frontmatter in ${filename}`);
  return { frontmatter: match[1], body: match[2] };
}

function syncAgentBody(sourceRelative, destinations, check) {
  const source = fs.readFileSync(path.join(root, sourceRelative), 'utf8');
  const { body } = splitFrontmatter(source, sourceRelative);
  for (const destinationRelative of destinations) {
    const destination = path.join(root, destinationRelative);
    const current = fs.readFileSync(destination, 'utf8');
    const { frontmatter } = splitFrontmatter(current, destinationRelative);
    const expected = `${frontmatter}${body}`;
    if (check) {
      assert.equal(current, expected, `Portable agent body drift: ${destination}`);
    } else {
      fs.writeFileSync(destination, expected);
    }
  }
}

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
for (const { source, destinations } of portableAgents) {
  syncAgentBody(source, destinations, check);
}
console.log('Portable skills, rules, and agent bodies synchronized');
