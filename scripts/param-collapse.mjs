#!/usr/bin/env node
/**
 * param-collapse.mjs — ONE-SHOT codemod (delete after the sweep lands).
 *
 * Rewrites function signatures whose first destructured object parameter has
 * >5 binding elements into `(props: T)` + chunked `const {…} = props;`
 * statements (≤5 bindings each) inserted at the top of the body.
 *
 * Handles: function decls/expressions, block-bodied arrows (incl. memo(
 * callbacks), methods, and multi-param signatures like forwardRef's
 * (props, ref). Skips expression-bodied arrows and name collisions —
 * reported for manual fixing.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { collectParamCounts, PARAM_LIMIT } from './param-count.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHUNK = PARAM_LIMIT;

/** Split binding elements into chunks of <=CHUNK, preserving source text. */
function chunkElements(pattern, sf) {
  const texts = pattern.elements.map((el) => el.getText(sf));
  const chunks = [];
  for (let i = 0; i < texts.length; i += CHUNK) chunks.push(texts.slice(i, i + CHUNK));
  return chunks;
}

/** Find function node at a given start line within a source file. */
function nodeAtLine(sf, line) {
  let found = null;
  const visit = (n) => {
    if (found) return;
    const isFn =
      ts.isFunctionDeclaration(n) ||
      ts.isArrowFunction(n) ||
      ts.isFunctionExpression(n) ||
      ts.isMethodDeclaration(n) ||
      ts.isConstructorDeclaration(n);
    if (isFn && sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 === line) {
      found = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
}

const { violations } = collectParamCounts();
const targets = violations.filter((v) => v.destructured > PARAM_LIMIT);
const byFile = new Map();
for (const t of targets) {
  if (!byFile.has(t.file)) byFile.set(t.file, []);
  byFile.get(t.file).push(t);
}

const skipped = [];
let rewritten = 0;

for (const [file, list] of byFile) {
  const abs = path.join(ROOT, file);
  const text = fs.readFileSync(abs, 'utf8');
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const edits = []; // {start, end, text}
  for (const t of list) {
    const fn = nodeAtLine(sf, t.line);
    if (!fn) {
      skipped.push(`${file}:${t.line} ${t.name} — node not found`);
      continue;
    }
    const param = fn.parameters.find(
      (p) => ts.isObjectBindingPattern(p.name) && p.name.elements.length > PARAM_LIMIT
    );
    if (!param) {
      skipped.push(`${file}:${t.line} ${t.name} — no >5 binding pattern param`);
      continue;
    }
    if (!fn.body || !ts.isBlock(fn.body)) {
      skipped.push(`${file}:${t.line} ${t.name} — expression-bodied arrow`);
      continue;
    }

    // Pick a props identifier that doesn't collide with body identifiers.
    const bodyText = fn.body.getText(sf);
    let ident = 'props';
    while (new RegExp(`\\b${ident}\\b`).test(bodyText)) ident = `_${ident}`;

    const chunks = chunkElements(param.name, sf);
    // First statement indentation.
    const firstStmt = fn.body.statements[0];
    let indent = '  ';
    if (firstStmt) {
      const stmtStart = firstStmt.getStart(sf);
      const lineStart = text.lastIndexOf('\n', stmtStart) + 1;
      indent = text.slice(lineStart, stmtStart).match(/^\s*/)[0];
    }
    const lines = chunks.map((c) => `${indent}const { ${c.join(', ')} } = ${ident};`).join('\n');

    // Replace just the binding pattern (keeps any type annotation + initializer).
    const typeAndInit = param.getText(sf).replace(param.name.getText(sf), '');
    edits.push({
      start: param.getStart(sf),
      end: param.getEnd(),
      text: `${ident}${typeAndInit}`,
    });
    // Insert chunk destructures right after the opening brace of the body.
    const bodyOpen = fn.body.getStart(sf) + 1; // after '{'
    edits.push({ start: bodyOpen, end: bodyOpen, text: `\n${lines}` });
    rewritten++;
  }

  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  fs.writeFileSync(abs, out);
  console.log(`rewrote ${file} (${edits.length / 2} fns)`);
}

console.log(`\n${rewritten} functions rewritten, ${skipped.length} skipped`);
for (const s of skipped) console.log(`  SKIP ${s}`);
