#!/usr/bin/env node
/**
 * seeded-id-scan.mjs — V30 determinism ratchet.
 *
 * Engine code runs inside seeded simulation paths — ids minted there must be
 * derived from the seeded stream (rng.uuid()) or from deterministic inputs,
 * never from unseeded randomness. Forbidden inside src/engine/** (non-test):
 *
 *   - generateId(            → crypto-random ids in seeded paths (V26-D4 class)
 *   - cryptoRandom / cryptoRandomInt
 *   - Math.random(
 *   - crypto.getRandomValues — EXCEPT the allowlisted unseeded-fight fallback
 *
 * Allowlist (deliberate only — each entry carries a why):
 *   src/engine/simulate/initialization.ts — `initializeRng(undefined)` is the
 *   sanctioned entry for ad-hoc/unseeded bouts (FTUE tutorial, admin tools).
 *   Deterministic callers must always pass a seed; the scan pins the boundary.
 *
 * Output: scripts/out/seeded-id.json
 *   { violations: [{file,line,rule,text}], summary }
 * Run: `node scripts/seeded-id-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, walk, rel, isTest, writeReport, isMain } from './lib/scanLib.mjs';

const ENGINE_DIR = path.join(ROOT, 'src', 'engine');
const OUT_FILE = 'seeded-id.json';

const RULES = [
  { rule: 'generateId', re: /\bgenerateId\s*\(/ },
  { rule: 'cryptoRandom', re: /\bcryptoRandom(Int)?\s*\(/ },
  { rule: 'mathRandom', re: /\bMath\.random\s*\(/ },
  { rule: 'cryptoGetRandomValues', re: /\bcrypto\.getRandomValues\s*\(/ },
];

/** Deliberate exceptions — file → allowed rule ids. */
const ALLOWLIST = new Map([
  [
    'src/engine/simulate/initialization.ts',
    new Set(['cryptoGetRandomValues']), // sanctioned unseeded-fight fallback
  ],
  [
    'src/engine/factories/warriorFactory.ts',
    // rng-less builds are the sanctioned init/test path: every seeded caller
    // passes `id` or `rng` (worldSeeder, rivalWarriorFactory, tournament utils,
    // recruitPoolOps) and rng-less mints deliberately stay potential-free.
    new Set(['generateId']),
  ],
]);

/** Collect violations. Returns { violations, summary }. */
export function collectSeededIdViolations() {
  const violations = [];

  for (const file of walk(ENGINE_DIR)) {
    const r = rel(file);
    if (isTest(r)) continue;
    const allowed = ALLOWLIST.get(r);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const { rule, re } of RULES) {
        if (re.test(line) && !allowed?.has(rule)) {
          violations.push({ file: r, line: i + 1, rule, text: line.trim() });
        }
      }
    });
  }

  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { violations, summary: { total: violations.length } };
}

function main() {
  const { violations, summary } = collectSeededIdViolations();
  writeReport(OUT_FILE, { summary, violations });
  console.log(`seeded-id violations: ${summary.total}`);
  for (const v of violations) console.log(`  ${v.file}:${v.line}  [${v.rule}]  ${v.text}`);
}

if (isMain(import.meta.url)) main();
