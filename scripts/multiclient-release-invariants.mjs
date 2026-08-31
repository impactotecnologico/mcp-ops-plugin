#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = file => fs.readFileSync(file, 'utf8');
const catalog = JSON.parse(read('client-connectivity/catalog.json'));
assert.equal(catalog.version, 1);
assert.equal(new URL(catalog.endpoint).protocol, 'https:');
const config = JSON.parse(read('opsphere-warp/mcp/opsphere.json'));
assert.equal(config.mcpServers.opsphere.url, catalog.endpoint);
const guide = read('skills/connect-another-client/references/connect.md');
assert.equal(guide, read('opsphere-warp/guides/connect.md'));
assert.equal(guide, read('opsphere-warp/skills/connect-another-client/references/connect.md'));
for (const file of ['opsphere-warp/guides/connect.md', 'opsphere-warp/guides/warp.md']) {
  const text = read(file);
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)```/g)];
  assert.ok(blocks.length > 0);
  for (const [, block] of blocks) assert.deepEqual(JSON.parse(block), config);
  assert.ok(text.includes(catalog.account));
  assert.ok(text.includes(catalog.warpPackage.cloud));
  assert.ok(text.includes(catalog.warpPackage.availability));
}
assert.ok(read('commands/opsphere-connect-another-client.md').includes('../skills/connect-another-client/SKILL.md'));
assert.ok(read('skills/connect-another-client/SKILL.md').includes('references/connect.md'));
assert.ok(read('skills/connect-another-client/SKILL.md').includes('opsphere://clients/connect'));
assert.equal(read('skills/connect-another-client/SKILL.md'), read('opsphere-warp/skills/connect-another-client/SKILL.md'));
for (const name of ['endpoint-health', 'incident-investigation', 'ci-investigation', 'postmortem-writer']) {
  assert.equal(read(`skills/${name}/SKILL.md`), read(`opsphere-warp/skills/${name}/SKILL.md`));
}
for (const name of ['opsphere-onboarding', 'connect-another-client', 'configure-integration', 'set-work-context']) {
  const skill = read(`opsphere-warp/skills/${name}/SKILL.md`);
  assert.ok(skill.startsWith('---\n'));
  assert.ok(skill.includes(`name: ${name}`));
  assert.doesNotMatch(skill, /alwaysApply|reload-plugins|claude mcp login|codex mcp|\/opsphere:/);
}
assert.equal(fs.existsSync('opsphere-warp/rules/WARP.md'), false);
assert.match(read('opsphere-warp/rules/AGENTS.md'), /without explicit user consent/);
for (const file of ['install.mjs', 'profiles/recommended.md', 'examples/local.md']) assert.ok(fs.existsSync(`opsphere-warp/${file}`));
console.log('multiclient-release-invariants: ok');
