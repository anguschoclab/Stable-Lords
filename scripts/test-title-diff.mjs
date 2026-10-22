#!/usr/bin/env node
/**
 * test-title-diff.mjs — Merge-parity harness (wave-2 T7).
 *
 * Diffs the test-title sets of two vitest JSON reports so a consolidation
 * batch can prove no test was silently dropped:
 *
 *   bunx vitest run <files…> --reporter=json --outputFile=before.json
 *   # …do the merge…
 *   bunx vitest run <files…> --reporter=json --outputFile=after.json
 *   node scripts/test-title-diff.mjs before.json after.json [dropped.txt]
 *
 * Exit 0 when after-titles ⊇ before-titles (minus titles listed one-per-line
 * in the optional dropped.txt — intentional drops recorded in the ledger).
 * Exit 1 listing titles lost or files that disappeared unexplained.
 */
import fs from 'node:fs';

const [beforePath, afterPath, droppedPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error('usage: node scripts/test-title-diff.mjs before.json after.json [dropped.txt]');
  process.exit(2);
}

const titles = (p) => {
  const report = JSON.parse(fs.readFileSync(p, 'utf8'));
  const set = new Set();
  for (const file of report.testResults ?? []) {
    for (const a of file.assertionResults ?? []) {
      set.add(`${file.name} :: ${a.fullName ?? a.title}`);
    }
  }
  return set;
};

const before = titles(beforePath);
const after = titles(afterPath);
const dropped = new Set(
  droppedPath && fs.existsSync(droppedPath)
    ? fs
        .readFileSync(droppedPath, 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : []
);

const lost = [...before].filter((t) => !after.has(t) && !dropped.has(t));
const added = [...after].filter((t) => !before.has(t));

console.log(`before: ${before.size} titles · after: ${after.size} titles · added: ${added.length}`);
if (lost.length) {
  console.log(`LOST ${lost.length} titles (not in after, not in dropped.txt):`);
  for (const t of lost) console.log(`  ${t}`);
  process.exit(1);
}
console.log('parity OK — every pre-merge title survives (or is ledger-listed)');
