#!/usr/bin/env node
/**
 * Content-level duplicate scan for src/data string-array pools.
 *
 * Complements `dedupe.mjs` (narrative JSON) — this pass covers the TS data
 * pools (names, statements, lore, backstories, orphan pool…). For every
 * exported `const X = [ ... ]` whose body is pure string literals, it reports
 * duplicate entries within that array. Pure-data extraction only: arrays
 * containing non-string members are skipped, so seeded-order-sensitive
 * registries (trait/arena maps) are never touched.
 *
 * `--fix` rewrites a file removing the *extra* occurrences inside pure
 * string arrays, preserving first-occurrence order.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');
const FIX = process.argv.includes('--fix');

function* tsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* tsFiles(full);
    else if (entry.endsWith('.ts')) yield full;
  }
}

// Matches `export const NAME = [` … `]` and captures the body. Data files
// only ever use simple top-level arrays for these pools.
const ARRAY_RE = /export\s+const\s+([A-Za-z0-9_]+)\s*(?::[^=\n]+)?=\s*\[([\s\S]*?)\n\]/g;
const STRING_RE = /^\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1\s*,?\s*$/;

let anyDupes = false;
for (const file of tsFiles(DATA_DIR)) {
  const src = readFileSync(file, 'utf8');
  let m;
  let rewritten = src;
  ARRAY_RE.lastIndex = 0;
  while ((m = ARRAY_RE.exec(src))) {
    const [, name, body] = m;
    const lines = body.split('\n').filter((l) => l.trim());
    // Only handle arrays made purely of string-literal lines.
    if (lines.length === 0 || !lines.every((l) => STRING_RE.test(l))) continue;

    const seen = new Set();
    const dupes = [];
    for (const l of lines) {
      const value = STRING_RE.exec(l)?.[2];
      if (seen.has(value)) dupes.push(value);
      else seen.add(value);
    }
    if (dupes.length === 0) continue;
    anyDupes = true;
    console.log(
      `${file.replace(DATA_DIR, 'src/data')} → ${name}: ${dupes.length} duplicate(s):`,
      dupes.slice(0, 8).join(', ') + (dupes.length > 8 ? '…' : '')
    );

    if (FIX) {
      const seenFix = new Set();
      const kept = lines.filter((l) => {
        const value = STRING_RE.exec(l)?.[2];
        if (seenFix.has(value)) return false;
        seenFix.add(value);
        return true;
      });
      rewritten = rewritten.replace(
        `export const ${name}`,
        `export const ${name}` // placeholder — body replaced below
      );
      const newBody = `[${kept.length ? '\n' + kept.join('\n') + '\n]' : ']'}`;
      rewritten = rewritten.replace(m[0], `export const ${name} = ${newBody}`);
    }
  }
  if (FIX && rewritten !== src) {
    writeFileSync(file, rewritten);
    console.log(`  ✎ rewrote ${file}`);
  }
}

if (!anyDupes) console.log('No duplicate entries found in src/data string pools.');
