#!/usr/bin/env node
/**
 * dedupe.mjs — deduplicate narrative string pools.
 *
 * Recursively scans every JSON file under src/data/narrative for exact
 * duplicate strings inside each pure string array. Default mode is a
 * scan-only report; `--fix` rewrites the files preserving first-occurrence
 * order.
 *
 * Scope guardrails:
 * - Exact matches only. Near-duplicates are narrative variety, not dupes —
 *   use fuzzy_dedupe.mjs for that (destructive, backup-gated).
 * - Arrays are deduped independently per file/path. The same string appearing
 *   in two different pools is reported but NOT removed — cross-pool sharing
 *   can be intentional (different selection contexts).
 * - Arrays containing non-string members are traversed, never deduped, so
 *   seeded-order-sensitive structures (event tables, effect objects) are
 *   never touched.
 *
 * Run: `node scripts/dedupe.mjs [--fix]`
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NARRATIVE_DIR = resolve(__dirname, '../src/data/narrative');
const FIX = process.argv.includes('--fix');

let totalRemoved = 0;
let totalArrays = 0;
const crossPool = new Map(); // string -> Set of "file:path" locations

function walk(node, path) {
  if (Array.isArray(node)) {
    if (node.length > 0 && node.every((i) => typeof i === 'string')) {
      totalArrays++;
      const seen = new Set();
      const unique = [];
      let removed = 0;
      for (const item of node) {
        if (seen.has(item)) {
          removed++;
          totalRemoved++;
        } else {
          seen.add(item);
          unique.push(item);
        }
        if (!crossPool.has(item)) crossPool.set(item, new Set());
        crossPool.get(item).add(path);
      }
      if (removed > 0) {
        console.log(`  ${path}: ${removed} duplicate(s) [${node.length} -> ${unique.length}]`);
      }
      return unique;
    }
    return node.map((item, i) => walk(item, `${path}[${i}]`));
  }
  if (node !== null && typeof node === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(node)) {
      out[key] = walk(val, path ? `${path}.${key}` : key);
    }
    return out;
  }
  return node;
}

const files = readdirSync(NARRATIVE_DIR).filter((f) => f.endsWith('.json'));
for (const file of files) {
  const filePath = join(NARRATIVE_DIR, file);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const before = totalRemoved;
  const cleaned = walk(data, file);
  if (totalRemoved > before) {
    if (FIX) {
      writeFileSync(filePath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
      console.log(`  ^ wrote ${file}`);
    }
  }
}

console.log(
  `${FIX ? 'Removed' : 'Found'} ${totalRemoved} exact duplicate(s) across ${totalArrays} string arrays in ${files.length} files.${FIX ? '' : ' (run with --fix to apply)'}`
);

const shared = [...crossPool.entries()].filter(([, locs]) => locs.size > 1);
if (shared.length > 0) {
  console.log(`\n${shared.length} string(s) shared across multiple files (reported, not removed):`);
  for (const [str, locs] of shared.slice(0, 10)) {
    const preview = str.length > 70 ? str.slice(0, 70) + '…' : str;
    console.log(`  "${preview}" in ${[...locs].join(', ')}`);
  }
  if (shared.length > 10) console.log(`  …and ${shared.length - 10} more`);
}
