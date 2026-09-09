#!/usr/bin/env node
/**
 * Copy the canonical scanner signatures from the app tree into this package so
 * the published CLI ships an identical copy. The hosted PHP scanner reads the
 * canonical file directly; this keeps the two in lockstep. Run before publish:
 *   node scripts/sync-signatures.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const canonical = join(here, '..', '..', '..', 'resources', 'scanner', 'signatures.json');
const dest = join(here, '..', 'templates', 'signatures.json');

if (!existsSync(canonical)) {
  console.error(`[sync-signatures] canonical not found: ${canonical}`);
  console.error('Run this from inside the monorepo; the published package uses the committed copy.');
  process.exit(1);
}

const src = readFileSync(canonical, 'utf8');
JSON.parse(src); // fail loudly on malformed JSON
writeFileSync(dest, src);
console.log(`[sync-signatures] copied ${canonical} -> ${dest}`);
