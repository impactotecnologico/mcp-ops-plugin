import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { managePackage } from '../opsphere-warp/install.mjs';

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opsphere-warp-test-'));
test('install/uninstall preserves other servers, rules and user-edited skills, with recoverable backup', () => {
  const root = temp();
  fs.mkdirSync(path.join(root, '.warp'));
  fs.writeFileSync(path.join(root, '.warp/.mcp.json'), JSON.stringify({ mcpServers: { other: { command: 'local-tool' } } }));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Existing project rules\n');
  managePackage('install', root);
  assert.throws(() => managePackage('install', root), /already installed/);
  const skill = path.join(root, '.agents/skills/opsphere-onboarding/SKILL.md');
  fs.appendFileSync(skill, '\nUser customization\n');
  const result = managePackage('uninstall', root);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# Existing project rules\n');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.warp/.mcp.json'))), { mcpServers: { other: { command: 'local-tool' } } });
  assert.match(fs.readFileSync(skill, 'utf8'), /User customization/);
  assert.equal(result.preserved.length, 1);
  assert.ok(fs.existsSync(path.join(result.backup, '.agents/skills/endpoint-health/SKILL.md')));
});
test('collision and symlink checks happen before project changes', () => {
  const root = temp();
  fs.writeFileSync(path.join(root, 'WARP.md'), 'Existing rules');
  assert.throws(() => managePackage('install', root), /competing rules/);
  assert.equal(fs.existsSync(path.join(root, '.agents')), false);
  const other = temp();
  fs.symlinkSync(root, path.join(other, '.agents'));
  assert.throws(() => managePackage('install', other), /symlink/);
  const dangling = temp();
  fs.symlinkSync(path.join(dangling, 'missing'), path.join(dangling, '.agents'));
  assert.throws(() => managePackage('install', dangling), /symlink/);
});
test('pre-existing matching MCP and skills remain owned by the user', () => {
  const root = temp();
  fs.mkdirSync(path.join(root, '.warp'));
  const config = fs.readFileSync(new URL('../opsphere-warp/mcp/opsphere.json', import.meta.url), 'utf8');
  fs.writeFileSync(path.join(root, '.warp/.mcp.json'), config);
  managePackage('install', root);
  managePackage('uninstall', root);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.warp/.mcp.json'))), JSON.parse(config));
});
