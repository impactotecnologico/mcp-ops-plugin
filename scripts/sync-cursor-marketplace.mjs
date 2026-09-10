#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'plugins', 'opsphere');
const sources = [
  ['.cursor-plugin/plugin.json', '.cursor-plugin/plugin.json'],
  ['mcp.json', 'mcp.json'],
  ['agents', 'agents'],
  ['assets', 'assets'],
  ['commands', 'commands'],
  ['docs', 'docs'],
  ['rules', 'rules'],
  ['skills', 'skills'],
];

function filesUnder(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory()
      ? filesUnder(path.join(directory, entry.name), relative)
      : [relative];
  }).sort();
}

function assertSame(source, destination) {
  const sourceFiles = filesUnder(source);
  const destinationFiles = filesUnder(destination);
  assert.deepEqual(destinationFiles, sourceFiles, `generated file list differs: ${destination}`);
  for (const relative of sourceFiles) {
    assert.deepEqual(
      fs.readFileSync(path.join(destination, relative)),
      fs.readFileSync(path.join(source, relative)),
      `generated file differs: ${path.join(destination, relative)}`,
    );
  }
}

if (process.argv.includes('--check')) {
  for (const [sourceRelative, destinationRelative] of sources) {
    const source = path.join(root, sourceRelative);
    const destination = path.join(target, destinationRelative);
    const stat = fs.statSync(source);
    if (stat.isDirectory()) assertSame(source, destination);
    else assert.deepEqual(fs.readFileSync(destination), fs.readFileSync(source), `generated file differs: ${destinationRelative}`);
  }
  console.log('cursor-marketplace-package: in sync');
} else {
  if (path.basename(target) !== 'opsphere' || path.basename(path.dirname(target)) !== 'plugins') {
    throw new Error(`Refusing unexpected generated target: ${target}`);
  }
  fs.rmSync(target, { recursive: true, force: true });
  for (const [sourceRelative, destinationRelative] of sources) {
    const source = path.join(root, sourceRelative);
    const destination = path.join(target, destinationRelative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
  }
  console.log(`Generated ${path.relative(root, target)}`);
}
