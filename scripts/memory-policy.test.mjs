// Parity of the operational-memory policy across every client variant.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  END,
  SHORT_END,
  SHORT_START,
  START,
  canonicalBlock,
  canonicalShort,
  discoverCarriers,
  walk,
} from './sync-memory-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8').replaceAll('\r\n', '\n');
}

function extractBlock(text) {
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  assert.ok(start !== -1 && end > start, 'memory policy markers present');
  return text.slice(start, end + END.length);
}

test('every variant that tells the model to search memory carries the canonical text', () => {
  const carriers = discoverCarriers();
  assert.ok(
    carriers.length >= 40,
    `expected the sources and all variant copies, found ${carriers.length}`,
  );
  const full = canonicalBlock();
  const short = canonicalShort();
  for (const { relative, kind } of carriers) {
    const text = read(relative);
    if (kind === 'full') {
      assert.equal(extractBlock(text), full, `${relative} must carry the canonical memory policy`);
    } else {
      const start = text.indexOf(SHORT_START);
      const end = text.indexOf(SHORT_END);
      assert.ok(start !== -1 && end > start, `${relative} must carry the short memory rule`);
      assert.equal(
        text.slice(start, end + SHORT_END.length),
        short,
        `${relative} short rule drifted`,
      );
    }
  }
});

test('the root sources and the client variants are covered', () => {
  const covered = new Set(discoverCarriers().map((c) => c.relative.split(path.sep).join('/')));
  for (const required of [
    'rules/onboarding-guide.mdc',
    'skills/incident-investigation/SKILL.md',
    'agents/outage-triage.md',
    'opsphere-vscode/skills/incident-investigation/SKILL.md',
    'opsphere-warp/skills/opsphere-onboarding/SKILL.md',
    'plugins/opsphere/skills/incident-investigation/SKILL.md',
  ]) {
    assert.ok(covered.has(required), `${required} must be a memory policy carrier`);
  }
});

test('no variant keeps the retired retry-with-synonyms guidance', () => {
  const retired = [
    /reformulate \*\*once\*\*/i,
    /retry \*\*once\*\* with hostname/i,
    /gateway auto-retries with synonym expansion/i,
  ];
  for (const file of walk()) {
    const text = read(file);
    for (const pattern of retired) {
      assert.ok(!pattern.test(text), `${file} still contains retired guidance ${pattern}`);
    }
  }
});

test('the policy states the non-negotiables', () => {
  const block = canonicalBlock();
  for (const required of [
    'Search once',
    'do not retry with synonyms',
    'scope_unresolved',
    'never as proof of current state',
    'memory:<id>@r<revision>',
    'Never invent references',
    'no raw logs, no secrets',
  ]) {
    assert.ok(block.toLowerCase().includes(required.toLowerCase()), `policy mentions: ${required}`);
  }
});
