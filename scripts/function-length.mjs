#!/usr/bin/env node
/**
 * function-length.mjs — authoritative function-length + file-size census.
 *
 * Uses the TypeScript compiler API (devDep) to walk every source file and
 * record every function-like declaration (function decls, arrow fns,
 * function expressions, methods, accessors) with start/end lines.
 *
 * Output: scripts/out/megaplan-sizes.json
 *   { functions: [{file,name,kind,line,len}], files: [{file,lines}],
 *     summary: {over80, over120, over200, biggestFiles} }
 * Zero config. Run: `node scripts/function-length.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'megaplan-sizes.json');

const FN_LIMITS = { report: 40, over80: 80, over120: 120, over200: 200 };

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

function fnName(node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature?.(node)
  )
    return node.name ? node.name.getText() : '<anonymous>';
  const p = node.parent;
  if (p) {
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.getText();
    if (ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p)) return p.name.getText();
    if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression))
      return `<callback:${p.expression.name.getText()}>`;
  }
  return '<anonymous>';
}

const KINDS = [
  [ts.isFunctionDeclaration, 'function'],
  [ts.isMethodDeclaration, 'method'],
  [ts.isArrowFunction, 'arrow'],
  [ts.isFunctionExpression, 'fnexpr'],
  [ts.isGetAccessorDeclaration, 'get'],
  [ts.isSetAccessorDeclaration, 'set'],
  [ts.isConstructorDeclaration, 'ctor'],
];

/** Collect the full census. Returns { summary, files: {source,test}, functions }. */
export function collectSizes() {
  const functions = [];
  const files = [];

  for (const file of walk(SRC)) {
    const r = rel(file);
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n').length;
    files.push({ file: r, lines, test: isTest(r) });
    if (isTest(r)) continue;

    const sf = ts.createSourceFile(
      r,
      text,
      ts.ScriptTarget.Latest,
      true,
      r.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const visit = (node) => {
      for (const [pred, kind] of KINDS) {
        if (pred(node)) {
          const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
          const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
          const len = end - start + 1;
          if (len >= FN_LIMITS.report)
            functions.push({ file: r, name: fnName(node), kind, line: start, len });
          break;
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  functions.sort((a, b) => b.len - a.len);
  const srcFiles = files.filter((f) => !f.test).sort((a, b) => b.lines - a.lines);
  const testFiles = files.filter((f) => f.test).sort((a, b) => b.lines - a.lines);

  const summary = {
    totalSourceFiles: srcFiles.length,
    totalTestFiles: testFiles.length,
    totalSourceLoc: srcFiles.reduce((s, f) => s + f.lines, 0),
    totalTestLoc: testFiles.reduce((s, f) => s + f.lines, 0),
    functionsOver80: functions.filter((f) => f.len > FN_LIMITS.over80).length,
    functionsOver120: functions.filter((f) => f.len > FN_LIMITS.over120).length,
    functionsOver200: functions.filter((f) => f.len > FN_LIMITS.over200).length,
    filesOver800: srcFiles.filter((f) => f.lines > 800).map((f) => f.file),
  };
  return { summary, files: { source: srcFiles, test: testFiles }, functions };
}

function main() {
  const {
    summary,
    files: { source: srcFiles, test: testFiles },
    functions,
  } = collectSizes();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ summary, files: { source: srcFiles, test: testFiles }, functions }, null, 2)
  );

  console.log(`source: ${summary.totalSourceFiles} files / ${summary.totalSourceLoc} loc`);
  console.log(`test:   ${summary.totalTestFiles} files / ${summary.totalTestLoc} loc`);
  console.log(
    `functions >80: ${summary.functionsOver80}  >120: ${summary.functionsOver120}  >200: ${summary.functionsOver200}`
  );
  console.log(`files >800 lines: ${summary.filesOver800.length}`);
  console.log('\nTop 25 functions:');
  for (const f of functions.slice(0, 25))
    console.log(`  ${String(f.len).padStart(4)}  ${f.file}:${f.line}  ${f.name} (${f.kind})`);
  console.log('\nTop 15 source files:');
  for (const f of srcFiles.slice(0, 15)) console.log(`  ${String(f.lines).padStart(5)}  ${f.file}`);
  console.log(`\nwrote ${rel(OUT_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
