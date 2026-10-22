#!/usr/bin/env node
/**
 * timings-to-tsv.mjs — Convert a vitest JSON report into the per-file wall-time
 * TSV consumed by scripts/test-audit-scan.mjs (runtime join).
 *
 * Usage:
 *   bunx vitest run --reporter=json --outputFile=scripts/out/default-suite-timings.json
 *   node scripts/timings-to-tsv.mjs [report.json] [out.tsv]
 *
 * Defaults: scripts/out/default-suite-timings.json →
 *           scripts/out/baseline-test-timings.tsv
 *
 * Merge is bidirectional: rows in the existing TSV for files absent from the
 * fresh report are preserved (so a default-suite report keeps slow rows and a
 * slow-suite report keeps default rows), provided the file still exists on
 * disk — rows for deleted/renamed specs are pruned.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const [reportArg, outArg] = process.argv.slice(2);
const REPORT = path.resolve(ROOT, reportArg ?? 'scripts/out/default-suite-timings.json');
const OUT = path.resolve(ROOT, outArg ?? 'scripts/out/baseline-test-timings.tsv');

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const rows = new Map();
for (const r of report.testResults ?? []) {
  const file = path.relative(ROOT, r.name).split(path.sep).join('/');
  const ms = r.endTime && r.startTime ? Math.round(r.endTime - r.startTime) : 0;
  rows.set(file, ms);
}

if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, 'utf8').split('\n')) {
    const [ms, file] = line.split('\t');
    if (file && !rows.has(file) && fs.existsSync(path.resolve(ROOT, file))) {
      rows.set(file, Number(ms));
    }
  }
}

fs.writeFileSync(
  OUT,
  [...rows.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([file, ms]) => `${ms}\t${file}`)
    .join('\n') + '\n'
);
console.log(`wrote ${OUT} — ${rows.size} rows (${report.testResults?.length ?? 0} fresh)`);
