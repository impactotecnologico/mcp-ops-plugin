import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { managePackage } from '../opsphere-antigravity/install.mjs';

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opsphere-agy-test-'));

test('workspace install/uninstall preserves edited plugin files with recoverable backup', () => {
  const root = temp();
  managePackage('install', 'workspace', root);
  assert.throws(() => managePackage('install', 'workspace', root), /already installed/);
  assert.ok(fs.existsSync(path.join(root, '.agents/plugins/opsphere/plugin.json')));
  assert.ok(fs.existsSync(path.join(root, '.agents/plugins/opsphere/mcp_config.json')));
  const skill = path.join(root, '.agents/plugins/opsphere/skills/opsphere-onboarding/SKILL.md');
  fs.appendFileSync(skill, '\nUser customization\n');
  const result = managePackage('uninstall', 'workspace', root);
  assert.match(fs.readFileSync(skill, 'utf8'), /User customization/);
  assert.equal(result.preserved.length, 1);
  assert.ok(fs.existsSync(path.join(result.backup, '.agents/plugins/opsphere/skills/endpoint-health/SKILL.md')));
  assert.equal(fs.existsSync(path.join(root, '.agents/opsphere-antigravity-install.json')), false);
});

test('workspace collision and symlink checks happen before project changes', () => {
  const root = temp();
  fs.mkdirSync(path.join(root, '.agents/plugins/opsphere'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents/plugins/opsphere/plugin.json'), '{"name":"other"}');
  assert.throws(() => managePackage('install', 'workspace', root), /collision/);
  assert.equal(fs.existsSync(path.join(root, '.agents/opsphere-antigravity-install.json')), false);
  const other = temp();
  fs.mkdirSync(path.join(other, '.agents'));
  fs.symlinkSync(root, path.join(other, '.agents/plugins'));
  assert.throws(() => managePackage('install', 'workspace', other), /symlink/);
});

test('global install stays under a fake home and does not touch the real user profile', () => {
  const home = temp();
  const prev = process.env.HOME;
  process.env.HOME = home;
  try {
    managePackage('install', 'global');
    const plugin = path.join(home, '.gemini/config/plugins/opsphere/plugin.json');
    assert.ok(fs.existsSync(plugin));
    assert.equal(JSON.parse(fs.readFileSync(plugin, 'utf8')).name, 'opsphere');
    const result = managePackage('uninstall', 'global');
    assert.equal(fs.existsSync(path.join(home, '.gemini/config/plugins/.opsphere-antigravity-install.json')), false);
    assert.ok(fs.existsSync(result.backup));
  } finally {
    if (prev === undefined) delete process.env.HOME;
    else process.env.HOME = prev;
  }
});
