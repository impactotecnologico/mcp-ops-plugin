#!/usr/bin/env node
// Portable packages share these client-independent skills with the root plugin.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skills=['endpoint-health','incident-investigation','ci-investigation','postmortem-writer','qa-test-investigation','qa-release-readiness','configure-deployment-catalog'];
for (const skill of skills) {
  const source=fs.readFileSync(path.join(root,'skills',skill,'SKILL.md'),'utf8');
  for(const pkg of ['opsphere-warp','opsphere-opencode','opsphere-antigravity','opsphere-copilot']) {
    const destination=path.join(root,pkg,'skills',skill,'SKILL.md');
    if(process.argv.includes('--check')) assert.equal(fs.readFileSync(destination,'utf8'),source,`Portable skill drift: ${destination}`);
    else {
      fs.mkdirSync(path.dirname(destination),{recursive:true});
      fs.writeFileSync(destination,source);
    }
  }
}
console.log('Portable skills synchronized');
