#!/usr/bin/env node
// Generates the canonical operational-memory policy into EVERY client variant that tells the model
// to use `memory_search` (root sources and all opsphere-* / plugins/* copies), so no variant can
// drift. Canonical text lives in scripts/memory-policy.canonical.md (full) and
// scripts/memory-policy.short.md (one sentence for short router rules).
//
//   node scripts/sync-memory-policy.mjs          rewrite every carrier
//   node scripts/sync-memory-policy.mjs --check  fail when a carrier is missing or out of date
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const START = '<!-- opsphere:memory-policy:start v1 -->';
export const END = '<!-- opsphere:memory-policy:end -->';
export const SHORT_START = '<!-- opsphere:memory-short:start v1 -->';
export const SHORT_END = '<!-- opsphere:memory-short:end -->';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'docs',
  'assets',
  'client-connectivity',
  'scripts',
]);
const REFERENCE_FILES = new Set(['CHANGELOG.md', 'README.md', 'SECURITY.md']);
/** Short router rules carry the one-sentence form instead of the full section. */
const SHORT_RULE_NAMES = new Set(['opsphere-router.mdc', 'opsphere.md', 'AGENTS.md']);

/** Pre-policy sentences that the short form replaces the first time it is applied. */
const LEGACY_SHORT_SENTENCES = [
  /Before repeating a long incident or outage triage, call `memory_search` when `memory_\*` tools are in `tools\/list`; after a useful investigation, `memory_store` a short distilled summary with no secrets or raw logs\. If `memory_\*` is absent from `tools\/list`, do not invent those tools\./,
  /Before a long incident triage, call `memory_search` when `memory_\*` is in `tools\/list`; after a useful finding, `memory_store` a short summary \(no secrets or raw logs\)\. If absent from `tools\/list`, do not invent memory tools\./,
];

/** Retired guidance rewritten identically in every variant (root sources already carry the new text). */
const NO_RETRY =
  '2. **If empty** → do not retry with synonyms: retrieval is already hybrid (semantic + lexical, Spanish and English). Search again only for a materially new symptom, service, repo or environment (see the Operational memory policy below).';
const REUSE =
  'search once or reuse the `memory_context` already returned (see the Operational memory policy below); treat results as hints, not live truth.';
export const PROSE_REPLACEMENTS = [
  [/2\. \*\*If empty results\*\* → reformulate \*\*once\*\*[^\n]*/g, NO_RETRY],
  [/2\. \*\*If empty\*\* → reformulate \*\*once\*\*[^\n]*/g, NO_RETRY],
  [
    /if `items` is empty, retry \*\*once\*\* with hostname\/service\/env tokens \(gateway also expands synonyms server-side\); treat results as hints, not live truth\./g,
    'run it once, or reuse the `memory_context` already returned by `investigation_open` or a macro (see the Operational memory policy below); an empty result is a valid answer, not a reason to retry; treat results as hints, not live truth.',
  ],
  [
    /(`memory_search` with `scopes: \[[^\]]*\]` when memory tools (?:are enabled|exist); )treat results as hints, not live truth\./g,
    `$1${REUSE}`,
  ],
  [
    /short query with hostname; treat as hints only\./g,
    'one short query with hostname (or reuse the `memory_context` already returned); treat as hints only, per the Operational memory policy below.',
  ],
  [
    /note related past incidents \(hints only\)\./g,
    'note related past incidents by reference and verification state (hints only, per the Operational memory policy below).',
  ],
];

export function applyProse(text) {
  let out = text.replaceAll('\r\n', '\n');
  for (const [pattern, replacement] of PROSE_REPLACEMENTS) out = out.replace(pattern, replacement);
  return out;
}

function readNormalized(file) {
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

export function canonicalBlock() {
  const body = readNormalized(path.join(root, 'scripts', 'memory-policy.canonical.md')).trim();
  return `${START}\n${body}\n${END}`;
}

export function canonicalShort() {
  const body = readNormalized(path.join(root, 'scripts', 'memory-policy.short.md')).trim();
  return `${SHORT_START}${body}${SHORT_END}`;
}

export function walk(dir = '.', out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (/\.(md|mdc)$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/** Every instruction file that mentions memory_search, classified full | short. */
export function discoverCarriers() {
  const carriers = [];
  for (const relative of walk()) {
    const base = path.basename(relative);
    const normalized = relative.split(path.sep).join('/');
    const isRoot = !normalized.includes('/');
    if (isRoot && REFERENCE_FILES.has(base)) continue;
    if (isRoot && base === 'AGENTS.md') continue;
    const text = readNormalized(path.join(root, relative));
    if (!text.includes('memory_search')) continue;
    const isShort = normalized.includes('rules/') && SHORT_RULE_NAMES.has(base);
    carriers.push({ relative, kind: isShort ? 'short' : 'full' });
  }
  return carriers;
}

export function applyFull(text, block) {
  const normalized = text.replace(/\r\n/g, '\n');
  const start = normalized.indexOf(START);
  const end = normalized.indexOf(END);
  if (start !== -1 && end !== -1 && end > start) {
    return normalized.slice(0, start) + block + normalized.slice(end + END.length);
  }
  return `${normalized.replace(/\s+$/, '')}\n\n${block}\n`;
}

export function applyShort(text, short) {
  const normalized = text.replace(/\r\n/g, '\n');
  const start = normalized.indexOf(SHORT_START);
  const end = normalized.indexOf(SHORT_END);
  if (start !== -1 && end !== -1 && end > start) {
    return normalized.slice(0, start) + short + normalized.slice(end + SHORT_END.length);
  }
  for (const legacy of LEGACY_SHORT_SENTENCES) {
    if (legacy.test(normalized)) return normalized.replace(legacy, short);
  }
  throw new Error('short memory rule has neither markers nor a known legacy sentence');
}

function main() {
  const check = process.argv.includes('--check');
  const block = canonicalBlock();
  const short = canonicalShort();
  const stale = [];
  for (const { relative, kind } of discoverCarriers()) {
    const file = path.join(root, relative);
    const current = fs.readFileSync(file, 'utf8');
    const prosed = applyProse(current);
    const next = kind === 'full' ? applyFull(prosed, block) : applyShort(prosed, short);
    if (current.replace(/\r\n/g, '\n') !== next) {
      stale.push(relative);
      if (!check) fs.writeFileSync(file, next);
    }
  }
  if (check && stale.length > 0) {
    console.error(
      `Memory policy out of date in: ${stale.join(', ')}. Run: node scripts/sync-memory-policy.mjs`,
    );
    process.exit(1);
  }
  console.log(check ? 'memory policy: in sync' : `memory policy: updated ${stale.length} file(s)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
