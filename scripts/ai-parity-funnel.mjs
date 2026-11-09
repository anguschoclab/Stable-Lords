#!/usr/bin/env node
/**
 * ai-parity-funnel.mjs — fresh-warrior constructor census.
 *
 * Every production Warrior must be born in one of two blessed constructors:
 *   - `makeWarrior` (warriorFactory.ts)      — world mints
 *   - `poolWarriorToWarrior` (signWarrior.ts) — every signing
 * Both spread `newWarriorDefaults()` and then fill the full meaningful field
 * set (favorites, potential, equipment, handedness, trainability, …).
 *
 * A third site calling `newWarriorDefaults()` is a fresh-warrior literal
 * bypassing the funnel — the exact V26 G1 bug class (generateAIRecruit
 * minted Warriors missing favorites/potential/equipment/trainability).
 *
 * Output: scripts/out/ai-parity-funnel.json
 *   { violations: [{file,line,text}], summary }
 * Run: `node scripts/ai-parity-funnel.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'ai-parity-funnel.json');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const isTest = (r) =>
  r.includes('/test/') ||
  /\.(test|spec)\.tsx?$/.test(r) ||
  r.includes('/_fixtures/') ||
  r.includes('/_setup/');

function isNewWarriorDefaultsCall(node) {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'newWarriorDefaults'
  );
}

/** Collect the census. Returns { violations, summary }. */
export function collectFunnelBypasses() {
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
      if (isNewWarriorDefaultsCall(node)) {
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
  const { violations, summary } = collectFunnelBypasses();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ summary, violations }, null, 2));

  console.log(`newWarriorDefaults call sites: ${summary.total}`);
  for (const v of violations) console.log(`  ${v.file}:${v.line}  ${v.text}`);
  console.log(`\nwrote ${rel(OUT_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
