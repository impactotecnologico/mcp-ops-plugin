import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = path.join(root, 'opsphere-copilot');
const read = relative => fs.readFileSync(path.join(pkg, relative), 'utf8');
const json = relative => JSON.parse(read(relative));

test('portable Agent Plugins manifests use official schemas and no OAuth secrets', () => {
  const plugin = json('plugin.json');
  assert.equal(plugin.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(plugin.name, 'opsphere');
  assert.equal(plugin.version, '1.0.0');
  assert.ok(plugin.description);
  assert.equal(plugin.agents, undefined);
  assert.equal(plugin.skills, undefined);
  assert.equal(plugin.mcpServers, undefined);
  const mcp = json('mcp.json');
  assert.equal(mcp.$schema, 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json');
  assert.deepEqual(Object.keys(mcp).sort(), ['$schema', 'mcpServers']);
  const server = mcp.mcpServers.opsphere;
  assert.equal(server.type, 'streamable-http');
  assert.equal(server.url, 'https://mcp-cursor.opsphere.io/mcp');
  assert.equal(server.serverUrl, undefined);
  assert.equal(server.oauth, undefined);
  assert.equal(server.headers, undefined);
  assert.equal(server.client_id, undefined);
  assert.doesNotMatch(JSON.stringify(mcp), /Bearer |client_secret|refresh_token|cursor-mcp|codex-mcp|claude-mcp/);
});

test('Copilot-specific components live under com.github.copilot and the package has no hooks or installer', () => {
  assert.equal(fs.existsSync(path.join(pkg, 'install.mjs')), false);
  assert.equal(fs.existsSync(path.join(pkg, 'hooks.json')), false);
  assert.equal(fs.existsSync(path.join(pkg, 'agents')), false);
  assert.ok(fs.existsSync(path.join(pkg, 'com.github.copilot/agents/endpoint-health.agent.md')));
  assert.ok(fs.existsSync(path.join(pkg, 'com.github.copilot/commands/opsphere-welcome.md')));
  assert.ok(fs.existsSync(path.join(pkg, 'com.github.copilot/rules/opsphere.md')));
  assert.match(read('com.github.copilot/agents/endpoint-health.agent.md'), /^---\nname: endpoint-health\n/);
});

test('portable skills exist and README documents Copilot install', () => {
  assert.ok(fs.existsSync(path.join(pkg, 'skills/endpoint-health/SKILL.md')));
  assert.ok(fs.existsSync(path.join(pkg, 'skills/opsphere-onboarding/SKILL.md')));
  const readme = read('README.md');
  assert.match(readme, /copilot plugin install/);
  assert.match(readme, /copilot plugin uninstall opsphere/);
  assert.match(readme, /opsphere-io\/opsphere-plugin:opsphere-copilot/);
  assert.match(readme, /mcp\.json/);
  assert.match(readme, /DCR/);
  assert.doesNotMatch(readme, /cursor-mcp|codex-mcp|claude-mcp/);
});

test('Copilot marketplace points at opsphere-copilot and Claude marketplace is unchanged', () => {
  const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.github/plugin/marketplace.json'), 'utf8'));
  assert.equal(marketplace.name, 'opsphere');
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, 'opsphere');
  assert.equal(marketplace.plugins[0].source, './opsphere-copilot');
  const claude = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.equal(claude.plugins[0].source, './');
  assert.equal(fs.existsSync(path.join(root, 'marketplace.json')), false);
  assert.equal(fs.existsSync(path.join(root, '.github/mcp.json')), false);
  assert.equal(fs.existsSync(path.join(root, '.github/plugin/plugin.json')), false);
});
