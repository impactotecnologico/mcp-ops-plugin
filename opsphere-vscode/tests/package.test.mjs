import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(pkg, '..');
const read = file => fs.readFileSync(path.join(pkg, file), 'utf8');
const json = file => JSON.parse(read(file));
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `Package must be self-contained: ${file}`);
    return entry.isDirectory() ? files(file) : [file];
  });
}

test('VS Code manifests define one remote server with client-managed authentication', () => {
  const plugin = json('plugin.json');
  assert.equal(plugin.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(plugin.name, 'opsphere-vscode');
  assert.equal(plugin.version, '1.0.0');
  assert.match(plugin.description, /VS Code/);
  assert.deepEqual(Object.keys(plugin).sort(), ['$schema', 'author', 'description', 'homepage', 'keywords', 'license', 'name', 'repository', 'version']);
  assert.deepEqual(json('mcp.json'), {
    $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
    mcpServers: { opsphere: { type: 'streamable-http', url: 'https://mcp-cursor.opsphere.io/mcp' } },
  });
});

test('package contains no executable runtime, hooks, dependencies or external file references', () => {
  for (const file of files(pkg)) {
    const relative = path.relative(pkg, file).replaceAll('\\', '/');
    if (relative.startsWith('tests/')) continue;
    assert.match(relative, /\.(md|json)$/);
    assert.doesNotMatch(relative, /(^|\/)(hooks|node_modules|package\.json|install\.)/);
    const content = fs.readFileSync(file, 'utf8');
    if (relative.endsWith('.json')) JSON.parse(content);
    if (!relative.endsWith('.md')) continue;
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
      assert.ok(resolved.startsWith(pkg + path.sep), `Reference escapes package: ${relative}: ${target}`);
      assert.ok(fs.existsSync(resolved), `Broken reference: ${relative}: ${target}`);
    }
  }
});

test('skills and client components are present and current-client setup uses VS Code', () => {
  const skills = ['ci-investigation', 'configure-deployment-catalog', 'configure-integration', 'connect-another-client', 'endpoint-health', 'incident-investigation', 'opsphere-onboarding', 'postmortem-writer', 'qa-release-readiness', 'qa-test-investigation', 'set-work-context'];
  for (const skill of skills) {
    assert.match(read(`skills/${skill}/SKILL.md`), new RegExp(`^---\\r?\\nname: ${skill}\\r?\\n`));
  }
  assert.match(read('skills/connect-another-client/references/connect.md'), /## VS Code with GitHub Copilot/);
  for (const dir of ['agents', 'commands', 'rules']) {
    assert.ok(fs.readdirSync(path.join(pkg, 'com.github.copilot', dir)).length > 0);
    for (const file of files(path.join(pkg, 'com.github.copilot', dir))) {
      const content = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(content, /Copilot CLI|copilot plugin install|`\/mcp`|~\/\.copilot\//);
    }
  }
  for (const file of ['skills/opsphere-onboarding/SKILL.md', 'com.github.copilot/commands/opsphere-setup.md', 'com.github.copilot/commands/opsphere-reconnect.md']) {
    assert.match(read(file), /MCP: List Servers/);
  }
});

test('marketplace preserves Copilot CLI identity and adds an independent VS Code entry', { skip: !fs.existsSync(path.join(root, '.github/plugin/marketplace.json')) && 'Sparse checkout: marketplace not included' }, () => {
  const marketplace = JSON.parse(fs.readFileSync(path.join(root, '.github/plugin/marketplace.json'), 'utf8'));
  assert.equal(marketplace.name, 'opsphere');
  assert.deepEqual(marketplace.plugins.map(({ name, source, version }) => ({ name, source, version })), [
    { name: 'opsphere', source: './opsphere-copilot', version: '1.0.0' },
    { name: 'opsphere-vscode', source: './opsphere-vscode', version: '1.0.0' },
  ]);
  assert.equal(marketplace.plugins[1].description, json('plugin.json').description);
});

test('README includes installation, lifecycle and honest manual acceptance status', () => {
  const readme = read('README.md');
  for (const text of ['chat.plugins.marketplaces', '@agentPlugins', 'MCP: List Servers', 'chat.pluginLocations', 'Extensions: Check for Extension Updates', 'Uninstall', 'pending manual verification', 'pending publication and manual verification', 'invalid_grant']) {
    assert.ok(readme.includes(text), `Missing instructions: ${text}`);
  }
});
