#!/usr/bin/env node
/**
 * arena-lookup-scan.mjs — linear arena-by-id lookup census.
 *
 * Uses the TypeScript compiler API (devDep) to flag every `.find()` /
 * `.findIndex()` call whose receiver is an arena-list getter —
 * `getAllArenas()`, `getNormalArenas()`, `getArenasByTag()`,
 * `getArenasByTier()`. Each getter returns a freshly allocated array, so
 * `getAllArenas().find(a => a.id === x)` is an allocation plus an O(N) scan
 * for what should be an O(1) Map lookup — use `getArenaById()` (default-arena
 * fallback) or `tryGetArenaById()` (undefined for unknown ids) instead.
 * Chained receivers like `getAllArenas().filter(f).find(g)` unwrap through
 * `.filter()/.slice()/.map()/.concat()` to the root getter call.
 *
 * Out of scope: lookups stored in a variable first
 * (`const a = getAllArenas(); a.find(...)`) — the census targets the direct
 * chain idiom the audit flagged.
 *
 * Output: scripts/out/arena-lookup-scan.json
 *   { violations: [{file,line,text}], summary }
 * Zero config. Run: `node scripts/arena-lookup-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ROOT, walk, rel, isTest, writeReport, isMain } from './lib/scanLib.mjs';

const SRC = path.join(ROOT, 'src');
const OUT_FILE = 'arena-lookup-scan.json';



const ARENA_GETTERS = new Set([
  'getAllArenas',
  'getNormalArenas',
  'getArenasByTag',
  'getArenasByTier',
]);

const SCAN_METHODS = new Set(['find', 'findIndex']);

// Array methods that return another array — a `.find()` riding on their
// result still roots at the arena getter underneath.
const CHAIN_METHODS = new Set(['filter', 'slice', 'map', 'concat']);

/** True when `expr` bottoms out at a direct arena-list getter call. */
function rootsAtArenaGetter(expr) {
  let cur = expr;
  for (;;) {
    if (ts.isParenthesizedExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    if (
      ts.isCallExpression(cur) &&
      ts.isPropertyAccessExpression(cur.expression) &&
      CHAIN_METHODS.has(cur.expression.name.text)
    ) {
      cur = cur.expression.expression;
      continue;
    }
    break;
  }
  return (
    ts.isCallExpression(cur) &&
    ts.isIdentifier(cur.expression) &&
    ARENA_GETTERS.has(cur.expression.text)
  );
}

function isArenaLookupScan(node) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    SCAN_METHODS.has(node.expression.name.text) &&
    rootsAtArenaGetter(node.expression.expression)
  );
}

/** Collect the census. Returns { violations, summary }. */
export function collectArenaLookupScans() {
  const violations = [];

  for (const file of walk(SRC)) {
    const r = rel(file);
    if (isTest(r)) continue;

    const sf = ts.createSourceFile(
      r,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      r.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const visit = (node) => {
      if (isArenaLookupScan(node)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        violations.push({ file: r, line: line + 1, text: node.getText(sf) });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { violations, summary: { total: violations.length } };
}

function main() {
  const { violations, summary } = collectArenaLookupScans();

  writeReport(OUT_FILE, { summary, violations });

  console.log(`violations: ${summary.total}`);
  for (const v of violations) console.log(`  ${v.file}:${v.line}  ${v.text}`);
  if (summary.total > 0) process.exit(1);
}

if (isMain(import.meta.url)) main();
