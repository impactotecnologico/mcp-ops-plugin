#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = file => fs.readFileSync(file, 'utf8');
const jsonBlocks = text => [...text.matchAll(/```json\s*\n([\s\S]*?)```/g)].map(([, block]) => JSON.parse(block));
const catalog = JSON.parse(read('client-connectivity/catalog.json'));
assert.equal(catalog.version, 1);
assert.equal(new URL(catalog.endpoint).protocol, 'https:');
assert.ok(catalog.clients.opencode);
assert.ok(catalog.clients.antigravity);
assert.equal(catalog.clients.opencode.capabilities.nativePlugin, false);
assert.equal(catalog.clients.antigravity.capabilities.nativePlugin, true);

const warpConfig = JSON.parse(read('opsphere-warp/mcp/opsphere.json'));
const opencodeConfig = JSON.parse(read('opsphere-opencode/mcp/opsphere.json'));
const antigravityConfig = JSON.parse(read('opsphere-antigravity/mcp_config.json'));
assert.equal(warpConfig.mcpServers.opsphere.url, catalog.endpoint);
assert.equal(opencodeConfig.mcp.opsphere.url, catalog.endpoint);
assert.equal(opencodeConfig.mcp.opsphere.codemode, false);
assert.equal(opencodeConfig.mcp.opsphere.timeout, 60000);
assert.equal(antigravityConfig.mcpServers.opsphere.serverUrl, catalog.endpoint);
assert.equal(JSON.parse(read('opsphere-opencode/opencode.json')).mcp.opsphere.url, catalog.endpoint);
assert.equal(JSON.parse(read('opsphere-antigravity/plugin.json')).name, 'opsphere');

const guide = read('skills/connect-another-client/references/connect.md');
for (const file of [
  'opsphere-warp/guides/connect.md',
  'opsphere-warp/skills/connect-another-client/references/connect.md',
  'opsphere-opencode/guides/connect.md',
  'opsphere-opencode/skills/connect-another-client/references/connect.md',
  'opsphere-antigravity/guides/connect.md',
  'opsphere-antigravity/skills/connect-another-client/references/connect.md',
]) {
  assert.equal(guide, read(file), `connect guide drift: ${file}`);
}

const sharedBlocks = jsonBlocks(guide);
assert.equal(sharedBlocks.length, 3);
assert.deepEqual(sharedBlocks[0], warpConfig);
assert.deepEqual(sharedBlocks[1], opencodeConfig);
assert.deepEqual(sharedBlocks[2], antigravityConfig);
assert.ok(guide.includes(catalog.account));
assert.ok(guide.includes(catalog.plans));
assert.ok(guide.includes(catalog.warpPackage.availability));
assert.ok(guide.includes(catalog.opencodePackage.availability));
assert.ok(guide.includes(catalog.antigravityPackage.availability));

function assertClientGuide(file, config, extra) {
  const text = read(file);
  const blocks = jsonBlocks(text);
  assert.ok(blocks.length > 0, file);
  for (const block of blocks) assert.deepEqual(block, config);
  assert.ok(text.includes(catalog.account));
  for (const snippet of extra) assert.ok(text.includes(snippet), `${file} missing ${snippet.slice(0, 40)}`);
}

assertClientGuide('opsphere-warp/guides/warp.md', warpConfig, [
  catalog.warpPackage.cloud,
  catalog.warpPackage.availability,
]);
assertClientGuide('opsphere-opencode/guides/opencode.md', opencodeConfig, [
  catalog.opencodePackage.availability,
  catalog.opencodePackage.codeMode,
  catalog.opencodePackage.timeout,
  catalog.opencodePackage.rulesPolicy,
]);
assertClientGuide('opsphere-antigravity/guides/antigravity.md', antigravityConfig, [
  catalog.antigravityPackage.availability,
  catalog.antigravityPackage.duplicateMcp,
  catalog.antigravityPackage.rulesPolicy,
]);

assert.ok(read('commands/opsphere-connect-another-client.md').includes('../skills/connect-another-client/SKILL.md'));
assert.ok(read('skills/connect-another-client/SKILL.md').includes('references/connect.md'));
assert.ok(read('skills/connect-another-client/SKILL.md').includes('opsphere://clients/connect'));
assert.equal(read('skills/connect-another-client/SKILL.md'), read('opsphere-warp/skills/connect-another-client/SKILL.md'));
assert.equal(read('skills/connect-another-client/SKILL.md'), read('opsphere-opencode/skills/connect-another-client/SKILL.md'));
assert.equal(read('skills/connect-another-client/SKILL.md'), read('opsphere-antigravity/skills/connect-another-client/SKILL.md'));

const portable = ['endpoint-health', 'incident-investigation', 'ci-investigation', 'postmortem-writer', 'qa-test-investigation', 'qa-release-readiness'];
for (const name of portable) {
  const canonical = read(`skills/${name}/SKILL.md`);
  for (const pkg of ['opsphere-warp', 'opsphere-opencode', 'opsphere-antigravity']) {
    assert.equal(canonical, read(`${pkg}/skills/${name}/SKILL.md`), `${pkg} portable skill drift: ${name}`);
  }
}

const hostForbidden = /alwaysApply|reload-plugins|claude mcp login|codex mcp|\/opsphere:/;
for (const pkg of ['opsphere-warp', 'opsphere-opencode', 'opsphere-antigravity']) {
  for (const name of ['opsphere-onboarding', 'connect-another-client', 'configure-integration', 'set-work-context']) {
    const skill = read(`${pkg}/skills/${name}/SKILL.md`);
    assert.ok(skill.startsWith('---\n'));
    assert.ok(skill.includes(`name: ${name}`));
    assert.doesNotMatch(skill, hostForbidden);
  }
}

assert.equal(fs.existsSync('opsphere-warp/rules/WARP.md'), false);
assert.match(read('opsphere-warp/rules/AGENTS.md'), /without explicit user consent/);
assert.match(read('opsphere-opencode/rules/AGENTS.md'), /without explicit user consent/);
assert.match(read('opsphere-antigravity/rules/opsphere.md'), /without explicit user consent/);
assert.equal(fs.existsSync('opsphere-antigravity/hooks.json'), false);
assert.equal(fs.existsSync('opencode.json'), false);
assert.equal(fs.existsSync('.opencode'), false);
assert.equal(fs.existsSync('mcp_config.json'), false);

for (const file of ['install.mjs', 'profiles/recommended.md', 'examples/local.md']) assert.ok(fs.existsSync(`opsphere-warp/${file}`));
for (const file of ['install.mjs', 'opencode.json', 'examples/local.md']) assert.ok(fs.existsSync(`opsphere-opencode/${file}`));
for (const file of ['install.mjs', 'plugin.json', 'mcp_config.json', 'examples/local.md']) assert.ok(fs.existsSync(`opsphere-antigravity/${file}`));
console.log('multiclient-release-invariants: ok');
