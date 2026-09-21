import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const normalize = value => String(value ?? '').replace(/^git\+/, '').replace(/^git@github.com:/, 'https://github.com/').replace(/\.git$/, '').replace(/\/$/, '');
export function validateImageEvidence({ manifest, provenance, sbom }, { digest, revision, repository }) {
  assert.match(digest, digestPattern);
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.equal(manifest.digest, digest, 'Registry index digest mismatch');
  const images = (manifest.manifests ?? []).filter(m => m.platform?.os === 'linux' && ['amd64', 'arm64'].includes(m.platform?.architecture));
  assert.ok(images.length, 'No supported runtime manifests');
  for (const image of images) {
    assert.match(image.digest, digestPattern);
    const platform = 'linux/' + image.platform.architecture;
    const attestation = manifest.manifests.find(m => m.annotations?.['vnd.docker.reference.type'] === 'attestation-manifest' && m.annotations?.['vnd.docker.reference.digest'] === image.digest);
    assert.ok(attestation, platform + ': missing digest-bound attestation');
    assert.match(attestation.digest, digestPattern);
    const slsa = (provenance?.[platform] ?? provenance)?.SLSA;
    const spdx = (sbom?.[platform] ?? sbom)?.SPDX;
    assert.equal(slsa?.buildType, 'https://mobyproject.org/buildkit@v1', platform + ': unexpected builder schema');
    const vcs = slsa.metadata?.['https://mobyproject.org/buildkit@v1#metadata']?.vcs;
    const config = slsa.invocation?.configSource;
    assert.equal(vcs?.revision ?? config?.digest?.sha1, revision, platform + ': source revision mismatch/missing/dirty');
    assert.equal(normalize(vcs?.source ?? config?.uri), normalize(repository), platform + ': source repository mismatch');
    assert.ok(Array.isArray(slsa.materials) && slsa.materials.length > 0, platform + ': missing build materials');
    assert.match(spdx?.spdxVersion ?? '', /^SPDX-2\./, platform + ': missing SPDX');
    assert.equal(spdx.SPDXID, 'SPDXRef-DOCUMENT');
    assert.ok(Array.isArray(spdx.packages) && spdx.packages.length > 0, platform + ': empty SBOM');
  }
  const arm = images.filter(m => m.platform.architecture === 'arm64');
  assert.equal(arm.length, 1, 'Expected exactly one ARM64 runtime image');
  return arm[0].digest;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const image = process.env.SUPPLY_CHAIN_IMAGE;
  assert.match(image ?? '', /^\S+@sha256:[a-f0-9]{64}$/);
  const format = '{"manifest":{{json .Manifest}},"provenance":{{json .Provenance}},"sbom":{{json .SBOM}}}';
  const raw = execFileSync('docker', ['buildx', 'imagetools', 'inspect', image, '--format', format], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
  const evidence = JSON.parse(raw);
  const runtime = validateImageEvidence(evidence, {
    digest: image.split('@').at(-1), revision: process.env.GITHUB_SHA,
    repository: process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY,
  });
  mkdirSync('build-evidence', { recursive: true });
  writeFileSync('build-evidence/image-attestations.json', JSON.stringify(evidence, null, 2) + '\n');
  writeFileSync('build-evidence/image-binding.json', JSON.stringify({ image, runtimeDigest: runtime, revision: process.env.GITHUB_SHA, workflow: process.env.GITHUB_WORKFLOW_REF, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT }, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'runtime_digest=' + runtime + '\n');
  console.log('[OK] Source-bound SBOM/provenance; deploy ARM64 digest ' + runtime);
}
