#!/usr/bin/env node
/**
 * param-count.mjs — authoritative max-params census.
 *
 * Uses the TypeScript compiler API (devDep) to walk every source file and
 * record every function-like declaration whose signature violates the
 * max-5-parameter budget: either >5 formal parameters, or any single
 * destructured object binding pattern with >5 elements (the convention
 * external audits apply to React props signatures).
 *
 * Output: scripts/out/megaplan-params.json
 *   { violations: [{file,name,kind,line,destructured,plainParams}], summary }
 * Zero config. Run: `node scripts/param-count.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'megaplan-params.json');

export const PARAM_LIMIT = 5;

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

/** Resolve a readable name: identifier, owning variable declaration, or nearest call wrapper (memo/forwardRef). */
function fnName(node) {
  if (node.name) return node.name.getText();
  let p = node.parent;
  while (p) {
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.getText();
    if (ts.isCallExpression(p)) {
      const callee = ts.isPropertyAccessExpression(p.expression)
        ? p.expression.name.getText()
        : ts.isIdentifier(p.expression)
          ? p.expression.getText()
          : '<call>';
      p = p.parent;
      return `<${callee}>`;
    }
    if (ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p)) return p.name.getText();
    if (ts.isReturnStatement(p) || ts.isJsxElement(p)) break;
    p = p.parent;
  }
  return '<anonymous>';
}

const KINDS = [
  [ts.isFunctionDeclaration, 'function'],
  [ts.isMethodDeclaration, 'method'],
  [ts.isArrowFunction, 'arrow'],
  [ts.isFunctionExpression, 'fnexpr'],
  [ts.isConstructorDeclaration, 'ctor'],
];

/** Collect the census. Returns { violations, summary }. */
export function collectParamCounts() {
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
      for (const [pred, kind] of KINDS) {
        if (pred(node)) {
          let destructured = 0;
          let plainParams = 0;
          for (const param of node.parameters ?? []) {
            if (param.name.getText() === 'this') continue; // `this:` typing param — not real
            if (ts.isObjectBindingPattern(param.name)) {
              destructured = Math.max(destructured, param.name.elements.length);
            } else {
              plainParams++;
            }
          }
          if (destructured > PARAM_LIMIT || plainParams > PARAM_LIMIT) {
            const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
            violations.push({
              file: r,
              name: fnName(node),
              kind,
              line,
              destructured,
              plainParams,
            });
          }
          break;
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  violations.sort((a, b) => b.destructured + b.plainParams - (a.destructured + a.plainParams));

  const summary = {
    total: violations.length,
    destructured: violations.filter((v) => v.destructured > PARAM_LIMIT).length,
    plainParams: violations.filter((v) => v.plainParams > PARAM_LIMIT).length,
    engine: violations.filter((v) => v.file.startsWith('src/engine/')).length,
  };
  return { violations, summary };
}

function main() {
  const { violations, summary } = collectParamCounts();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ summary, violations }, null, 2));

  console.log(
    `violations: ${summary.total} (${summary.destructured} destructured-props, ${summary.plainParams} plain-params, ${summary.engine} in engine)`
  );
  for (const v of violations)
    console.log(
      `  ${v.file}:${v.line}  ${v.name} (${v.kind}) destructured=${v.destructured} plain=${v.plainParams}`
    );
  console.log(`\nwrote ${rel(OUT_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
