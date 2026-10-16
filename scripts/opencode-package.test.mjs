import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { managePackage } from '../opsphere-opencode/install.mjs';
import { readJsonc, editJsonc } from '../opsphere-opencode/jsonc.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  fs.symlinkSync(root, path.join(other, '.opencode'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => managePackage('install', other), /symlink/);
});

const globalFixture = () => {
  const configHome = temp();
  return { root: path.join(configHome, 'opencode'), options: { global: true, env: { XDG_CONFIG_HOME: configHome } } };
};

test('global install creates the standard layout without a nested .opencode and preserves edited content on uninstall', () => {
  const { root, options } = globalFixture();
  const result = managePackage('install', undefined, options);
  assert.equal(result.scope, 'global');
  for (const file of ['skills/endpoint-health/SKILL.md', 'agents/endpoint-health.md', 'commands/opsphere-welcome.md', 'AGENTS.md', 'opencode.json']) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
  assert.equal(fs.existsSync(path.join(root, '.opencode')), false);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'opsphere-opencode-install.json')));
  assert.equal(manifest.scope, 'global');
  assert.equal(manifest.configFile, 'opencode.json');
  assert.throws(() => managePackage('install', undefined, options), /already installed/);
  fs.appendFileSync(path.join(root, 'skills/endpoint-health/SKILL.md'), '\nMy changes\n');
  const removed = managePackage('uninstall', undefined, options);
  assert.ok(removed.preserved.includes(path.normalize('skills/endpoint-health/SKILL.md')));
  assert.ok(fs.existsSync(path.join(removed.backup, 'agents/endpoint-health.md')));
  assert.equal(fs.existsSync(path.join(root, 'agents/endpoint-health.md')), false);
  assert.equal(readJsonc(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8')).value.mcp.opsphere, undefined);
});

test('global JSONC install/uninstall preserves comments, trailing commas, other servers and rules', () => {
  const { root, options } = globalFixture();
  fs.mkdirSync(root);
  const before = `{
  // Personal preferences, including commas in strings: ,}
  "model": "test/model",
  "mcp": {
    /* Keep this server */ "other": {"type": "remote", "url": "https://example.com//mcp",},
  },
}\n`;
  fs.writeFileSync(path.join(root, 'opencode.jsonc'), before);
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# My global rules\n');
  managePackage('install', undefined, options);
  assert.equal(fs.existsSync(path.join(root, 'opencode.json')), false);
  const installed = fs.readFileSync(path.join(root, 'opencode.jsonc'), 'utf8');
  assert.ok(installed.includes('// Personal preferences, including commas in strings: ,}'));
  assert.ok(installed.includes('/* Keep this server */ "other": {"type": "remote", "url": "https://example.com//mcp",},'));
  assert.deepEqual(readJsonc(installed).value.mcp.opsphere, server);
  // Simulate unrelated user edits after installation.
  fs.writeFileSync(path.join(root, 'opencode.jsonc'), installed.replace('test/model', 'test/new-model'));
  managePackage('uninstall', undefined, options);
  const after = fs.readFileSync(path.join(root, 'opencode.jsonc'), 'utf8');
  assert.ok(after.includes('/* Keep this server */'));
  assert.equal(readJsonc(after).value.model, 'test/new-model');
  assert.deepEqual(readJsonc(after).value.mcp.other, readJsonc(before).value.mcp.other);
  assert.equal(readJsonc(after).value.mcp.opsphere, undefined);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# My global rules\n');
});

test('global matching server and files are not adopted; edited server and rule block survive uninstall', () => {
  const { root, options } = globalFixture();
  fs.mkdirSync(path.join(root, 'skills/endpoint-health'), { recursive: true });
  const skill = fs.readFileSync(new URL('../opsphere-opencode/skills/endpoint-health/SKILL.md', import.meta.url), 'utf8');
  fs.writeFileSync(path.join(root, 'skills/endpoint-health/SKILL.md'), skill);
  const reordered = Object.fromEntries(Object.entries(server).reverse());
  const config = JSON.stringify({ mcp: { opsphere: reordered } });
  fs.writeFileSync(path.join(root, 'opencode.json'), config);
  managePackage('install', undefined, options);
  assert.equal(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'), config);
  managePackage('uninstall', undefined, options);
  assert.equal(fs.readFileSync(path.join(root, 'skills/endpoint-health/SKILL.md'), 'utf8'), skill);
  assert.equal(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'), config);

  const second = globalFixture();
  managePackage('install', undefined, second.options);
  const configPath = path.join(second.root, 'opencode.json');
  fs.writeFileSync(configPath, editJsonc(fs.readFileSync(configPath, 'utf8'), ['mcp', 'opsphere', 'timeout'], 90000));
  const rulesPath = path.join(second.root, 'AGENTS.md');
  fs.writeFileSync(rulesPath, fs.readFileSync(rulesPath, 'utf8').replace('operational rules', 'custom operational rules'));
  const result = managePackage('uninstall', undefined, second.options);
  assert.ok(result.preserved.includes('opencode.json:opsphere'));
  assert.ok(result.preserved.includes('AGENTS.md:modified-block'));
  assert.equal(readJsonc(fs.readFileSync(configPath, 'utf8')).value.mcp.opsphere.timeout, 90000);
});

test('global preflight rejects conflicts, invalid configs and ambiguous JSON/JSONC without writing', () => {
  for (const content of ['{', '{"mcp": []}', '{"mcp":{"opsphere":{"url":"different"}}}', '{"mcp":{},"mcp":{}}']) {
    const { root, options } = globalFixture();
    fs.mkdirSync(root);
    fs.writeFileSync(path.join(root, 'opencode.jsonc'), content);
    assert.throws(() => managePackage('install', undefined, options));
    assert.deepEqual(fs.readdirSync(root), ['opencode.jsonc']);
    assert.equal(fs.readFileSync(path.join(root, 'opencode.jsonc'), 'utf8'), content);
  }
  const { root, options } = globalFixture();
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'opencode.json'), '{}');
  fs.writeFileSync(path.join(root, 'opencode.jsonc'), '{}');
  assert.throws(() => managePackage('install', undefined, options), /Both opencode/);
  assert.equal(fs.existsSync(path.join(root, 'opsphere-opencode-install.json')), false);
});

