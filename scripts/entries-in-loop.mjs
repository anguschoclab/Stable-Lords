#!/usr/bin/env node
/**
 * entries-in-loop.mjs — repeated Object.entries() census.
 *
 * Uses the TypeScript compiler API (devDep) to flag every `Object.entries(...)`
 * call that executes once per iteration of an enclosing loop — i.e. the call
 * sits inside a loop body, or inside a callback argument of an iterative array
 * method (forEach/map/filter/reduce/flatMap/some/every/find/sort). When the
 * iterated object is loop-invariant or static-registry data the entries array
 * is rebuilt needlessly; hoist it or precompute it.
 *
 * Legal: `for (const [k, v] of Object.entries(x))` at top level — the call is
 * the loop's own iterable, evaluated once. The same expression IS flagged when
 * the whole loop is nested inside another loop's body.
 *
 * Output: scripts/out/entries-in-loop.json
 *   { violations: [{file,line,text}], summary }
 * Zero config. Run: `node scripts/entries-in-loop.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ROOT, walk, rel, isTest, writeReport, isMain } from './lib/scanLib.mjs';

const SRC = path.join(ROOT, 'src');
const OUT_FILE = 'entries-in-loop.json';



const ITER_METHODS = new Set([
  'forEach',
  'map',
  'filter',
  'reduce',
  'flatMap',
  'some',
  'every',
  'find',
  'sort',
]);

const isLoop = (n) =>
  ts.isForStatement(n) ||
  ts.isForInStatement(n) ||
  ts.isForOfStatement(n) ||
  ts.isWhileStatement(n) ||
  ts.isDoStatement(n);

function isDescendant(ancestor, node) {
  let p = node.parent;
  while (p) {
    if (p === ancestor) return true;
    p = p.parent;
  }
  return false;
}

/** True when `call` executes once per iteration of an enclosing loop/callback. */
function executesPerIteration(call) {
  let child = call;
  let p = call.parent;
  while (p) {
    // The call is a descendant of a loop body.
    if (isLoop(p) && p.statement && (p.statement === child || isDescendant(p.statement, child)))
      return true;
    // The call is a descendant of an iterative method's callback argument
    // (receiver-position calls like Object.entries(x).map(cb) are excluded —
    // they run once before iteration).
    if (
      ts.isCallExpression(p) &&
      ts.isPropertyAccessExpression(p.expression) &&
      ITER_METHODS.has(p.expression.name.text) &&
      p.arguments.some((a) => a === child || isDescendant(a, child))
    ) {
      return true;
    }
    child = p;
    p = p.parent;
  }
  return false;
}

function isObjectEntriesCall(node, sf) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(sf) === 'Object' &&
    node.expression.name.text === 'entries'
  );
}

/** Collect the census. Returns { violations, summary }. */
export function collectEntriesInLoop() {
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
      if (isObjectEntriesCall(node, sf) && executesPerIteration(node)) {
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
  const { violations, summary } = collectEntriesInLoop();

  writeReport(OUT_FILE, { summary, violations });

  console.log(`violations: ${summary.total}`);
  for (const v of violations) console.log(`  ${v.file}:${v.line}  ${v.text}`);
}

if (isMain(import.meta.url)) main();
