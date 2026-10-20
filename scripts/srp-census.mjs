#!/usr/bin/env node
/**
 * srp-census.mjs — module responsibility census (MEGAPLAN V18).
 *
 * File size alone misclassifies SRP risk: a 700-line Record<string,TraitDef>
 * data table is fine while a 200-line god-hook doing fetch+derive+render is
 * not. This census flags mixed-responsibility SIGNALS instead of bytes:
 *
 *   multi-domain   imports reach across ≥4 distinct domain roots
 *                  (engine/combat, components/ui, state, data, hooks, …)
 *   fan-out        ≥12 distinct local import specifiers
 *   export-mix     ≥6 exports spanning ≥3 kinds (component/fn/const/type/class)
 *   name-families  ≥8 exports spanning ≥4 verb/domain families
 *   banner-blocks  ≥3 `// ─── X ───` section partitions — de-facto submodules
 *   god-unit       a hook/component file doing fetch (store access) AND
 *                  derive (memo/reduce chains) AND render (JSX) in one unit
 *
 * A module is a census candidate when ≥2 signals fire — classification still
 * requires reading (the census emits candidates, humans/agents classify).
 *
 * Output: scripts/out/srp-census.json + stdout summary.
 * Run: `node scripts/srp-census.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'srp-census.json');

const LIMITS = { domains: 4, fanOut: 12, exportCount: 6, exportKinds: 3, families: 4, familyMinExports: 8, banners: 3 };

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const isTest = (r) =>
  r.includes('/test/') ||
  /\.(test|spec)\.tsx?$/.test(r) ||
  r.includes('/_fixtures/') ||
  r.includes('/_setup/');
const isGenerated = (r) => /\.gen\.tsx?$/.test(r);

/** Map a local import specifier to its domain root (`engine/combat`, `components/ui`, …). */
function domainRoot(spec, fileDir) {
  let s = spec;
  if (s.startsWith('@/')) s = 'src/' + s.slice(2);
  else if (s.startsWith('#')) return '<scripts>';
  else if (s.startsWith('.')) {
    const resolved = path.normalize(path.join(fileDir, s)).split(path.sep).join('/');
    const idx = resolved.indexOf('src/');
    s = idx >= 0 ? resolved.slice(idx) : resolved;
  } else return null; // package import
  const segs = s.replace(/^src\//, '').split('/');
  return segs.slice(0, 2).join('/');
}

const VERB_PREFIX = /^(?:use|get|set|is|are|has|have|can|compute|apply|resolve|build|make|create|select|emit|handle|process|format|parse|render|map|to|from|derive|calc|update|add|remove|find|filter|collect|run|init|register|read|write|load|save|merge|normalize|validate|check|roll|pick|draw|schedule|advance|applyOr)/;
const firstToken = (name) => name.match(/^[a-z]+|[A-Z]+(?![a-z])/)?.[0] ?? name;

function exportFamily(name) {
  const stripped = name.replace(VERB_PREFIX, '');
  const tok = firstToken(stripped || name);
  return (tok || name).toUpperCase();
}

function exportKind(node, sf) {
  if (ts.isFunctionDeclaration(node)) {
    const name = node.name?.getText(sf) ?? '';
    if (/^[A-Z]/.test(name)) return 'component';
    if (/^use[A-Z]/.test(name)) return 'hook';
    return 'function';
  }
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    const name = decl?.name && ts.isIdentifier(decl.name) ? decl.name.getText(sf) : '';
    const init = decl?.initializer;
    const isFn = init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init));
    if (isFn && /^[A-Z]/.test(name)) return 'component';
    if (isFn && /^use[A-Z]/.test(name)) return 'hook';
    return isFn ? 'function' : 'const';
  }
  if (ts.isClassDeclaration(node)) return 'class';
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node))
    return 'type';
  return 'other';
}

