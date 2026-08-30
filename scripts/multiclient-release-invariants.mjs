#!/usr/bin/env node
import fs from 'node:fs';

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
for (const [name, text, pattern] of required) {
  if (!pattern.test(text)) { console.error(`FAIL missing ${name}`); failures += 1; }
}
for (const [name, text, pattern] of forbidden) {
  if (pattern.test(text)) { console.error(`FAIL forbidden ${name}`); failures += 1; }
}

if (failures) process.exit(1);
console.log('multiclient-release-invariants: ok');
