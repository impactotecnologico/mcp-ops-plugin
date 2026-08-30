#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const files = {
  skill: fs.readFileSync('skills/connect-another-client/SKILL.md', 'utf8'),
  command: fs.readFileSync('commands/opsphere-connect-another-client.md', 'utf8'),
  codex: fs.readFileSync('.codex-plugin/plugin.json', 'utf8'),
};

const required = [
  ['canonical MCP URL', files.skill, /https:\/\/mcp-cursor\.opsphere\.io\/mcp/],
  ['same account semantics', files.skill, /same email/i],
  ['independent OAuth', files.skill, /Complete OAuth independently/i],
  ['token-copy prohibition', files.skill, /Do not copy OAuth token files/i],
  ['static bearer prohibition', files.skill, /do not configure a static bearer token/i],
  ['Warp local', files.skill, /Warp local/i],
  ['Warp cloud exclusion', files.skill, /cloud.*does not currently support|not available.*cloud/i],
  ['portable skill directory', files.skill, /\.agents\/skills\//],
  ['canonical rules file', files.skill, /AGENTS\.md/],
  ['post-login verification', files.skill, /ops_my_usage.*ops_accounts_list/s],
  ['command delegates to skill', files.command, /skills\/connect-another-client\/SKILL\.md/],
  ['Codex discovery prompt', files.codex, /@connect-another-client/],
];

const forbidden = [
  ['cloud support promise', files.skill, /Warp(?:\/Oz)? cloud (?:is )?supported/i],
  ['client secret request', `${files.skill}\n${files.command}`, /paste.*client secret|send.*client secret/i],
];

let failures = 0;

const warpConfig = JSON.parse(fs.readFileSync('opsphere-warp/mcp/opsphere.json', 'utf8'));
if (warpConfig?.mcpServers?.opsphere?.url !== 'https://mcp-cursor.opsphere.io/mcp') {
  console.error('FAIL Warp package MCP URL/shape');
  failures += 1;
}

for (const skillName of [
  'endpoint-health', 'incident-investigation', 'ci-investigation', 'postmortem-writer',
]) {
  const canonical = fs.readFileSync(path.join('skills', skillName, 'SKILL.md'), 'utf8');
  const packaged = fs.readFileSync(path.join('opsphere-warp', 'skills', skillName, 'SKILL.md'), 'utf8');
  if (canonical !== packaged) {
    console.error(`FAIL Warp skill drift: ${skillName}`);
    failures += 1;
  }
}

const warpRules = fs.readFileSync('opsphere-warp/rules/AGENTS.md', 'utf8');
if (!/live MCP discovery/i.test(warpRules) || !/without explicit user consent/i.test(warpRules)) {
  console.error('FAIL Warp AGENTS.md safety rules');
  failures += 1;
}
if (fs.existsSync('opsphere-warp/rules/WARP.md')) {
  console.error('FAIL package must not install both AGENTS.md and WARP.md');
  failures += 1;
}

for (const [name, text, pattern] of required) {
  if (!pattern.test(text)) { console.error(`FAIL missing ${name}`); failures += 1; }
}
for (const [name, text, pattern] of forbidden) {
  if (pattern.test(text)) { console.error(`FAIL forbidden ${name}`); failures += 1; }
}

if (failures) process.exit(1);
console.log('multiclient-release-invariants: ok');