const BANNER_RE = /^\s*\/\/\s*[─—═=]{2,}|^\s*\/\/\s*-{3,}\s*[A-Z]/;
const FETCH_RE = /\b(?:useGameStore|useStore|use[A-Z]\w*Store|\.getState\(|useShallow|fetch\(|useQuery|invoke\()/;
const DERIVE_RE = /\b(?:useMemo|useCallback|\.reduce\(|\.sort\(|\.filter\(|\.groupBy\()/;
const JSX_RE = /<[A-Z][A-Za-z]*[\s/>]|return\s*\(\s*<>|return\s*\(\s*<div|jsx/i;

/** Collect the census. Returns { summary, candidates, files }. */
export function collectSrpCensus() {
  const files = [];
  const candidates = [];

  for (const file of walk(SRC)) {
    const r = rel(file);
    if (isTest(r) || isGenerated(r)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    const sf = ts.createSourceFile(
      r,
      text,
      ts.ScriptTarget.Latest,
      true,
      r.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const fileDir = path.dirname(file);

    const domains = new Set();
    const localImports = new Set();
    const exports = [];
    for (const stmt of sf.statements) {
      if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        const spec = stmt.moduleSpecifier.text;
        const dom = domainRoot(spec, fileDir);
        if (dom) {
          localImports.add(spec);
          if (dom !== '<scripts>') domains.add(dom);
        }
      }
      const isExported =
        stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ||
        ts.isExportAssignment(stmt);
      if (isExported && !ts.isExportAssignment(stmt)) {
        let name = '<default>';
        if (ts.isVariableStatement(stmt)) {
          const d = stmt.declarationList.declarations[0];
          if (d && ts.isIdentifier(d.name)) name = d.name.getText(sf);
        } else if (stmt.name) name = stmt.name.getText(sf);
        exports.push({ name, kind: exportKind(stmt, sf) });
      }
      if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        for (const el of stmt.exportClause.elements)
          exports.push({ name: el.name.getText(sf), kind: 'reexport' });
      }
    }

    const banners = lines.filter((l) => BANNER_RE.test(l)).length;
    const kinds = new Set(exports.map((e) => e.kind));
    const families = new Set(exports.map((e) => exportFamily(e.name)));
    // Export-cluster signals only apply when the module actually exports
    // behavior — pure type/const files are data declarations, not a
    // responsibility mix (types/game.ts, constants/*, data/* registries).
    const hasCallable = exports.some((e) =>
      ['component', 'hook', 'function', 'class'].includes(e.kind)
    );
    const hasFetch = FETCH_RE.test(text);
    const hasDerive = DERIVE_RE.test(text);
    const hasRender = JSX_RE.test(text);
    const godUnit = r.endsWith('.tsx') || /use[A-Z]/.test(r) ? hasFetch && hasDerive && hasRender : false;

    const signals = {
      'multi-domain': domains.size >= LIMITS.domains ? domains.size : 0,
      'fan-out': localImports.size >= LIMITS.fanOut ? localImports.size : 0,
      'export-mix':
        hasCallable && exports.length >= LIMITS.exportCount && kinds.size >= LIMITS.exportKinds
          ? exports.length
          : 0,
      'name-families':
        hasCallable && exports.length >= LIMITS.familyMinExports && families.size >= LIMITS.families
          ? families.size
          : 0,
      'banner-blocks': banners >= LIMITS.banners ? banners : 0,
      'god-unit': godUnit ? 1 : 0,
    };
    const fired = Object.entries(signals).filter(([, v]) => v > 0);

    const rec = {
      file: r,
      lines: lines.length,
      domains: [...domains].sort(),
      localImports: localImports.size,
      exports: exports.length,
      exportKinds: [...kinds].sort(),
      exportFamilies: [...families].sort(),
      banners,
      godUnit,
      signals: Object.fromEntries(fired),
    };
    files.push(rec);
    if (fired.length >= 2)
      candidates.push({ ...rec, signalCount: fired.length });
  }

  candidates.sort((a, b) => b.signalCount - a.signalCount || b.lines - a.lines);
  const summary = {
    filesScanned: files.length,
    candidates: candidates.length,
    bySignal: Object.fromEntries(
      Object.keys(LIMITS).length
        ? ['multi-domain', 'fan-out', 'export-mix', 'name-families', 'banner-blocks', 'god-unit'].map(
            (s) => [s, files.filter((f) => f.signals[s]).length]
          )
        : []
    ),
    limits: LIMITS,
  };
  return { summary, candidates, files };
}

function main() {
  const { summary, candidates } = collectSrpCensus();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ summary, candidates }, null, 2));

  console.log(`files scanned: ${summary.filesScanned}`);
  console.log(`candidates (≥2 signals): ${summary.candidates}`);
  console.log('\nper-signal hit counts:');
  for (const [s, n] of Object.entries(summary.bySignal)) console.log(`  ${s.padEnd(14)} ${n}`);
  console.log('\nTop 30 candidates:');
  for (const c of candidates.slice(0, 30)) {
    const sigs = Object.entries(c.signals)
      .map(([k, v]) => `${k}=${v === 1 ? '✓' : v}`)
      .join(' ');
    console.log(`  ${String(c.signalCount)}sig ${String(c.lines).padStart(4)}L  ${c.file}  [${sigs}]`);
  }
  console.log(`\nwrote ${rel(OUT_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
