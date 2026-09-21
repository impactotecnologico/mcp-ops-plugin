import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(resolve('.github/supply-chain-tools/package.json'));
const { parse } = require('yaml');
export function validIntegrity(value) {
  const match = String(value ?? '').match(/^sha(256|384|512)-([A-Za-z0-9+/]+=*)$/);
  return !!match && Buffer.from(match[2], 'base64').length === Number(match[1]) / 8;
}
export function checkPolicy(root = process.cwd()) {
  const errors = [];
  const policy = JSON.parse(readFileSync(resolve(root, '.github/supply-chain-policy.json')));
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json')));
  const lockPath = resolve(root, 'pnpm-lock.yaml');
  const lock = existsSync(lockPath) ? parse(readFileSync(lockPath, 'utf8')) : null;
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(spec) && !/^https:\/\/[^\s]+\/[^/]+-\d+\.\d+\.\d+\.tgz$/.test(spec)) errors.push(name + ': direct version is not exact');
      const entry = lock?.importers?.['.']?.[section]?.[name];
      if (!entry || entry.specifier !== spec) errors.push(name + ': package/lock drift');
      if (/^\d/.test(spec) && entry?.version?.split('(')[0] !== spec) errors.push(name + ': resolved version drift');
    }
  }
  for (const [name, entry] of Object.entries(lock?.packages ?? {})) {
    if (!validIntegrity(entry.resolution?.integrity)) errors.push(name + ': missing strong lockfile integrity');
  }
  const checkImage = (image, label) => {
    if (image === 'scratch') return;
    if (!/@sha256:[a-f0-9]{64}$/.test(image) || !policy.images.includes(image)) errors.push(label + ': unreviewed or mutable image ' + image);
  };
  const visit = (value, path) => {
    if (!value || typeof value !== 'object') return;
    if (String(value.uses ?? '').startsWith('docker/setup-buildx-action@') && value.with?.version !== policy.buildxVersion) errors.push(path + ': Buildx version is not reviewed');
    if (String(value.uses ?? '').startsWith('actions/setup-node@') && value.with?.['node-version'] !== policy.nodeVersion) errors.push(path + ': Node tooling version is not reviewed');
    if (String(value.uses ?? '').startsWith('docker/build-push-action@')) {
      if (value.with?.provenance !== 'mode=min,version=v0.2') errors.push(path + ': release provenance is required');
      if (!String(value.with?.sbom ?? '').startsWith('generator=')) errors.push(path + ': pinned SBOM generator is required');
    }
    for (const [key, item] of Object.entries(value)) {
      const where = path + '.' + key;
      if (key === 'uses' && typeof item === 'string' && !item.startsWith('./')) {
        const match = item.match(/^([^@]+)@([a-f0-9]{40})$/);
        if (!match || policy.actions[match[1]] !== match[2]) errors.push(where + ': unreviewed or mutable Action ' + item);
      }
      if (key === 'image' && typeof item === 'string') checkImage(item, where);
      if (key === 'driver-opts' && typeof item === 'string') for (const line of item.split('\n')) {
        if (line.startsWith('image=')) checkImage(line.slice(6), where);
      }
      if (key === 'sbom' && typeof item === 'string' && item.startsWith('generator=')) checkImage(item.slice(10), where);
      if (key === 'run' && typeof item === 'string') {
        for (const line of item.split('\n').filter(line => !line.trim().startsWith('#'))) {
          if (/\bpnpm\s+(?:add|update)\b/.test(line) || /\bnpm\s+install\b/.test(line)) errors.push(where + ': dependency resolution during CI');
          if (/\bpnpm\s+install\b/.test(line) && !/--frozen-lockfile\b/.test(line)) errors.push(where + ': install must freeze the lockfile');
        }
      }
      visit(item, where);
    }
  };
  for (const file of readdirSync(resolve(root, '.github/workflows')).filter(f => /\.ya?ml$/.test(f))) visit(parse(readFileSync(resolve(root, '.github/workflows', file), 'utf8')), file);
  const dockerfile = resolve(root, 'Dockerfile');
  if (existsSync(dockerfile)) {
    for (const match of readFileSync(dockerfile, 'utf8').matchAll(/^FROM\s+(\S+)/gm)) checkImage(match[1], 'Dockerfile');
  }
  const tooling = JSON.parse(readFileSync(resolve(root, '.github/supply-chain-tools/package-lock.json')));
  const toolingPkg = JSON.parse(readFileSync(resolve(root, '.github/supply-chain-tools/package.json')));
  for (const [name, spec] of Object.entries(toolingPkg.dependencies ?? {})) {
    if (!/^\d+\.\d+\.\d+$/.test(spec) || tooling.packages[''].dependencies[name] !== spec) errors.push(name + ': CI tooling version drift');
  }
  for (const [name, entry] of Object.entries(tooling.packages)) {
    if (name && !validIntegrity(entry.integrity)) errors.push(name + ': CI tooling integrity missing');
  }
  return errors;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = checkPolicy();
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('[OK] Reviewed Actions/images and exact, integrity-locked dependencies');
}
