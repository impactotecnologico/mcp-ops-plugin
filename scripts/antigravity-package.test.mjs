import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = path.join(root, 'opsphere-antigravity');
const read = relative => fs.readFileSync(path.join(pkg, relative), 'utf8');
const json = relative => JSON.parse(read(relative));

test('portable Agent Plugins manifests use official schemas and no OAuth secrets', () => {
  const plugin = json('plugin.json');
  assert.equal(plugin.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(plugin.name, 'opsphere');
  assert.equal(plugin.version, '1.0.0');
  assert.ok(plugin.description);
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
  assert.equal(server.callback, undefined);
  const serialized = JSON.stringify(mcp);
  assert.doesNotMatch(serialized, /Bearer |client_secret|refresh_token|oauth-callback|client-metadata/);
});

test('native agy plugin MCP is mcp_config.json with serverUrl only', () => {
  const native = json('mcp_config.json');
  assert.deepEqual(Object.keys(native), ['mcpServers']);
  const server = native.mcpServers.opsphere;
  assert.equal(server.serverUrl, 'https://mcp-cursor.opsphere.io/mcp');
  assert.equal(server.type, undefined);
  assert.equal(server.url, undefined);
  assert.equal(server.oauth, undefined);
  assert.equal(server.headers, undefined);
  assert.equal(server.client_id, undefined);
  const serialized = JSON.stringify(native);
  assert.doesNotMatch(serialized, /Bearer |client_secret|refresh_token|oauth-callback|client-metadata/);
});

test('package does not ship the old installer or secrets', () => {
  assert.equal(fs.existsSync(path.join(pkg, 'install.mjs')), false);
  assert.equal(fs.existsSync(path.join(pkg, 'hooks.json')), false);
  for (const file of ['plugin.json', 'mcp.json', 'mcp_config.json']) {
    assert.doesNotMatch(read(file), /Bearer |client_secret|refresh_token/);
  }
  assert.doesNotMatch(read('mcp.json'), /"serverUrl"/);
});

test('portable skills exist and README documents the agy mcp_config.json requirement', () => {
  assert.ok(fs.existsSync(path.join(pkg, 'skills/endpoint-health/SKILL.md')));
  assert.ok(fs.existsSync(path.join(pkg, 'skills/opsphere-onboarding/SKILL.md')));
  const readme = read('README.md');
  assert.match(readme, /agy plugin install/);
  assert.match(readme, /agy plugin uninstall opsphere/);
  assert.match(readme, /mcp_config\.json/);
  assert.match(readme, /CIMD/);
  assert.doesNotMatch(readme, /plugin agents/);
});
