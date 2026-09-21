import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createHash, sign, constants } from 'node:crypto';
import { verifyRelease } from './sign-release.mjs';
const pair = generateKeyPairSync('rsa', { modulusLength: 3072 });
const der = pair.publicKey.export({ format: 'der', type: 'spki' });
const sha = value => createHash('sha256').update(value).digest('hex');
const trust = { keyArn: 'fixture-key', publicKeyDerBase64: der.toString('base64'), publicKeySha256: sha(der) };
const expected = { repository: 'fixture/repo', revision: 'a'.repeat(40), kind: 'image' };
const fixtureImage = 'fixture/release@sha256:' + 'b'.repeat(64);
const files = { 'sbom.cdx.json': 'inventory', 'image-binding.json': JSON.stringify({image:fixtureImage,revision:expected.revision}), 'image-attestations.json': 'provenance', 'security-scan.json': JSON.stringify({ SchemaVersion: 2, ArtifactName:fixtureImage, Results: [{ Target: 'fixture', Vulnerabilities: [] }] }) };
const statement = { version: 1, ...expected, subjects: Object.entries(files).map(([name,data]) => ({name,sha256:sha(data)})) };
function bundle(value = statement) {
  const data = Buffer.from(JSON.stringify(value));
  return { algorithm: 'RSASSA_PSS_SHA_256', keyArn: trust.keyArn, payload: data.toString('base64'),
    signature: sign('sha256', data, { key: pair.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }).toString('base64') };
}
const read = name => Buffer.from(files[name]);
test('valid signature binds revision, repository and all artifact evidence', () => assert.deepEqual(verifyRelease(bundle(),trust,expected,read), statement));
test('changed artifact is rejected', () => assert.throws(() => verifyRelease(bundle(),trust,expected,() => Buffer.from('forged'))));
test('changed signed payload is rejected', () => assert.throws(() => verifyRelease({...bundle(),payload:Buffer.from('{}').toString('base64')},trust,expected,read)));
test('another source revision or repository cannot replay a release', () => {
  for (const override of [{revision:'b'.repeat(40)},{repository:'foreign/repo'},{kind:'package'}]) assert.throws(() => verifyRelease(bundle(),trust,{...expected,...override},read));
});
test('untrusted key fingerprint or ARN rejected', () => {
  assert.throws(() => verifyRelease(bundle(),{...trust,publicKeySha256:'0'.repeat(64)},expected,read));
  assert.throws(() => verifyRelease({...bundle(),keyArn:'foreign-key'},trust,expected,read));
});
test('omitted evidence and path traversal fail even if signed', () => {
  assert.throws(() => verifyRelease(bundle({...statement,subjects:[]}),trust,expected,read));
  assert.throws(() => verifyRelease(bundle({...statement,subjects:[{name:'../outside',sha256:sha('')}]}),trust,expected,read));
});
test('a correctly signed release without scan evidence is rejected', () => {
  assert.throws(() => verifyRelease(bundle({...statement,subjects:statement.subjects.filter(s => s.name !== 'security-scan.json')}),trust,expected,read), /Missing security scan/);
});
test('a correctly signed release with high security findings is rejected', () => {
  const bad = JSON.stringify({SchemaVersion:2,Results:[{Vulnerabilities:[{Severity:'HIGH'}]}]});
  const subjects = statement.subjects.map(s => s.name === 'security-scan.json' ? {...s,sha256:sha(bad)} : s);
  assert.throws(() => verifyRelease(bundle({...statement,subjects}),trust,expected,name => name === 'security-scan.json' ? Buffer.from(bad) : read(name)), /Blocked security findings/);
});
test('a clean scan of a different image is rejected even if signed', () => {
  const wrong = JSON.stringify({SchemaVersion:2,ArtifactName:'foreign/image',Results:[{Vulnerabilities:[]}]});
  const subjects = statement.subjects.map(s => s.name === 'security-scan.json' ? {...s,sha256:sha(wrong)} : s);
  assert.throws(() => verifyRelease(bundle({...statement,subjects}),trust,expected,name => name === 'security-scan.json' ? Buffer.from(wrong) : read(name)), /Scan is not for this release image/);
});
