import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const version = '0.74.0';
const platforms = {
  'linux-x64': ['Linux-64bit', '2ae6fe3ee734b7fdf11335663e18c75ea12dccc76062f09f164a3b0f8be4371a'],
  'darwin-arm64': ['macOS-ARM64', '1caada5e0e2091909357c7525d3aa76f4b660b13821bc143b190c7483e31cc11'],
};
const platform = platforms[process.platform + '-' + process.arch];
assert.ok(platform, 'Unsupported scanner platform');
const temp = mkdtempSync(join(tmpdir(), 'opsphere-trivy-'));
let bytes;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetch('https://github.com/aquasecurity/trivy/releases/download/v' + version + '/trivy_' + version + '_' + platform[0] + '.tar.gz', { signal: AbortSignal.timeout(180000) });
    assert.ok(response.ok, 'Scanner download failed: ' + response.status);
    bytes = Buffer.from(await response.arrayBuffer());
    break;
  } catch (error) {
    if (attempt === 3) throw error;
    console.error('[RETRY] Scanner download attempt ' + attempt + ' failed');
  }
}
assert.equal(createHash('sha256').update(bytes).digest('hex'), platform[1], 'Untrusted scanner archive');
writeFileSync(join(temp, 'scanner.tar.gz'), bytes);
execFileSync('tar', ['-xzf', join(temp, 'scanner.tar.gz'), '-C', temp, 'trivy']);
mkdirSync('build-evidence', { recursive: true });
const image = process.env.SUPPLY_CHAIN_IMAGE;
const args = image ? ['image', '--image-src', 'remote', '--platform', 'linux/arm64'] : ['fs'];
if (image) assert.match(image, /^\S+@sha256:[a-f0-9]{64}$/);
else args.push('--include-dev-deps', '--skip-dirs', '.git', '--skip-dirs', 'build-evidence');
args.push('--scanners', 'vuln,license', '--license-full', '--severity', 'HIGH,CRITICAL,UNKNOWN',
  '--exit-code', '0', '--timeout', '10m', '--format', 'json', '--output', 'build-evidence/security-scan.json', image ?? '.');
const env = { ...process.env };
if (image && image.includes('.dkr.ecr.')) {
  env.TRIVY_USERNAME = 'AWS';
  env.TRIVY_PASSWORD = execFileSync('aws', ['ecr','get-login-password','--region','eu-west-1'], { encoding:'utf8', timeout:30000 }).trim();
}
const result = spawnSync(join(temp, 'trivy'), args, { env, stdio:'inherit', timeout:660000 });
if (result.error) throw result.error;
assert.equal(result.status, 0, 'Release blocked: scanner failure');
const report = JSON.parse(readFileSync('build-evidence/security-scan.json'));
assert.equal(report.SchemaVersion, 2, 'Missing/unexpected scanner evidence');
assert.ok(Array.isArray(report.Results) && report.Results.length > 0, 'No scan targets found');
const findings = report.Results.flatMap(target => target.Vulnerabilities ?? []);
assert.equal(findings.length, 0, 'Release blocked: high/critical/unknown vulnerabilities; inspect build-evidence/security-scan.json');
console.log('[OK] Vulnerability release gate; license findings retained for separate review, not legal approval');
