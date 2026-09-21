import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPolicy, validIntegrity } from './check.mjs';
import { componentsFromLock } from './inventory.mjs';
import { validateImageEvidence } from './verify-image.mjs';
const sha = 'a'.repeat(40), digest = 'sha256:' + 'b'.repeat(64), runtime = 'sha256:' + 'c'.repeat(64);
const integrity = 'sha512-' + Buffer.alloc(64, 1).toString('base64');
const policy = JSON.parse(readFileSync('.github/supply-chain-policy.json'));
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'opsphere-r08-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const folder of ['.github/workflows', '.github/supply-chain-tools']) mkdirSync(join(dir, folder), { recursive: true });
  const set = (file, value) => writeFileSync(join(dir, file), typeof value === 'string' ? value : JSON.stringify(value));
  set('package.json', { dependencies: { foo: '1.2.3' } });
  set('pnpm-lock.yaml', 'lockfileVersion: "9.0"\nimporters:\n  .:\n    dependencies:\n      foo:\n        specifier: 1.2.3\n        version: 1.2.3\npackages:\n  foo@1.2.3:\n    resolution: {integrity: ' + integrity + '}\n');
  set('.github/supply-chain-policy.json', policy);
  set('.github/supply-chain-tools/package.json', { dependencies: { yaml: '2.8.1' } });
  set('.github/supply-chain-tools/package-lock.json', { packages: { '': { dependencies: { yaml: '2.8.1' } }, 'node_modules/yaml': { integrity } } });
  set('.github/workflows/ci.yml', 'jobs:\n  test:\n    steps:\n      - uses: actions/checkout@' + policy.actions['actions/checkout'] + '\n      - run: pnpm install --frozen-lockfile\n');
  return { dir, set };
}
function evidence() {
  return {
    manifest: { digest, manifests: [
      { digest: runtime, platform: { os: 'linux', architecture: 'arm64' } },
      { digest: 'sha256:' + 'd'.repeat(64), annotations: { 'vnd.docker.reference.type': 'attestation-manifest', 'vnd.docker.reference.digest': runtime } },
    ] },
    provenance: { SLSA: { buildType: 'https://mobyproject.org/buildkit@v1', materials: [{ uri: 'pkg:docker/node' }],
      metadata: { 'https://mobyproject.org/buildkit@v1#metadata': { vcs: { revision: sha, source: 'https://github.com/opsphere-io/example.git' } } } } },
    sbom: { SPDX: { spdxVersion: 'SPDX-2.3', SPDXID: 'SPDXRef-DOCUMENT', packages: [{ name: 'node' }] } },
  };
}
const expected = { digest, revision: sha, repository: 'https://github.com/opsphere-io/example' };
test('reviewed policy passes', t => { const f = fixture(t); assert.deepEqual(checkPolicy(f.dir), []); });
test('image releases cannot disable SBOM or provenance', t => {
  const f = fixture(t);
  f.set('.github/workflows/ci.yml', 'steps:\n  - uses: docker/build-push-action@' + policy.actions['docker/build-push-action'] + '\n    with:\n      provenance: false\n      sbom: false\n');
  const errors = checkPolicy(f.dir).join();
  assert.match(errors, /provenance is required/);
  assert.match(errors, /SBOM generator is required/);
});
test('mutable or unapproved Action fails', t => {
  const f = fixture(t);
  for (const ref of ['v4', 'e'.repeat(40)]) {
    f.set('.github/workflows/ci.yml', 'steps:\n  - uses: actions/checkout@' + ref + '\n');
    assert.match(checkPolicy(f.dir).join(), /unreviewed or mutable Action/);
  }
});
test('floating Docker/service images fail', t => {
  const f = fixture(t); f.set('Dockerfile', 'FROM node:22-bookworm-slim\n');
  f.set('.github/workflows/ci.yml', 'jobs:\n  test:\n    services:\n      db:\n        image: postgres:16\n');
  assert.equal(checkPolicy(f.dir).filter(e => e.includes('mutable image')).length, 2);
});
test('scratch is accepted as Docker built-in empty base', t => {
  const f = fixture(t); f.set('Dockerfile', 'FROM scratch\n');
  assert.deepEqual(checkPolicy(f.dir), []);
});
test('dependency ranges and lock drift fail', t => {
  const f = fixture(t); f.set('package.json', { dependencies: { foo: '^1.2.3' } });
  assert.match(checkPolicy(f.dir).join(), /version is not exact/);
  f.set('package.json', { dependencies: { foo: '1.2.4' } });
  assert.match(checkPolicy(f.dir).join(), /drift/);
});
test('strong, correctly sized package integrity is mandatory', () => {
  for (const value of [undefined, 'sha1-' + 'a'.repeat(20), 'sha512-short']) assert.equal(validIntegrity(value), false);
  assert.equal(validIntegrity(integrity), true);
});
test('CI cannot re-resolve dependencies', t => {
  const f = fixture(t);
  for (const command of ['pnpm install --no-frozen-lockfile', 'pnpm add esbuild', 'npm install yaml']) {
    f.set('.github/workflows/ci.yml', 'steps:\n  - run: ' + command + '\n');
    assert.ok(checkPolicy(f.dir).length);
  }
});
test('tooling lock cannot omit integrity', t => {
  const f = fixture(t); f.set('.github/supply-chain-tools/package-lock.json', { packages: { '': { dependencies: { yaml: '2.8.1' } }, 'node_modules/yaml': {} } });
  assert.match(checkPolicy(f.dir).join(), /integrity missing/);
});
test('SBOM preserves npm package versions and registry hash', () => {
  const result = componentsFromLock({ packages: { '@scope/name@1.2.3': { resolution: { integrity } } } });
  assert.equal(result[0].purl, 'pkg:npm/%40scope/name@1.2.3');
  assert.equal(result[0].hashes[0].content, Buffer.alloc(64, 1).toString('hex'));
  assert.throws(() => componentsFromLock({ packages: { 'foo@1.2.3': { resolution: {} } } }));
});
test('versioned private tarballs are inventoried without replacing their version', () => {
  const [item] = componentsFromLock({ packages: { 'mcp-ops-db@https://registry.example/mcp-ops-db-2.64.3.tgz': { resolution: { integrity } } } });
  assert.equal(item.name, 'mcp-ops-db'); assert.equal(item.version, '2.64.3');
});
test('valid single-platform evidence selects child ARM64 digest, not attested index', () => {
  assert.equal(validateImageEvidence(evidence(), expected), runtime);
});
test('missing, foreign or dirty source evidence blocks deployment', () => {
  for (const revision of [undefined, 'f'.repeat(40), sha + '-dirty']) {
    const value = evidence(); value.provenance.SLSA.metadata['https://mobyproject.org/buildkit@v1#metadata'].vcs.revision = revision;
    assert.throws(() => validateImageEvidence(value, expected));
  }
  assert.throws(() => validateImageEvidence(evidence(), { ...expected, repository: 'https://github.com/attacker/repo' }));
});
test('wrong index digest, unbound attestation or absent SBOM blocks deployment', () => {
  const a = evidence(); a.manifest.digest = runtime; assert.throws(() => validateImageEvidence(a, expected));
  const b = evidence(); b.manifest.manifests.pop(); assert.throws(() => validateImageEvidence(b, expected));
  const c = evidence(); c.sbom = {}; assert.throws(() => validateImageEvidence(c, expected));
});
test('valid multi-platform index retains the ARM64 runtime selection', () => {
  const value = evidence(), amd = 'sha256:' + 'e'.repeat(64);
  value.manifest.manifests.push(
    { digest: amd, platform: { os: 'linux', architecture: 'amd64' } },
    { digest: 'sha256:' + 'f'.repeat(64), annotations: { 'vnd.docker.reference.type': 'attestation-manifest', 'vnd.docker.reference.digest': amd } },
  );
  value.provenance = { 'linux/arm64': value.provenance, 'linux/amd64': structuredClone(value.provenance) };
  value.sbom = { 'linux/arm64': value.sbom, 'linux/amd64': structuredClone(value.sbom) };
  assert.equal(validateImageEvidence(value, expected), runtime);
});
test('multi-platform attestations must cover every published runtime platform', () => {
  const value = evidence();
  value.manifest.manifests.push({ digest: 'sha256:' + 'e'.repeat(64), platform: { os: 'linux', architecture: 'amd64' } });
  value.provenance = { 'linux/arm64': value.provenance };
  value.sbom = { 'linux/arm64': value.sbom };
  assert.throws(() => validateImageEvidence(value, expected));
});