test('global file collisions and symlink targets fail before writing configuration', () => {
  const { root, options } = globalFixture();
  fs.mkdirSync(path.join(root, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(root, 'agents/endpoint-health.md'), 'My agent');
  assert.throws(() => managePackage('install', undefined, options), /collision/);
  assert.equal(fs.existsSync(path.join(root, 'opencode.json')), false);
  const linked = globalFixture();
  fs.symlinkSync(root, linked.root, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => managePackage('install', undefined, linked.options), /symlink/);
});

test('legacy project manifests remain uninstallable and scope tampering is rejected', () => {
  const root = temp();
  managePackage('install', root);
  const manifestPath = path.join(root, '.opencode/opsphere-opencode-install.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  manifest.version = 1;
  delete manifest.scope;
  delete manifest.configFile;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  managePackage('uninstall', root);
  const global = globalFixture();
  managePackage('install', undefined, global.options);
  const globalManifest = path.join(global.root, 'opsphere-opencode-install.json');
  const bad = JSON.parse(fs.readFileSync(globalManifest));
  bad.scope = 'project';
  fs.writeFileSync(globalManifest, JSON.stringify(bad));
  assert.throws(() => managePackage('uninstall', undefined, global.options), /Valid installation manifest/);
  assert.ok(fs.existsSync(path.join(global.root, 'agents/endpoint-health.md')));
});

test('global CLI installs and uninstalls in an isolated config home; rejects mixed scope arguments', () => {
  const { root, options } = globalFixture();
  const script = fileURLToPath(new URL('../opsphere-opencode/install.mjs', import.meta.url));
  const run = args => spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, ...options.env }, encoding: 'utf8',
  });
  for (const args of [['install', '--global', temp()], ['install', '--unknown'], ['install']]) {
    const result = run(args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Usage:/);
    assert.equal(fs.existsSync(root), false);
  }
  for (const action of ['install', 'uninstall']) {
    const result = run([action, '--global']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).scope, 'global');
  }
});

test('JSONC edits handle empty objects, compact objects, arrays, escapes, BOM and trailing commas', () => {
  for (const before of ['{}', '\uFEFF{\r\n// Windows config\r\n}', '{/* comment */}', '{"mcp":{}}', '{"mcp":{"other":{} }}', '{"mcp":{"other":{},}}', '{"array":["quote: \\"",{"url":"https://example.com"},],}']) {
    const installed = editJsonc(before, ['mcp', 'opsphere'], server);
    assert.deepEqual(readJsonc(installed).value.mcp.opsphere, server);
    const removed = editJsonc(installed, ['mcp', 'opsphere'], undefined, true);
    assert.equal(readJsonc(removed).value.mcp.opsphere, undefined);
  }
});

test('global and project manifests are independent, including global V2 JSONC uninstall', () => {
  const project = temp();
  managePackage('install', project);
  const { root, options } = globalFixture();
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'opencode.jsonc'), '{/* V2 */"mcp":{"servers":{"other":{"type":"local","command":["example"]}}}}');
  managePackage('install', undefined, options);
  const file = path.join(root, 'opencode.jsonc');
  assert.deepEqual(readJsonc(fs.readFileSync(file, 'utf8')).value.mcp.servers.opsphere, server);
  managePackage('uninstall', undefined, options);
  assert.ok(fs.existsSync(path.join(project, '.opencode/agents/endpoint-health.md')));
  assert.ok(fs.existsSync(path.join(project, '.opencode/opsphere-opencode-install.json')));
  assert.ok(fs.readFileSync(file, 'utf8').includes('/* V2 */'));
  assert.deepEqual(readJsonc(fs.readFileSync(file, 'utf8')).value.mcp.servers.other, { type: 'local', command: ['example'] });
  managePackage('uninstall', project);
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
