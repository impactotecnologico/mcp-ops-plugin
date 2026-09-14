#!/usr/bin/env node
// Explicit installer for workspace or global Antigravity plugins. Never reads or copies authentication credentials.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const bundle = path.dirname(fileURLToPath(import.meta.url));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const read = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
const PLUGIN_NAME = 'opsphere';

function filesUnder(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw Error('Bundle must not contain symlinks');
    const name = path.join(prefix, entry.name);
    return entry.isDirectory() ? filesUnder(path.join(dir, entry.name), name) : [name];
  });
}

function pluginRelatives() {
  const files = ['plugin.json', 'mcp_config.json'];
  for (const dir of ['skills', 'rules', 'agents']) {
    files.push(...filesUnder(path.join(bundle, dir)).map(relative => path.join(dir, relative)));
  }
  return files;
}

function safeJoin(root, relative) {
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) throw Error('Path escapes destination');
  let current = root;
  const parts = target === root ? [] : path.relative(root, target).split(path.sep);
  for (const part of parts) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw Error(`Refusing symlink: ${current}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}

function resolveTarget(scope, project) {
  if (scope === 'workspace') {
    if (!project) throw Error('Usage: node install.mjs install|uninstall workspace <project-directory>');
    const root = fs.realpathSync(project);
    if (root === path.parse(root).root || root === os.homedir()) throw Error('Select a project directory, not a filesystem root or home');
    return {
      scope,
      root,
      pluginDir: path.join(root, '.agents/plugins', PLUGIN_NAME),
      pluginRelative: path.join('.agents/plugins', PLUGIN_NAME),
      manifestRelative: '.agents/opsphere-antigravity-install.json',
      manifestPath: path.join(root, '.agents/opsphere-antigravity-install.json'),
    };
  }
  if (scope === 'global') {
    const home = os.homedir();
    const pluginDir = path.join(home, '.gemini/config/plugins', PLUGIN_NAME);
    return {
      scope,
      root: home,
      pluginDir,
      pluginRelative: path.join('.gemini/config/plugins', PLUGIN_NAME),
      manifestRelative: path.join('.gemini/config/plugins', '.opsphere-antigravity-install.json'),
      manifestPath: path.join(home, '.gemini/config/plugins', '.opsphere-antigravity-install.json'),
    };
  }
  throw Error('Usage: node install.mjs install|uninstall workspace <project-directory> | install|uninstall global');
}

export function managePackage(action, scope, project) {
  if (!['install', 'uninstall'].includes(action)) throw Error('Usage: node install.mjs install|uninstall workspace <project-directory> | install|uninstall global');
  const target = resolveTarget(scope, project);
  const pluginRoot = target.scope === 'workspace' ? fs.realpathSync(target.root) : path.resolve(target.root);
  const pluginDir = target.scope === 'workspace' ? safeJoin(pluginRoot, target.pluginRelative) : path.resolve(target.pluginDir);
  const manifestPath = target.scope === 'workspace' ? safeJoin(pluginRoot, target.manifestRelative) : path.resolve(target.manifestPath);
  const relatives = pluginRelatives();
  const server = JSON.parse(fs.readFileSync(path.join(bundle, 'mcp_config.json'), 'utf8')).mcpServers.opsphere;

  if (action === 'install') {
    if (read(manifestPath)) throw Error('Package already installed. Uninstall first to upgrade; modified files will be preserved.');
    if (target.scope === 'workspace') {
      safeJoin(pluginRoot, '.agents');
      safeJoin(pluginRoot, '.agents/plugins');
    }
    const pending = relatives.map(relative => {
      const dest = path.join(pluginDir, relative);
      if (target.scope === 'workspace') safeJoin(pluginRoot, path.join(target.pluginRelative, relative));
      const content = fs.readFileSync(path.join(bundle, relative), 'utf8');
      const previous = read(dest);
      if (previous !== null && previous !== content) throw Error(`Plugin collision; no files changed: ${dest}`);
      return {
        relative: path.join(target.pluginRelative, relative),
        content,
        created: previous === null,
        hash: hash(content),
      };
    });
    const manifest = {
      version: 1,
      scope: target.scope,
      root: target.scope === 'workspace' ? pluginRoot : path.resolve(target.root),
      pluginRelative: target.pluginRelative,
      server,
      files: pending.filter(p => p.created).map(({ relative, hash }) => ({ relative, hash })),
    };
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    for (const file of pending.filter(p => p.created)) {
      const dest = path.join(target.root, file.relative);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, file.content, { flag: 'wx' });
    }
    const next = target.scope === 'workspace'
      ? 'Reload the Antigravity workspace and complete OAuth yourself. Do not add a duplicate opsphere server in mcp_config.json.'
      : 'Reload Antigravity and complete OAuth yourself. Do not add a duplicate opsphere server in ~/.gemini/config/mcp_config.json.';
    return { installed: true, scope: target.scope, plugin: pluginDir, next };
  }

  const manifest = JSON.parse(read(manifestPath) ?? 'null');
  if (!manifest || manifest.version !== 1 || manifest.scope !== target.scope) throw Error('Valid installation manifest required');
  if (target.scope === 'workspace' && manifest.root !== pluginRoot) throw Error('Valid installation manifest required');
  if (!Array.isArray(manifest.files) || manifest.files.some(file =>
    typeof file.relative !== 'string' || !file.relative.startsWith(target.pluginRelative) ||
    path.normalize(file.relative) !== file.relative || !/^[a-f0-9]{64}$/.test(file.hash))) throw Error('Invalid manifest files');
  const backupName = target.scope === 'workspace'
    ? `.agents/opsphere-antigravity-removed-${Date.now()}`
    : `.gemini/config/plugins/opsphere-antigravity-removed-${Date.now()}`;
  const backupRoot = path.join(target.root, backupName);
  if (target.scope === 'workspace') safeJoin(pluginRoot, backupName);
  const preserved = [];
  for (const file of manifest.files) {
    const dest = path.join(target.root, file.relative);
    if (target.scope === 'workspace') safeJoin(pluginRoot, file.relative);
    const content = read(dest);
    if (content === null) continue;
    if (hash(content) !== file.hash) { preserved.push(file.relative); continue; }
    const backup = path.join(backupRoot, file.relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.renameSync(dest, backup);
  }
  fs.mkdirSync(backupRoot, { recursive: true });
  fs.renameSync(manifestPath, path.join(backupRoot, 'install-manifest.json'));
  return {
    uninstalled: true,
    scope: target.scope,
    preserved,
    backup: backupRoot,
    next: 'Local removal does not revoke OAuth. Revoke only this client session separately if desired.',
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(managePackage(process.argv[2], process.argv[3], process.argv[4]), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
