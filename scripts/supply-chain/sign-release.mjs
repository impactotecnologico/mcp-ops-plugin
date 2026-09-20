import assert from 'node:assert/strict';
import { createHash, createPublicKey, verify, constants } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = data => createHash('sha256').update(data).digest('hex');
export function verifyRelease(bundle, trust, expected, read = name => readFileSync(resolve('build-evidence', name))) {
  assert.equal(bundle.algorithm, 'RSASSA_PSS_SHA_256');
  assert.equal(bundle.keyArn, trust.keyArn);
  const publicDer = Buffer.from(trust.publicKeyDerBase64, 'base64');
  assert.equal(digest(publicDer), trust.publicKeySha256);
  const payload = Buffer.from(bundle.payload, 'base64');
  assert.ok(verify('sha256', payload, {
    key: createPublicKey({ key: publicDer, format: 'der', type: 'spki' }),
    padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32,
  }, Buffer.from(bundle.signature, 'base64')), 'Invalid release signature');
  const statement = JSON.parse(payload);
  assert.equal(statement.version, 1);
  assert.equal(statement.repository, expected.repository);
  assert.equal(statement.revision, expected.revision);
  assert.equal(statement.kind, expected.kind);
  assert.match(statement.revision, /^[a-f0-9]{40}$/);
  assert.ok(statement.subjects.length > 0);
  const seen = new Set();
  for (const subject of statement.subjects) {
    assert.match(subject.name, /^[a-zA-Z0-9_.-]+$/);
    assert.ok(!seen.has(subject.name), 'Duplicate subject');
    seen.add(subject.name);
    assert.equal(digest(read(subject.name)), subject.sha256, 'Changed release subject: ' + subject.name);
  }
  if (expected.kind === 'image') assert.ok(seen.has('image-binding.json') && seen.has('image-attestations.json'));
  else assert.ok(statement.subjects.some(s => /\.(tgz|tar)$/.test(s.name)), 'Missing package/source artifact');
  assert.ok(seen.has('sbom.cdx.json'), 'Missing dependency inventory');
  assert.ok(seen.has('security-scan.json'), 'Missing security scan');
  const scan = JSON.parse(read('security-scan.json'));
  assert.equal(scan.SchemaVersion, 2, 'Unexpected security scan format');
  assert.ok(Array.isArray(scan.Results) && scan.Results.length > 0, 'Empty security scan');
  assert.ok(scan.Results.every(target => !(target.Vulnerabilities ?? []).some(v => ['HIGH', 'CRITICAL', 'UNKNOWN'].includes(v.Severity))), 'Blocked security findings');
  if (expected.kind === 'image') {
    const binding = JSON.parse(read('image-binding.json'));
    assert.equal(binding.revision, expected.revision, 'Image revision mismatch');
    assert.equal(scan.ArtifactName, binding.image, 'Scan is not for this release image');
  }
  return statement;
}
export function signRelease(trust, expected) {
  assert.match(expected.revision ?? '', /^[a-f0-9]{40}$/);
  assert.match(expected.repository ?? '', /^[\w.-]+\/[\w.-]+$/);
  assert.ok(['image', 'package', 'source'].includes(expected.kind));
  const subjects = readdirSync('build-evidence').filter(n => n !== 'release-signature.json').sort().map(name => {
    assert.match(name, /^[a-zA-Z0-9_.-]+$/);
    const path = resolve('build-evidence', name);
    assert.ok(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'Only regular evidence files');
    return { name, sha256: digest(readFileSync(path)) };
  });
  const payload = Buffer.from(JSON.stringify({ version: 1, ...expected, subjects }));
  const response = JSON.parse(execFileSync('aws', ['kms', 'sign', '--key-id', trust.keyArn,
    '--region', trust.region, '--message-type', 'DIGEST', '--signing-algorithm', 'RSASSA_PSS_SHA_256',
    '--cli-binary-format', 'base64', '--message', createHash('sha256').update(payload).digest('base64'),
    '--output', 'json'], { encoding: 'utf8', timeout: 30000 }));
  const bundle = { algorithm: response.SigningAlgorithm, keyArn: response.KeyId, payload: payload.toString('base64'), signature: response.Signature };
  verifyRelease(bundle, trust, expected);
  writeFileSync('build-evidence/release-signature.json', JSON.stringify(bundle, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const trust = JSON.parse(readFileSync('.github/artifact-signing-trust.json'));
  const expected = { repository: process.env.GITHUB_REPOSITORY, revision: process.env.GITHUB_SHA, kind: process.argv[3] };
  if (process.argv[2] === 'sign') signRelease(trust, expected);
  else {
    assert.equal(process.argv[2], 'verify');
    verifyRelease(JSON.parse(readFileSync('build-evidence/release-signature.json')), trust, expected);
  }
  console.log('[OK] KMS release signature ' + process.argv[2] + ' for ' + expected.kind);
}
