#!/usr/bin/env node
// Explicit project-only installer. Never reads or copies authentication credentials.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const bundle = path.dirname(fileURLToPath(import.meta.url));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const read = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
const MARKER_BEGIN = '<!-- opsphere-opencode:begin -->';
const MARKER_END = '<!-- opsphere-opencode:end -->';

function safePath(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) throw Error('Path escapes project');
  let current = root;
  for (const part of path.relative(root, target).split(path.sep)) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw Error(`Refusing symlink: ${current}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}

function filesUnder(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw Error('Bundle must not contain symlinks');
    const name = path.join(prefix, entry.name);
    return entry.isDirectory() ? filesUnder(path.join(dir, entry.name), name) : [name];
  });
}

function loadConfig(configBefore) {
  if (configBefore === null) return {};
  const config = JSON.parse(configBefore);
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw Error('Invalid existing OpenCode configuration');
  if (config.mcp && (typeof config.mcp !== 'object' || Array.isArray(config.mcp))) throw Error('Invalid existing MCP configuration');
  return config;
}

function existingOpsphere(config) {
  if (config.mcp?.servers && typeof config.mcp.servers === 'object' && !Array.isArray(config.mcp.servers)) {
    return { location: 'servers', value: config.mcp.servers.opsphere };
  }
  if (config.mcp?.opsphere) return { location: 'legacy', value: config.mcp.opsphere };
  return { location: 'legacy', value: undefined };
}

function applyServer(config, server, location) {
  config.mcp = { ...(config.mcp ?? {}) };
  if (location === 'servers') {
    config.mcp.servers = { ...(config.mcp.servers ?? {}), opsphere: server };
    return;
  }
  config.mcp.opsphere = server;
}

function removeServer(config, location) {
  if (location === 'servers' && config.mcp?.servers) {
    delete config.mcp.servers.opsphere;
    return;
  }
  if (config.mcp) delete config.mcp.opsphere;
}

export function managePackage(action, project) {
  if (!['install', 'uninstall'].includes(action) || !project) throw Error('Usage: node install.mjs install|uninstall <project-directory>');
  const root = fs.realpathSync(project);
  if (root === path.parse(root).root || root === os.homedir()) throw Error('Select a project directory, not a filesystem root or home');
  const manifestPath = safePath(root, '.opencode/opsphere-opencode-install.json');
  const configPath = safePath(root, 'opencode.json');
  const rulesPath = safePath(root, 'AGENTS.md');
  const configBefore = read(configPath);
  const config = loadConfig(configBefore);
  const server = JSON.parse(fs.readFileSync(path.join(bundle, 'mcp/opsphere.json'), 'utf8')).mcp.opsphere;
  const block = '\n' + MARKER_BEGIN + '\n' + fs.readFileSync(path.join(bundle, 'rules/AGENTS.md'), 'utf8').trimEnd() + '\n' + MARKER_END + '\n';
  const ownedRoots = [
    ['skills', '.opencode/skills'],
    ['agents', '.opencode/agents'],
    ['commands', '.opencode/commands'],
  ];

  if (action === 'install') {
    if (read(manifestPath)) throw Error('Package already installed. Uninstall first to upgrade; modified files will be preserved.');
    const rulesBefore = read(rulesPath);
    if (rulesBefore?.includes(MARKER_BEGIN) || rulesBefore?.includes('<!-- opsphere-opencode:')) {
      throw Error('Existing Opsphere OpenCode rule block requires manual review');
    }
    const found = existingOpsphere(config);
    if (found.value && JSON.stringify(found.value) !== JSON.stringify(server)) {
      throw Error('Existing opsphere MCP entry differs; preserve it and resolve manually');
    }
    const location = found.location;
    const pending = ownedRoots.flatMap(([source, dest]) => {
      const dir = path.join(bundle, source);
      return filesUnder(dir).map(relative => {
        const target = safePath(root, path.join(dest, relative));
        const content = fs.readFileSync(path.join(dir, relative), 'utf8');
        const previous = read(target);
        if (previous !== null && previous !== content) throw Error(`File collision; no files changed: ${target}`);
        return { relative: path.relative(root, target), content, created: previous === null, hash: hash(content) };
      });
    });
    const manifest = {
      version: 1, root, serverAdded: !found.value, server, location, block,
      rulesCreated: rulesBefore === null,
      files: pending.filter(p => p.created).map(({ relative, hash }) => ({ relative, hash })),
    };
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    for (const file of pending.filter(p => p.created)) {
      const target = safePath(root, file.relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.content, { flag: 'wx' });
    }
    applyServer(config, found.value ?? server, location);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    fs.writeFileSync(rulesPath, (rulesBefore ?? '') + block);
    return { installed: true, project: root, next: 'Run opencode mcp auth opsphere (or /mcps) and complete OAuth yourself.' };
  }

  const manifest = JSON.parse(read(manifestPath) ?? 'null');
  if (!manifest || manifest.version !== 1 || manifest.root !== root) throw Error('Valid installation manifest required');
  if (!Array.isArray(manifest.files) || manifest.files.some(file =>
    typeof file.relative !== 'string' || !file.relative.startsWith('.opencode/') ||
    path.normalize(file.relative) !== file.relative || !/^[a-f0-9]{64}$/.test(file.hash))) throw Error('Invalid manifest files');
  if (typeof manifest.block !== 'string' || !manifest.block.includes(MARKER_BEGIN) || !manifest.block.includes(MARKER_END)) {
    throw Error('Invalid manifest rule block');
  }
  for (const file of manifest.files) safePath(root, file.relative);
  const backupRoot = safePath(root, `.opencode/opsphere-opencode-removed-${Date.now()}`);
  const preserved = [];
  for (const file of manifest.files) {
    const target = safePath(root, file.relative);
    const content = read(target);
    if (content === null) continue;
    if (hash(content) !== file.hash) { preserved.push(file.relative); continue; }
    const backup = safePath(backupRoot, file.relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.renameSync(target, backup);
  }
  const current = existingOpsphere(config);
  if (manifest.serverAdded && JSON.stringify(current.value) === JSON.stringify(manifest.server)) {
    removeServer(config, manifest.location === 'servers' ? 'servers' : 'legacy');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  } else if (manifest.serverAdded && current.value) preserved.push('opencode.json:opsphere');
  const rules = read(rulesPath);
  if (rules?.includes(manifest.block)) fs.writeFileSync(rulesPath, rules.replace(manifest.block, ''));
  else if (rules?.includes(MARKER_BEGIN)) preserved.push('AGENTS.md:modified-block');
  fs.mkdirSync(backupRoot, { recursive: true });
  fs.renameSync(manifestPath, path.join(backupRoot, 'install-manifest.json'));
  return { uninstalled: true, preserved, backup: backupRoot, next: 'Local removal does not revoke OAuth. Revoke only this client session separately if desired.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(managePackage(process.argv[2], process.argv[3]), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
