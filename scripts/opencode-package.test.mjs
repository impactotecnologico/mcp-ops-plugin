import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { managePackage } from '../opsphere-opencode/install.mjs';

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'opsphere-opencode-test-'));
const server = JSON.parse(fs.readFileSync(new URL('../opsphere-opencode/mcp/opsphere.json', import.meta.url), 'utf8')).mcp.opsphere;

test('install/uninstall preserves other servers, rules and user-edited skills, with recoverable backup', () => {
  const root = temp();
  fs.writeFileSync(path.join(root, 'opencode.json'), JSON.stringify({ mcp: { other: { type: 'local', command: ['local-tool'] } } }));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Existing project rules\n');
  managePackage('install', root);
  assert.throws(() => managePackage('install', root), /already installed/);
  const skill = path.join(root, '.opencode/skills/opsphere-onboarding/SKILL.md');
  fs.appendFileSync(skill, '\nUser customization\n');
  const result = managePackage('uninstall', root);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# Existing project rules\n');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'))), { mcp: { other: { type: 'local', command: ['local-tool'] } } });
  assert.match(fs.readFileSync(skill, 'utf8'), /User customization/);
  assert.equal(result.preserved.length, 1);
  assert.ok(fs.existsSync(path.join(result.backup, '.opencode/skills/endpoint-health/SKILL.md')));
  assert.ok(fs.existsSync(path.join(result.backup, '.opencode/agents/endpoint-health.md')));
  assert.ok(fs.existsSync(path.join(result.backup, '.opencode/commands/opsphere-welcome.md')));
  assert.equal(fs.existsSync(path.join(root, '.opencode/agents/endpoint-health.md')), false);
});

test('collision and symlink checks happen before project changes', () => {
  const root = temp();
  fs.mkdirSync(path.join(root, '.opencode/skills/endpoint-health'), { recursive: true });
  fs.writeFileSync(path.join(root, '.opencode/skills/endpoint-health/SKILL.md'), 'Different content');
  assert.throws(() => managePackage('install', root), /collision/);
  assert.equal(fs.existsSync(path.join(root, 'opencode.json')), false);
  const other = temp();
  fs.symlinkSync(root, path.join(other, '.opencode'));
  assert.throws(() => managePackage('install', other), /symlink/);
});

test('pre-existing matching MCP and skills remain owned by the user', () => {
  const root = temp();
  fs.writeFileSync(path.join(root, 'opencode.json'), JSON.stringify({ mcp: { opsphere: server } }, null, 2) + '\n');
  managePackage('install', root);
  managePackage('uninstall', root);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'))).mcp.opsphere, server);
});

test('V2 mcp.servers existing config receives opsphere without rewriting sibling servers', () => {
  const root = temp();
  fs.writeFileSync(path.join(root, 'opencode.json'), JSON.stringify({
    mcp: { servers: { other: { type: 'local', command: ['local-tool'] } } },
  }));
  managePackage('install', root);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json')));
  assert.deepEqual(config.mcp.servers.other, { type: 'local', command: ['local-tool'] });
  assert.deepEqual(config.mcp.servers.opsphere, server);
  assert.equal(config.mcp.opsphere, undefined);
  managePackage('uninstall', root);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'))), {
    mcp: { servers: { other: { type: 'local', command: ['local-tool'] } } },
  });
});
