#!/usr/bin/env node
/**
 * dup-scan.mjs — code-duplication detector for Stable Lords.
 *
 * Sliding-window (default 8 normalized lines) hash scan over src/**.
 * Normalization: strips comments, blank lines, collapses whitespace.
 * Two passes: exact-normalized, and identifier-normalized (`--ident` also
 * masks identifiers/literals so shape-identical code with renamed vars is
 * caught).
 *
 * Output: scripts/out/dup-scan.json + stdout cluster summary.
 * Run: `node scripts/dup-scan.mjs [--ident] [--window N] [--min N]`
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');

const args = process.argv.slice(2);
const IDENT = args.includes('--ident');
const WINDOW = Number(args[args.indexOf('--window') + 1]) || 8;
const MIN_BLOCK = Number(args[args.indexOf('--min') + 1]) || WINDOW;

const KEYWORDS = new Set(
  ('const let var function return if else for while do switch case default break continue try catch finally throw new delete typeof instanceof in of void yield async await class extends super this import export from as static get set public private protected readonly abstract interface type enum namespace declare implements satisfies keyof infer never unknown any string number boolean true false null undefined').split(' ')
);

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
const isTest = (r) => r.includes('/test/') || /\.(test|spec)\.tsx?$/.test(r) || r.includes('/_fixtures/') || r.includes('/_setup/');

/** Strip comments + strings-aware normalization, one file → normalized lines[] with source line refs. */
function normalize(text, ident) {
  const out = [];
  let i = 0;
  let line = '';
  let lineNo = 1;
  let startLine = 1;
  let inBlock = false;
  const pushLine = (end) => {
    let l = line.trim().replace(/\s+/g, ' ');
    if (ident) {
      l = l
        .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '@')
        .replace(/\b\d+(?:\.\d+)?\b/g, '#')
        .replace(/\b[A-Za-z_$][\w$]*\b/g, (m) => (KEYWORDS.has(m) ? m : '_'));
    }
    if (l) out.push({ l, line: startLine });
    line = '';
    startLine = lineNo + (end ? 0 : 1);
  };
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (inBlock) {
      if (c === '*' && n === '/') { inBlock = false; i += 2; continue; }
      if (c === '\n') { pushLine(true); lineNo++; }
      i++; continue;
    }
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      const q = c; line += c; i++;
      while (i < text.length) {
        const ch = text[i];
        line += ch; i++;
        if (ch === '\\') { line += text[i] ?? ''; i++; continue; }
        if (ch === q) break;
        if (ch === '\n' && q !== '`') break;
        if (ch === '\n') { pushLine(true); lineNo++; }
      }
      continue;
    }
    if (c === '\n') { pushLine(true); lineNo++; i++; continue; }
    line += c; i++;
  }
  pushLine(true);
  return out;
}

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);

/** Collect duplication clusters. Returns { window, ident, clusters, counts }. */
export function collectDuplicates({ ident = IDENT, window = WINDOW, minBlock = MIN_BLOCK } = {}) {
  const windows = new Map();
  for (const file of walk(SRC)) {
    const r = rel(file);
    const lines = normalize(fs.readFileSync(file, 'utf8'), ident);
    for (let i = 0; i + window <= lines.length; i++) {
      const h = hash(lines.slice(i, i + window).map((x) => x.l).join('\n'));
      if (!windows.has(h)) windows.set(h, []);
      windows.get(h).push({ file: r, line: lines[i].line });
    }
  }

  const occurrences = [...windows.entries()].filter(([, v]) => {
    const fs2 = new Set(v.map((x) => x.file));
    return fs2.size > 1;
  });

  const pairBlocks = new Map();
  for (const [, occs] of occurrences) {
    const byFile = new Map();
    for (const o of occs) {
      if (!byFile.has(o.file)) byFile.set(o.file, []);
      byFile.get(o.file).push(o);
    }
    const fsKeys = [...byFile.keys()].sort();
    for (let a = 0; a < fsKeys.length; a++)
      for (let b = a + 1; b < fsKeys.length; b++) {
        const key = `${fsKeys[a]}|${fsKeys[b]}`;
        if (!pairBlocks.has(key)) pairBlocks.set(key, []);
        pairBlocks.get(key).push(...byFile.get(fsKeys[a]), ...byFile.get(fsKeys[b]));
      }
  }

  const clusters = [];
  for (const [pair, occs] of pairBlocks) {
    const blocks = mergeBlocks(occs, window, minBlock);
    if (blocks.length) {
      const [a, b] = pair.split('|');
      clusters.push({ pair: [a, b], blocks, totalDupeLines: blocks.reduce((s, x) => s + x.end - x.start + 1, 0) / 2 });
    }
  }
  clusters.sort((a, b) => b.totalDupeLines - a.totalDupeLines);

  const testPairCount = clusters.filter((c) => c.pair.every(isTest)).length;
  const srcPairCount = clusters.filter((c) => c.pair.every((f) => !isTest(f))).length;
  return {
    window,
    ident,
    clusters,
    counts: { total: clusters.length, srcToSrc: srcPairCount, testToTest: testPairCount, mixed: clusters.length - testPairCount - srcPairCount },
  };
}

// Merge overlapping same-file occurrences into blocks
function mergeBlocks(occs, window, minBlock) {
  const sorted = [...occs].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  const blocks = [];
  let cur = null;
  for (const o of sorted) {
    if (cur && o.file === cur.file && o.line <= cur.end + 1) {
      cur.end = Math.max(cur.end, o.line + window - 1);
    } else {
      if (cur) blocks.push(cur);
      cur = { file: o.file, start: o.line, end: o.line + window - 1 };
    }
  }
  if (cur) blocks.push(cur);
  return blocks.filter((b) => b.end - b.start + 1 >= minBlock);
}

function main() {
  const { clusters, counts } = collectDuplicates({ ident: IDENT, window: WINDOW, minBlock: MIN_BLOCK });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, IDENT ? 'dup-scan-ident.json' : 'dup-scan.json');
  fs.writeFileSync(outFile, JSON.stringify({ window: WINDOW, ident: IDENT, clusters }, null, 2));

  console.log(`mode=${IDENT ? 'identifier-normalized' : 'exact-normalized'} window=${WINDOW} min-block=${MIN_BLOCK}`);
  console.log(`duplicate pair-clusters: ${counts.total} (src↔src ${counts.srcToSrc} · test↔test ${counts.testToTest} · mixed ${counts.mixed})`);
  console.log('\nTop 30 clusters by duplicated lines:');
  for (const c of clusters.slice(0, 30)) {
    console.log(`  ~${Math.round(c.totalDupeLines)} lines × ${c.blocks.length} block(s)`);
    console.log(`    ${c.pair[0]}\n    ${c.pair[1]}`);
  }
  console.log(`\nwrote ${rel(outFile)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
