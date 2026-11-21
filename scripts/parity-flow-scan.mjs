#!/usr/bin/env node
/**
 * parity-flow-scan.mjs — V30 same-ruleset funnel.
 *
 * Rival-stable weekly mechanics must route through the SHARED flows — the AI
 * side may not re-declare or re-invoke the per-stable primitives the
 * harmonization moved behind the unified executors:
 *
 *   forbidden inside src/engine/ai/** (non-test):
 *     - processRecovery(          → recovery flows through tickStableHealth
 *     - rollForTrainingInjury(    → rolls live inside trainingAttempt executors
 *     - processAttributeTraining( → attempts live inside runTrainingAttempt
 *     - processSkillDrillTraining(→ drills live inside runSkillDrillAttempt
 *     - tickInjuries(             → baseline tick lives inside tickStableHealth
 *     - decayFatigue / tickRecoveries declarations (the removed duplicates)
 *     - AI_TRAINING_EFFECTIVENESS identifier (removed handicap — one ruleset)
 *     - .slice(-500)              → TRUNCATION_CAPS.rivalLedger (engine-wide)
 *
 * Output: scripts/out/parity-flow.json
 *   { violations: [{file,line,rule,text}], summary }
 * Run: `node scripts/parity-flow-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');
const AI_DIR = path.join(ROOT, 'src', 'engine', 'ai');
const ENGINE_DIR = path.join(ROOT, 'src', 'engine');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'parity-flow.json');

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

const FORBIDDEN_CALLS = new Set([
  'processRecovery',
  'rollForTrainingInjury',
  'processAttributeTraining',
  'processSkillDrillTraining',
  'tickInjuries',
]);
const FORBIDDEN_DECLS = new Set(['decayFatigue', 'tickRecoveries']);
const FORBIDDEN_IDENTS = new Set(['AI_TRAINING_EFFECTIVENESS']);

/** Collect violations. Returns { violations, summary }. */
export function collectParityViolations() {
  const violations = [];

  // ── AI-side forbidden call sites / declarations / identifiers ──
  for (const file of walk(AI_DIR)) {
    const r = rel(file);
    if (isTest(r)) continue;

    const sf = ts.createSourceFile(
      r,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      r.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const push = (node, rule, text) => {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      violations.push({ file: r, line: line + 1, rule, text });
    };

    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        FORBIDDEN_CALLS.has(node.expression.text)
      ) {
        push(node, 'forbidden-call', `${node.expression.text}(...)`);
      }
      if (
        (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
        node.name &&
        FORBIDDEN_DECLS.has(node.name.text)
      ) {
        push(node, 'forbidden-decl', `function ${node.name.text}`);
      }
      if (ts.isIdentifier(node) && FORBIDDEN_IDENTS.has(node.text)) {
        push(node, 'forbidden-ident', node.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  // ── Engine-wide: .slice(-500) magic cap ──
  for (const file of walk(ENGINE_DIR)) {
    const r = rel(file);
    if (isTest(r)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return; // comments may document the rule
      if (/\.slice\(-500\)/.test(line)) {
        violations.push({ file: r, line: i + 1, rule: 'magic-ledger-cap', text: line.trim() });
      }
    });
  }

  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return { violations, summary: { total: violations.length } };
}

function main() {
  const { violations, summary } = collectParityViolations();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ summary, violations }, null, 2));

  console.log(`parity-flow violations: ${summary.total}`);
  for (const v of violations) console.log(`  ${v.file}:${v.line}  [${v.rule}]  ${v.text}`);
  console.log(`\nwrote ${rel(OUT_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
