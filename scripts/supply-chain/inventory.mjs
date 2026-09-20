import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { validIntegrity } from './check.mjs';
const require = createRequire(resolve('.github/supply-chain-tools/package.json'));
const { parse } = require('yaml');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function componentsFromLock(lock) {
  return Object.entries(lock.packages ?? {}).map(([key, entry]) => {
    const split = key.lastIndexOf('@');
    let name = key.slice(0, split), version = key.slice(split + 1);
    if (key.includes('@https://')) {
      name = key.slice(0, key.indexOf('@https://'));
      const match = key.match(/-(\d+\.\d+\.\d+)\.tgz$/);
      if (!match) throw Error('Unrecognized versioned tarball: ' + key);
      version = match[1];
    }
    const sri = entry.resolution?.integrity?.match(/^sha(256|384|512)-([A-Za-z0-9+/]+=*)$/);
    if (!name || !version || !sri || !validIntegrity(entry.resolution.integrity)) throw Error('Unverifiable package: ' + key);
    const purl = 'pkg:npm/' + encodeURIComponent(name).replace('%2F', '/') + '@' + version;
    return { type: 'library', name, version, purl, 'bom-ref': key,
      hashes: [{ alg: 'SHA-' + sri[1], content: Buffer.from(sri[2], 'base64').toString('hex') }] };
  });
}
export function createEvidence(artifact) {
  const pkg = JSON.parse(readFileSync('package.json'));
  const lock = existsSync('pnpm-lock.yaml') ? parse(readFileSync('pnpm-lock.yaml', 'utf8')) : null;
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (process.env.GITHUB_SHA && sha !== process.env.GITHUB_SHA) throw Error('Checkout revision differs from CI');
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const components = lock ? componentsFromLock(lock) : files.map(file => ({
    type: 'file', name: file, 'bom-ref': file,
    hashes: [{ alg: 'SHA-256', content: hash(readFileSync(file)) }],
  }));
  const output = resolve('build-evidence');
  mkdirSync(output, { recursive: true });
  const bom = { bomFormat: 'CycloneDX', specVersion: '1.5', version: 1,
    metadata: { timestamp: new Date().toISOString(),
      component: { type: 'application', name: pkg.name, version: pkg.version },
      properties: [{ name: 'opsphere:inventory-scope', value: lock ? 'all locked build and runtime npm dependencies; not an installed-runtime SBOM' : 'tracked source files, not a marketplace installation' }] },
    components };
  writeFileSync(resolve(output, 'sbom.cdx.json'), JSON.stringify(bom, null, 2) + '\n');
  const subjects = [{ name: 'sbom.cdx.json', digest: { sha256: hash(readFileSync(resolve(output, 'sbom.cdx.json'))) } }];
  if (artifact) subjects.push({ name: basename(artifact), digest: { sha256: hash(readFileSync(artifact)) } });
  const materialFiles = ['package.json', 'pnpm-lock.yaml', '.github/supply-chain-policy.json', '.github/supply-chain-tools/package-lock.json', 'Dockerfile'].filter(existsSync);
  const source = process.env.GITHUB_REPOSITORY ? 'https://github.com/' + process.env.GITHUB_REPOSITORY : 'local-checkout';
  const provenance = { _type: 'https://in-toto.io/Statement/v0.1', subject: subjects,
    predicateType: 'https://slsa.dev/provenance/v0.2',
    predicate: { builder: { id: process.env.GITHUB_WORKFLOW_REF ?? 'local' },
      buildType: 'https://opsphere.io/build/dependency-inventory/v1',
      invocation: { configSource: { uri: source, digest: { sha1: sha }, entryPoint: process.env.GITHUB_WORKFLOW ?? 'local' },
        parameters: { packageVersion: pkg.version, runId: process.env.GITHUB_RUN_ID ?? null, runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null, trackedChanges: execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean) } },
      metadata: { buildFinishedOn: new Date().toISOString(), reproducible: false,
        completeness: { parameters: true, environment: false, materials: false } },
      materials: materialFiles.map(file => ({ uri: file, digest: { sha256: hash(readFileSync(file)) } })) } };
  writeFileSync(resolve(output, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
  console.log('[OK] ' + components.length + ' inventory components; provenance is CI-generated, NOT independently signed');
  return { bom, provenance };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) createEvidence(process.argv[2]);
