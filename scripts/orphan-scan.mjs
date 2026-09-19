#!/usr/bin/env node
/**
 * orphan-scan.mjs — Orphaned-feature detector for Stable Lords.
 *
 * Builds four indexes and reports candidates:
 *   1. Import graph: files unreachable from production entry roots, or
 *      reachable only via tests.
 *   2. Export index: exported symbols with zero production consumers.
 *   3. State-field index: for each audited interface, every field's
 *      writer/reader sites bucketed by role (schema/serialization/factory/
 *      types/test/other-production).
 *   4. Route/nav index: routed pages, nav hrefs, unrouted-or-unlinked pages.
 *
 * Output: scripts/out/orphan-scan.json + stdout summary.
 * Zero dependencies. Run: `node scripts/orphan-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'orphan-scan.json');

const SOURCE_EXT = ['.ts', '.tsx', '.mts', '.cts'];
const RESOLVE_EXT = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.json', '.css'];

// ─── File collection ────────────────────────────────────────────────────────

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function isSourceFile(p) {
  return SOURCE_EXT.includes(path.extname(p));
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function isTestFile(relPath) {
  return (
    relPath.includes('/test/') ||
    relPath.startsWith('src/test/') ||
    /\.(test|spec)\.[tj]sx?$/.test(relPath) ||
    relPath.includes('/_fixtures/') ||
    relPath.includes('/_setup/')
  );
}

const srcFiles = walk(SRC).filter(isSourceFile);
const scriptFiles = [
  ...walk(path.join(ROOT, 'scripts')).filter(isSourceFile),
  ...fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => path.join(ROOT, f)),
];
const electronMain = path.join(ROOT, 'electron', 'main.ts');
const e2eFiles = fs.existsSync(path.join(ROOT, 'e2e'))
  ? walk(path.join(ROOT, 'e2e')).filter(isSourceFile)
  : [];

const allFiles = new Map(); // abs -> rel
for (const f of [...srcFiles, ...scriptFiles, electronMain, ...e2eFiles]) {
  if (fs.existsSync(f)) allFiles.set(f, rel(f));
}

// ─── Import extraction ──────────────────────────────────────────────────────

const RE_STATIC = /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;
const RE_DYNAMIC = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_REQUIRE = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_WORKER_URL = /new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g;
const RE_NAMED_IMPORT = /(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const RE_DEFAULT_IMPORT = /import\s+(?!type\b)([\w$]+)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]([^'"]+)['"]/g;
const RE_NS_IMPORT = /import\s+(?!type\b)\*\s+as\s+[\w$]+\s+from\s*['"]([^'"]+)['"]/g;
const RE_EXPORT_STAR = /export\s+\*\s+from\s*['"]([^'"]+)['"]/g;

function extractSpecifiers(code) {
  const specs = new Set();
  for (const re of [RE_STATIC, RE_DYNAMIC, RE_REQUIRE, RE_WORKER_URL]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(code))) specs.add(m[1]);
  }
  return specs;
}

function extractNamedConsumers(code) {
  // Map: specifier -> Set of imported/exported names ('*' for namespace, 'default' for default import)
  const out = new Map();
  const add = (spec, name) => {
    if (!out.has(spec)) out.set(spec, new Set());
    out.get(spec).add(name);
  };
  let m;
  RE_NAMED_IMPORT.lastIndex = 0;
  while ((m = RE_NAMED_IMPORT.exec(code))) {
    const names = m[1].split(',');
    for (let n of names) {
      n = n.trim().replace(/^type\s+/, '');
      if (!n) continue;
      const asIdx = n.indexOf(' as ');
      const imported = asIdx >= 0 ? n.slice(0, asIdx).trim() : n;
      add(m[2], imported);
    }
  }
  RE_DEFAULT_IMPORT.lastIndex = 0;
  while ((m = RE_DEFAULT_IMPORT.exec(code))) add(m[2], 'default');
  RE_NS_IMPORT.lastIndex = 0;
  while ((m = RE_NS_IMPORT.exec(code))) add(m[1], '*');
  RE_EXPORT_STAR.lastIndex = 0;
  while ((m = RE_EXPORT_STAR.exec(code))) add(m[1], '**'); // export * — all symbols
  return out;
}

function resolveSpecifier(spec, importerAbs) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('./') || spec.startsWith('../'))
    base = path.resolve(path.dirname(importerAbs), spec);
  else return null; // bare specifier — package/builtin

  const KNOWN_EXT = new Set([...RESOLVE_EXT, '.d.ts', '.png', '.jpg', '.svg', '.woff2']);
  const ext = path.extname(base);
  const candidates = [];
  if (ext && KNOWN_EXT.has(ext)) {
    candidates.push(base);
    // ESM .js -> .ts/.tsx source
    if (/\.jsx?$/.test(base)) {
      candidates.push(base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx'));
    }
  } else {
    // Specifier has no extension OR an unknown dotted suffix (e.g. `state.types`)
    if (ext) candidates.push(base); // literal dotted file, e.g. `.d.ts` handled above too
    for (const e of RESOLVE_EXT) candidates.push(base + e);
    for (const e of RESOLVE_EXT) candidates.push(path.join(base, 'index' + e));
  }
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

// ─── Build graph ────────────────────────────────────────────────────────────

const edges = new Map(); // rel -> Set<rel> (resolved files only)
const moduleConsumers = new Map(); // rel -> Map<symbolName, Set<consumerRel>>

function addConsumer(targetRel, name, consumerRel) {
  if (!moduleConsumers.has(targetRel)) moduleConsumers.set(targetRel, new Map());
  const sym = moduleConsumers.get(targetRel);
  if (!sym.has(name)) sym.set(name, new Set());
  sym.get(name).add(consumerRel);
}

const fileContents = new Map();
for (const [abs, relPath] of allFiles) {
  let code;
  try {
    code = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  fileContents.set(abs, code);
  if (!edges.has(relPath)) edges.set(relPath, new Set());

  for (const spec of extractSpecifiers(code)) {
    const resolved = resolveSpecifier(spec, abs);
    if (resolved && allFiles.has(resolved)) edges.get(relPath).add(allFiles.get(resolved));
  }
  const named = extractNamedConsumers(code);
  for (const [spec, names] of named) {
    const resolved = resolveSpecifier(spec, abs);
    if (!resolved || !allFiles.has(resolved)) continue;
    for (const name of names) addConsumer(allFiles.get(resolved), name, relPath);
  }
}

// Re-export consumer propagation: barrels that re-export symbols forward
// their own consumers to the underlying module (transitively, fixpoint).
function propagateReExports() {
  // For each file, collect its own exported names + re-export edges
  const exportStarEdges = new Map(); // rel -> Set<rel>
  const reExportNamed = new Map(); // rel -> Map<rel, Set<name>>
  for (const [abs, relPath] of allFiles) {
    const code = fileContents.get(abs);
    if (!code) continue;
    let m;
    RE_EXPORT_STAR.lastIndex = 0;
    while ((m = RE_EXPORT_STAR.exec(code))) {
      const r = resolveSpecifier(m[1], abs);
      if (r && allFiles.has(r)) {
        if (!exportStarEdges.has(relPath)) exportStarEdges.set(relPath, new Set());
        exportStarEdges.get(relPath).add(allFiles.get(r));
      }
    }
    const RE_REEXPORT = /export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
    while ((m = RE_REEXPORT.exec(code))) {
      const r = resolveSpecifier(m[2], abs);
      if (!r || !allFiles.has(r)) continue;
      if (!reExportNamed.has(relPath)) reExportNamed.set(relPath, new Map());
      const map = reExportNamed.get(relPath);
      const t = allFiles.get(r);
      if (!map.has(t)) map.set(t, new Set());
      for (let n of m[1].split(',')) {
        n = n.trim().replace(/^type\s+/, '');
        if (!n) continue;
        const asIdx = n.indexOf(' as ');
        map.get(t).add(asIdx >= 0 ? n.slice(0, asIdx).trim() : n);
      }
    }
  }

  // Fixpoint: consumers of a barrel flow to its re-export targets.
  for (let iter = 0; iter < 8; iter++) {
    let changed = false;
    for (const [barrel, targets] of exportStarEdges) {
      const barrelConsumers = moduleConsumers.get(barrel);
      if (!barrelConsumers) continue;
      for (const t of targets) {
        if (!moduleConsumers.has(t)) moduleConsumers.set(t, new Map());
        const sym = moduleConsumers.get(t);
        for (const [name, consumers] of barrelConsumers) {
          if (name === '**' || name === '*') continue;
          if (!sym.has(name)) sym.set(name, new Set());
          for (const c of consumers) {
            if (!sym.get(name).has(c)) {
              sym.get(name).add(c);
              changed = true;
            }
          }
        }
      }
    }
    if (!changed) break;
  }
  return { exportStarEdges, reExportNamed };
}
const reExportInfo = propagateReExports();

// ─── Reachability ───────────────────────────────────────────────────────────

const prodRoots = new Set();
const testRoots = new Set();
for (const [abs, relPath] of allFiles) {
  if (relPath === 'src/main.tsx') prodRoots.add(relPath);
  else if (relPath === 'electron/main.ts') prodRoots.add(relPath);
  else if (relPath.startsWith('src/routes/')) prodRoots.add(relPath);
  else if (relPath.startsWith('src/scripts/')) prodRoots.add(relPath);
  else if (relPath.startsWith('scripts/')) prodRoots.add(relPath);
  else if (relPath.endsWith('.mjs')) prodRoots.add(relPath);
  else if (relPath === 'src/engine/worker.ts') prodRoots.add(relPath);
  else if (isTestFile(relPath) || relPath.startsWith('e2e/')) testRoots.add(relPath);
}

function bfs(roots) {
  const seen = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    const cur = queue.shift();
    for (const next of edges.get(cur) || []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}
const prodReachable = bfs(prodRoots);
const testReachable = bfs(new Set([...testRoots, ...prodRoots])); // tests may import prod files

const srcRel = [...allFiles.values()].filter((r) => r.startsWith('src/'));
const unreachableProd = srcRel.filter((r) => !prodReachable.has(r) && !isTestFile(r));
const testOnlyReachable = srcRel.filter(
  (r) => !prodReachable.has(r) && testReachable.has(r) && !isTestFile(r)
);

// ─── Export index ───────────────────────────────────────────────────────────

const RE_EXPORT_DECL =
  /export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type|enum|abstract\s+class)\s+([\w$]+)/g;
const RE_EXPORT_LIST = /export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g;

const moduleExports = new Map(); // rel -> Set<name>
for (const [abs, relPath] of allFiles) {
  const code = fileContents.get(abs);
  if (!code || isTestFile(relPath)) continue;
  const names = new Set();
  let m;
  RE_EXPORT_DECL.lastIndex = 0;
  while ((m = RE_EXPORT_DECL.exec(code))) names.add(m[1]);
  RE_EXPORT_LIST.lastIndex = 0;
  while ((m = RE_EXPORT_LIST.exec(code))) {
    for (let n of m[1].split(',')) {
      n = n.trim().replace(/^type\s+/, '');
      if (!n) continue;
      const asIdx = n.indexOf(' as ');
      names.add(asIdx >= 0 ? n.slice(asIdx + 4).trim() : n);
    }
  }
  if (/export\s+default/.test(code)) names.add('default');
  moduleExports.set(relPath, names);
}

const deadExports = [];
for (const [relPath, names] of moduleExports) {
  if (!prodReachable.has(relPath)) continue; // whole file already flagged
  const consumers = moduleConsumers.get(relPath);
  for (const name of names) {
    const symConsumers = consumers?.get(name);
    const starConsumed = consumers?.get('**') || consumers?.get('*');
    const prodConsumers = new Set(
      [...(symConsumers || []), ...(starConsumed || [])].filter((c) => !isTestFile(c))
    );
    if (prodConsumers.size === 0) deadExports.push({ file: relPath, symbol: name });
  }
}

// ─── State-field index ──────────────────────────────────────────────────────

const AUDITED_INTERFACES = [
  { name: 'GameState', file: 'src/types/state.types.ts' },
  { name: 'RivalStableData', file: 'src/types/state.types.ts' },
  { name: 'Warrior', file: 'src/types/warrior.types.ts' },
  { name: 'Owner', file: 'src/types/state.types.ts' },
  { name: 'Trainer', file: 'src/types/state.types.ts' },
  { name: 'AIAgentMemory', file: 'src/types/ai.types.ts' },
  { name: 'ProgressionState', file: 'src/types/progression.types.ts' },
];

function findInterfaceFile(name, hint) {
  const hintAbs = path.join(ROOT, hint);
  if (fs.existsSync(hintAbs)) {
    const code = fs.readFileSync(hintAbs, 'utf8');
    if (new RegExp(`export\\s+interface\\s+${name}\\b`).test(code)) return hintAbs;
  }
  for (const [abs, relPath] of allFiles) {
    if (!relPath.startsWith('src/types/')) continue;
    const code = fileContents.get(abs) || '';
    if (new RegExp(`export\\s+interface\\s+${name}\\b`).test(code)) return abs;
  }
  return null;
}

function extractInterfaceFields(abs, name) {
  const code = fs.readFileSync(abs, 'utf8');
  const re = new RegExp(`export\\s+interface\\s+${name}\\b[^{]*\\{`);
  const m = re.exec(code);
  if (!m) return [];
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }
  const body = code.slice(start, i - 1);
  const fields = [];
  // Top-level fields only: match at depth 1
  depth = 1;
  let fieldStart = 0;
  const segments = [];
  for (let j = 0; j < body.length; j++) {
    const ch = body[j];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 1 && (ch === '\n' || j === body.length - 1)) {
      segments.push(body.slice(fieldStart, j));
      fieldStart = j + 1;
    }
  }
  for (const seg of segments) {
    const fm = /^\s*(?:readonly\s+)?([\w$]+)\s*[?]?\s*:/.exec(seg);
    if (fm) fields.push(fm[1]);
  }
  return fields;
}

function bucketOf(relPath) {
  if (isTestFile(relPath)) return 'test';
  if (relPath.startsWith('src/schemas/')) return 'schema';
  if (relPath === 'src/state/serialization.ts') return 'serialization';
  if (relPath.includes('initialState')) return 'initialState';
  if (relPath.startsWith('src/engine/factories/')) return 'factory';
  if (relPath.startsWith('src/types/')) return 'types';
  if (relPath.startsWith('src/components/') || relPath.startsWith('src/pages/'))
    return 'ui';
  if (relPath.startsWith('src/engine/ai/')) return 'ai';
  return 'other-production';
}

const stateFieldReport = {};
for (const { name, file } of AUDITED_INTERFACES) {
  const abs = findInterfaceFile(name, file);
  if (!abs) {
    stateFieldReport[name] = { error: 'interface not found', hint: file };
    continue;
  }
  const fields = extractInterfaceFields(abs, name);
  const fieldData = {};
  for (const field of fields) {
    const writers = new Set();
    const readers = new Map(); // bucket -> Set<file>
    // Scan all files for `.field` or `field:` mentions
    const memberRe = new RegExp(`\\.${field}\\b`);
    const literalRe = new RegExp(`\\b${field}\\s*:`);
    const writeRe = new RegExp(`\\.${field}\\s*=`);
    for (const [absF, relF] of allFiles) {
      const code = fileContents.get(absF);
      if (!code) continue;
      const bucket = bucketOf(relF);
      if (writeRe.test(code) || (literalRe.test(code) && bucket !== 'types')) {
        writers.add(`${bucket}:${relF}`);
      }
      if (memberRe.test(code) || literalRe.test(code)) {
        if (!readers.has(bucket)) readers.set(bucket, new Set());
        readers.get(bucket).add(relF);
      }
    }
    const readerBuckets = Object.fromEntries(
      [...readers.entries()].map(([b, s]) => [b, s.size])
    );
    const nonInfraReaders = ['ui', 'ai', 'other-production'].reduce(
      (n, b) => n + (readerBuckets[b] || 0),
      0
    );
    fieldData[field] = {
      writerSites: writers.size,
      readersByBucket: readerBuckets,
      liveReaders: nonInfraReaders,
      status:
        nonInfraReaders === 0
          ? 'NO_LIVE_READERS'
          : writers.size === 0
            ? 'NO_WRITERS'
            : 'ok',
    };
  }
  stateFieldReport[name] = { file: rel(abs), fields: fieldData };
}

// ─── Route/nav index ────────────────────────────────────────────────────────

const routeFiles = srcRel.filter((r) => r.startsWith('src/routes/') && r.endsWith('.tsx'));
const routePages = {};
for (const r of routeFiles) {
  const abs = path.join(ROOT, r);
  const code = fileContents.get(abs) || '';
  const pages = new Set();
  for (const spec of extractSpecifiers(code)) {
    if (spec.includes('pages/') || spec.includes('@/pages')) pages.add(spec);
  }
  routePages[r] = [...pages];
}

// Nav hrefs: literal route-ish strings in nav/shell files
const navFiles = srcRel.filter(
  (r) =>
    r === 'src/components/navigationHubs.ts' ||
    r === 'src/components/AppShell.tsx' ||
    r.startsWith('src/components/layout/')
);
const navHrefs = new Set();
for (const r of navFiles) {
  const code = fileContents.get(path.join(ROOT, r)) || '';
  for (const m of code.matchAll(/['"`](\/[a-zA-Z0-9_/-]*)['"`]/g)) {
    if (m[1].length > 1) navHrefs.add(m[1]);
  }
}

// Map route file -> route path (approximate from filename conventions)
function routePathOf(relPath) {
  let p = relPath.replace('src/routes/', '').replace(/\.tsx$/, '');
  if (p === '__root') return null;
  if (p.endsWith('/index')) p = p.slice(0, -'/index'.length);
  if (p === 'index') p = '';
  p = p.replace(/\$/g, ':');
  return '/' + p;
}
const routeReport = routeFiles.map((r) => {
  const rp = routePathOf(r);
  const navMatch = rp
    ? [...navHrefs].some((h) => h === rp || (rp !== '/' && h.startsWith(rp + '/')) || h.startsWith(rp + '?'))
    : true;
  return { file: r, path: rp, navLinked: navMatch, pageImports: routePages[r] };
});

// Pages not imported by any route
const pageFiles = srcRel.filter((r) => r.startsWith('src/pages/') && /\.tsx$/.test(r));
const routedTargets = new Set(prodReachable);
const unlinkedPages = pageFiles.filter((p) => {
  // a page file is "linked" if it's in prod reachability via a route or another page
  return !prodReachable.has(p);
});

// ─── Report ─────────────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  stats: {
    filesScanned: allFiles.size,
    srcFiles: srcRel.length,
    prodRoots: prodRoots.size,
    testRoots: testRoots.size,
    prodReachable: [...prodReachable].filter((r) => r.startsWith('src/')).length,
  },
  unreachableFromProd: unreachableProd.sort(),
  testOnlyReachable: testOnlyReachable.sort(),
  deadExports: deadExports.sort((a, b) => a.file.localeCompare(b.file)),
  stateFields: stateFieldReport,
  routes: routeReport,
  navHrefs: [...navHrefs].sort(),
  unlinkedPages: unlinkedPages.sort(),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));

// ─── stdout summary ─────────────────────────────────────────────────────────

console.log('=== ORPHAN SCAN ===');
console.log(`Files scanned: ${report.stats.filesScanned} (src: ${report.stats.srcFiles})`);
console.log(`Prod roots: ${report.stats.prodRoots}, test roots: ${report.stats.testRoots}`);
console.log(`Prod-reachable src files: ${report.stats.prodReachable}`);
console.log('');
console.log(`-- Unreachable from production roots: ${unreachableProd.length}`);
for (const f of unreachableProd) console.log(`   ${f}`);
console.log('');
console.log(`-- Reachable only via tests: ${testOnlyReachable.length}`);
for (const f of testOnlyReachable) console.log(`   ${f}`);
console.log('');
console.log(`-- Exported symbols with 0 production consumers: ${deadExports.length}`);
for (const d of deadExports.slice(0, 60)) console.log(`   ${d.file} :: ${d.symbol}`);
if (deadExports.length > 60) console.log(`   … and ${deadExports.length - 60} more (see JSON)`);
console.log('');
console.log('-- State fields flagged:');
for (const [iface, data] of Object.entries(stateFieldReport)) {
  if (data.error) {
    console.log(`   ${iface}: ${data.error}`);
    continue;
  }
  for (const [field, fd] of Object.entries(data.fields)) {
    if (fd.status !== 'ok') {
      console.log(
        `   ${iface}.${field}: ${fd.status} (writers=${fd.writerSites}, liveReaders=${fd.liveReaders})`
      );
    }
  }
}
console.log('');
console.log('-- Routes without nav link:');
for (const r of routeReport.filter((x) => x.path && !x.navLinked))
  console.log(`   ${r.path}  (${r.file})`);
console.log('');
console.log(`-- Page files unreachable: ${unlinkedPages.length}`);
for (const p of unlinkedPages) console.log(`   ${p}`);
console.log('');
console.log(`Full report: ${rel(OUT_FILE)}`);
