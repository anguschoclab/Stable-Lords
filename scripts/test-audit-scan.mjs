#!/usr/bin/env node
/**
 * test-audit-scan.mjs — Test-suite audit scanner for Stable Lords.
 *
 * Builds a per-test-file record used by TEST_AUDIT_FINDINGS.md §Ledger:
 *   1. Import targets (resolved @/ and relative) → same-module collision groups.
 *   2. DOM classification — pragma presence, RTL/render consumers, raw DOM
 *      global consumers vs stubbers → files needing @vitest-environment jsdom.
 *   3. Leak surface — singleton mutations relevant to isolate:false audits.
 *   4. Dead patterns — it.todo / skip / tautology / commented-describe counts.
 *   5. Local factory defs vs _fixtures usage.
 *   6. Runtime join with scripts/out/baseline-test-timings.tsv.
 *
 * Output: scripts/out/test-audit.json + stdout summary.
 * Zero dependencies. Run: `node scripts/test-audit-scan.mjs` (or `bun`).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'scripts', 'out');
const OUT_FILE = path.join(OUT_DIR, 'test-audit.json');
const TIMINGS_FILE = path.join(OUT_DIR, 'baseline-test-timings.tsv');

const TEST_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const DOM_GLOBALS = /\b(document|window|HTMLElement|HTMLMediaElement|navigator)\b/;
const RTL_RE = /@testing-library\/react|\brender(Hook)?\s*\(/;
const FACTORY_DEF_RE = /(?:function|const)\s+(?:make|mk|create)(?:Test)?(?:Warrior|Fighter|Rival|State|Offer|Owner|Stable)\w*/g;
// Local names bound to shared builders — `import { makeWarrior as fixtureW }`
// or plain `import { makeWarrior }` from any _fixtures module.
function fixtureAliases(content) {
  const names = new Set();
  for (const m of content.matchAll(
    /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*['"][^'"]*(?:_fixtures\/[\w-]+|engine\/factories\/\w+)['"]/g
  )) {
    for (const part of m[1].split(',')) {
      const alias = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (alias) names.add(alias);
    }
  }
  return names;
}
// An adapter delegating to a shared builder is not a duplicate factory —
// `const makeX = (...) => sharedBuilder(...)`, `const makeX = sharedBuilder`,
// and block-bodied `=> { ...; return sharedBuilder(...) }` all count as
// delegation. Only defs that construct entities from scratch are flagged.
function hasLocalFactory(content) {
  const aliases = fixtureAliases(content);
  const defs = [...content.matchAll(FACTORY_DEF_RE)];
  for (const [i, m] of defs.entries()) {
    // Bound inspection at the next factory def so a delegate's `return`
    // never gets attributed to a preceding def's body.
    const end = Math.min(defs[i + 1]?.index ?? content.length, m.index + 1600);
    const tail = content.slice(m.index, end);
    const aliasAssign = tail.match(/^const\s+\w+\s*=\s*(\w+)\s*;/);
    if (aliasAssign && aliases.has(aliasAssign[1])) continue;
    const exprCall = tail.match(/^const\s+\w+\s*=\s*\([^)]*\)[^=]*=>\s*\n?\s*(\w+)\s*\(/);
    if (exprCall && aliases.has(exprCall[1])) continue;
    const blockCall = tail.match(/^const\s+\w+\s*=\s*\([^)]*\)[^=]*=>\s*\{[\s\S]{0,1200}?\breturn\s+(\w+)\s*\(/);
    if (blockCall && aliases.has(blockCall[1])) continue;
    const fnCall = tail.match(/^function\s+\w+\s*\([^)]*\)[^{]*\{[\s\S]{0,1200}?\breturn\s+(\w+)\s*\(/);
    if (fnCall && aliases.has(fnCall[1])) continue;
    return true;
  }
  return false;
}
const LEAK_SIGNALS = [
  ['useGameStore', /useGameStore\.(setState|getState)/g],
  ['engineEventBus', /engineEventBus\.(on|emit|subscribe|off)/g],
  ['NewsletterFeed', /NewsletterFeed/g],
  ['setMockIdGenerator', /setMockIdGenerator/g],
  ['viMock', /vi\.mock\(/g],
  ['fakeTimers', /useFakeTimers/g],
  ['localStorage', /localStorage\./g],
];
const DEAD_PATTERNS = [
  ['itTodo', /\bit\.todo\(/g],
  ['itSkip', /\b(it|describe|test)\.skip\(/g],
  ['expectTrue', /expect\(true\)\.toBe/g],
  ['commentedIt', /^\s*\/\/\s*(it|test|describe)\(/gm],
];

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

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function resolveImport(spec, fromFile) {
  if (spec.startsWith('@/')) return 'src/' + spec.slice(2);
  if (spec.startsWith('.')) {
    const resolved = path.normalize(path.join(path.dirname(fromFile), spec));
    return rel(resolved);
  }
  return null; // package import
}

function extractImports(content, file) {
  const targets = new Set();
  const re = /from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) {
    const spec = m[1] ?? m[2];
    const r = resolveImport(spec, file);
    if (r && !r.endsWith('.css')) targets.add(r.replace(/\.(ts|tsx|js|jsx)$/, ''));
  }
  return [...targets].sort();
}

// ─── Collect test files ─────────────────────────────────────────────────────

const testFiles = walk(SRC)
  .filter((f) => TEST_RE.test(f) && !f.includes('node_modules'))
  .map((f) => path.resolve(f));

// Also pick up e2e specs (recorded but excluded from vitest verdicts)
const e2eDir = path.join(ROOT, 'e2e');
const e2eFiles = fs.existsSync(e2eDir)
  ? walk(e2eDir).filter((f) => TEST_RE.test(f))
  : [];

// Runtime join
const timings = new Map();
if (fs.existsSync(TIMINGS_FILE)) {
  for (const line of fs.readFileSync(TIMINGS_FILE, 'utf8').split('\n')) {
    const [ms, file] = line.split('\t');
    if (ms && file) timings.set(file.trim(), Number(ms));
  }
}

// ─── Per-file records ───────────────────────────────────────────────────────

const records = testFiles.map((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = rel(file);
  const imports = extractImports(content, file);
  const appImports = imports.filter((i) => i.startsWith('src/') && !TEST_RE.test(i));

  const leak = {};
  for (const [name, re] of LEAK_SIGNALS) {
    const n = (content.match(re) || []).length;
    if (n) leak[name] = n;
  }
  const dead = {};
  for (const [name, re] of DEAD_PATTERNS) {
    const n = (content.match(re) || []).length;
    if (n) dead[name] = n;
  }

  const hasPragma = /@vitest-environment\s+(\w+)/.exec(content)?.[1] ?? null;
  const usesRTL = RTL_RE.test(content);
  // An explicit `node` pragma means DOM references are assertions of absence
  // (`typeof document === 'undefined'`), not consumption.
  const explicitNode = hasPragma === 'node';
  const domGlobalLines = explicitNode
    ? []
    : content
        .split('\n')
        .filter((l) => DOM_GLOBALS.test(l) && !l.trim().startsWith('//'));
  // Stubber heuristic: line assigns/defines the global rather than reading it
  const domStubber =
    domGlobalLines.length > 0 &&
    domGlobalLines.every((l) =>
      /defineProperty|=\s*(class|function|new|\{)|Mock|prototype\s*=|as\s+typeof/.test(l)
    );
  const domConsumer = domGlobalLines.length > 0 && !domStubber;

  return {
    file: relPath,
    basename: path.basename(file),
    loc: content.split('\n').length,
    envPragma: hasPragma,
    needsDom: usesRTL || domConsumer,
    domStubOnly: domStubber && !usesRTL,
    usesRTL,
    imports: appImports,
    leak,
    dead,
    localFactory: hasLocalFactory(content),
    usesSharedFixtures: content.includes('_fixtures/factories'),
    runtimeMs: timings.get(relPath) ?? null,
    slow: relPath.includes('.slow.test.'),
    // Files that must run in isolated workers: module mocks poison a shared
    // module registry (a sibling caching the real module first makes the mock
    // a no-op), global stubbing leaks without per-file teardown, and jsdom
    // files interleave fatally with node-env files in a shared worker.
    needsIsolation:
      usesRTL ||
      domConsumer ||
      domStubber ||
      hasPragma === 'jsdom' ||
      /vi\.mock\(|mock\.module\(|vi\.stubGlobal|vi\.stubEnv|(?:globalThis|global)\.\w+\s*=(?!=)|Object\.defineProperty\(\s*(?:globalThis|global)\b|@vitest-isolate\b/.test(content),
  };
});

// ─── Same-module collision groups ───────────────────────────────────────────

const byBasename = new Map();
for (const r of records) {
  const key = r.basename;
  if (!byBasename.has(key)) byBasename.set(key, []);
  byBasename.get(key).push(r.file);
}
const basenameCollisions = [...byBasename.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([basename, files]) => {
    const shared = files.map((f) => records.find((r) => r.file === f).imports);
    const sharedTargets = shared[0].filter((t) => shared.every((s) => s.includes(t)));
    return { basename, files, sharedTargets };
  })
  .sort((a, b) => b.sharedTargets.length - a.sharedTargets.length);

// Same-target clusters regardless of basename (files importing identical module set)
const byImportSet = new Map();
for (const r of records) {
  const key = r.imports.join('|');
  if (!key) continue;
  if (!byImportSet.has(key)) byImportSet.set(key, []);
  byImportSet.get(key).push(r.file);
}
const importSetClusters = [...byImportSet.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([set, files]) => ({ targets: set.split('|'), files }));

// ─── Summary ────────────────────────────────────────────────────────────────

const summary = {
  totalTestFiles: records.length + e2eFiles.length,
  vitestFiles: records.length,
  e2eFiles: e2eFiles.length,
  slowFiles: records.filter((r) => r.slow).length,
  pragmaFiles: records.filter((r) => r.envPragma).length,
  needsDom: records.filter((r) => r.needsDom).length,
  needsDomMissingPragma: records.filter((r) => r.needsDom && !r.envPragma).length,
  domStubOnly: records.filter((r) => r.domStubOnly).length,
  localFactoryFiles: records.filter((r) => r.localFactory).length,
  sharedFixtureFiles: records.filter((r) => r.usesSharedFixtures).length,
  withDeadPatterns: records.filter((r) => Object.keys(r.dead).length).length,
  over2s: records.filter((r) => r.runtimeMs > 2000).length,
  basenameCollisionGroups: basenameCollisions.length,
  importSetClusters: importSetClusters.length,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  OUT_FILE,
  JSON.stringify({ generatedAt: new Date().toISOString(), summary, basenameCollisions, importSetClusters, records }, null, 2)
);

// Baseline allowlist for testQualityAudit.test.ts structural guards — the set
// of CURRENT violations each guard tolerates. Entries must shrink to empty as
// Phases 3–4 land fixes. Committed (lives outside gitignored scripts/out).
const baseline = {
  generatedAt: new Date().toISOString(),
  strayTestFiles: records
    .filter((r) => !r.file.startsWith('src/test/'))
    .map((r) => r.file)
    .sort(),
  sameModuleBasenamePairs: basenameCollisions
    .filter((g) => g.sharedTargets.length > 0)
    .map((g) => g.files.sort())
    .map((files) => files.join(' <-> '))
    .sort(),
  localFactoryFiles: records.filter((r) => r.localFactory).map((r) => r.file).sort(),
  missingJsdomPragma: records
    .filter((r) => r.needsDom && !r.envPragma)
    .map((r) => r.file)
    .sort(),
};
fs.writeFileSync(
  path.join(SRC, 'test', '_setup', 'auditBaseline.json'),
  JSON.stringify(baseline, null, 2)
);

// Worker-sharing groups for vitest.config.ts scoped isolation: files listed
// in `isolated` run one-worker-per-file; every other test file shares workers
// in the `shared` project (isolate: false). testQualityAudit.test.ts guards
// this list against drift — regenerate via this script after adding a vi.mock,
// global stub, or jsdom pragma to any test file.
fs.writeFileSync(
  path.join(SRC, 'test', '_setup', 'runnerGroups.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      isolated: records.filter((r) => r.needsIsolation).map((r) => r.file).sort(),
    },
    null,
    2
  )
);

console.log('=== TEST AUDIT SCAN ===');
for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);
console.log('\nFiles needing DOM but missing env pragma:');
for (const r of records.filter((r) => r.needsDom && !r.envPragma))
  console.log(`   ${r.file} (RTL:${r.usesRTL} stubOnly:${r.domStubOnly})`);
console.log('\nFiles >2000ms:');
for (const r of records.filter((r) => r.runtimeMs > 2000).sort((a, b) => b.runtimeMs - a.runtimeMs))
  console.log(`   ${r.runtimeMs}ms ${r.file}`);
console.log(`\nFull report: ${path.relative(ROOT, OUT_FILE)}`);
