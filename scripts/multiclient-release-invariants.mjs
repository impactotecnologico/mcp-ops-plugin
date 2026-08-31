#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const files = {
  skill: fs.readFileSync('skills/connect-another-client/SKILL.md', 'utf8'),
  command: fs.readFileSync('commands/opsphere-connect-another-client.md', 'utf8'),
  codex: fs.readFileSync('.codex-plugin/plugin.json', 'utf8'),
  warpReadme: fs.readFileSync('opsphere-warp/README.md', 'utf8'),
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
  ['all-plan access', files.skill, /available across all Opsphere plans/],
  ['no account invitation required', files.skill, /No invitation or account allowlist is required/],
  ['project approval instructions', files.skill, /project configs require explicit approval/i],
  ['Personal picker instructions', files.skill, /select \*\*Personal Workspace\*\* in the OAuth picker/],
  ['public package availability check', files.skill, /actually published before promising/],
];

const forbidden = [
  ['obsolete canary restriction', `${files.skill}\n${files.command}\n${files.warpReadme}`, /is canary-gated|confirm canary access|canary access unconfirmed|invited canary accounts/i],
  ['cloud support promise', files.skill, /Warp(?:\/Oz)? cloud (?:is )?supported/i],
  ['client secret request', `${files.skill}\n${files.command}`, /paste.*client secret|send.*client secret/i],
];

let failures = 0;

const warpConfig = JSON.parse(fs.readFileSync('opsphere-warp/mcp/opsphere.json', 'utf8'));
if (warpConfig?.mcpServers?.opsphere?.url !== 'https://mcp-cursor.opsphere.io/mcp') {
  console.error('FAIL Warp package MCP URL/shape');
  failures += 1;
}

// Parse user-copyable examples, not just URL substrings: a Markdown URL inside
// a JSON string is valid JSON but invalid MCP configuration.
const examples = [...files.warpReadme.matchAll(/```json\s*\n([\s\S]*?)```/g)];
if (!examples.length) {
  console.error('FAIL Warp README has no copyable JSON configuration');
  failures += 1;
}
for (const [, source] of examples) {
  try {
    const parsed = JSON.parse(source);
    if (JSON.stringify(parsed) !== JSON.stringify(warpConfig)) throw new Error('example differs from packaged MCP config');
  } catch (error) {
    console.error(`FAIL Warp README configuration: ${error.message}`);
    failures += 1;
  }
}

for (const [name, document] of [['skill', files.skill], ['README', files.warpReadme]]) {
  for (const requiredPath of ['~/.warp/.mcp.json', '<repo>/.warp/.mcp.json']) {
    if (!document.includes(requiredPath)) {
      console.error(`FAIL ${name}: missing exact config path ${requiredPath}`);
      failures += 1;
    }
  }
  if (/~\/\.warp\/mcp\.json/.test(document)) {
    console.error(`FAIL ${name}: incorrect non-hidden mcp.json filename`);
    failures += 1;
  }
  for (const target of [
    'https://github.com/opsphere-io/opsphere-plugin/archive/refs/heads/main.zip',
    'mailto:contact@opsphere.io',
  ]) {
    const links = [...document.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]);
    if (!links.includes(target)) {
      console.error(`FAIL ${name}: missing package acquisition route ${target}`);
      failures += 1;
    }
  }
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
