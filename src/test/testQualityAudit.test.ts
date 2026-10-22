import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { listTsFiles } from '@/test/_helpers/fsWalk';
import baseline from './_setup/auditBaseline.json';
import runnerGroups from './_setup/runnerGroups.json';

const TEST_DIR = path.resolve(__dirname); // src/test/
const SRC_DIR = path.resolve(TEST_DIR, '..');
const REPO_ROOT = path.resolve(SRC_DIR, '..');

// Mirrors scripts/test-audit-scan.mjs heuristics — the audit scanner generates
// reports; this test is the enforcement gate. Baseline allowlists shrink to
// empty as the megaplan's merge/move phases land.
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const RTL_RE = /@testing-library\/react|\brender(Hook)?\s*\(/;
const DOM_GLOBALS_RE = /\b(document|window|HTMLElement|HTMLMediaElement|navigator)\b/;
const DOM_STUB_LINE_RE =
  /defineProperty|=\s*(class|function|new|\{)|Mock|prototype\s*=|as\s+typeof/;
const LOCAL_FACTORY_RE =
  /(?:function|const)\s+(?:make|mk|create)(?:Test)?(?:Warrior|Fighter|Rival|State|Offer|Owner|Stable)\w*/g;
// Local names bound to shared builders — `import { makeWarrior as fixtureW }`
// or plain `import { makeWarrior }` from _fixtures/factories. Mirrors scanner.
function fixtureAliases(content: string): Set<string> {
  const names = new Set<string>();
  for (const m of content.matchAll(
    /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*['"][^'"]*(?:_fixtures\/[\w-]+|engine\/factories\/\w+)['"]/g
  )) {
    for (const part of m[1]!.split(',')) {
      const alias = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (alias) names.add(alias);
    }
  }
  return names;
}
// `const makeX = (...) => sharedBuilder(...)`, `const makeX = sharedBuilder`,
// and `=> { ...; return sharedBuilder(...) }` all delegate to _fixtures —
// not a local factory. Only defs constructing entities from scratch count.
function hasLocalFactory(content: string): boolean {
  const aliases = fixtureAliases(content);
  const defs = [...content.matchAll(LOCAL_FACTORY_RE)];
  for (const [i, m] of defs.entries()) {
    // Bound inspection at the next factory def so a delegate's `return`
    // never gets attributed to a preceding def's body.
    const end = Math.min(defs[i + 1]?.index ?? content.length, m.index! + 1600);
    const tail = content.slice(m.index!, end);
    const aliasAssign = tail.match(/^const\s+\w+\s*=\s*(\w+)\s*;/);
    if (aliasAssign && aliases.has(aliasAssign[1]!)) continue;
    const exprCall = tail.match(/^const\s+\w+\s*=\s*\([^)]*\)[^=]*=>\s*\n?\s*(\w+)\s*\(/);
    if (exprCall && aliases.has(exprCall[1]!)) continue;
    const blockCall = tail.match(
      /^const\s+\w+\s*=\s*\([^)]*\)[^=]*=>\s*\{[\s\S]{0,1200}?\breturn\s+(\w+)\s*\(/
    );
    if (blockCall && aliases.has(blockCall[1]!)) continue;
    const fnCall = tail.match(
      /^function\s+\w+\s*\([^)]*\)[^{]*\{[\s\S]{0,1200}?\breturn\s+(\w+)\s*\(/
    );
    if (fnCall && aliases.has(fnCall[1]!)) continue;
    return true;
  }
  return false;
}

function rel(file: string): string {
  return path.relative(REPO_ROOT, file).split(path.sep).join('/');
}

function allVitestTestFiles(): string[] {
  return listTsFiles(SRC_DIR, TEST_FILE_RE);
}

function extractImportTargets(file: string): Set<string> {
  const content = fs.readFileSync(file, 'utf8');
  const targets = new Set<string>();
  // Static `from '…'` plus dynamic `import('…')` — several component specs
  // lazy-import their subject inside the test body.
  const re = /from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const spec = (m[1] ?? m[2])!;
    if (spec.startsWith('@/')) targets.add('src/' + spec.slice(2));
    else if (spec.startsWith('.')) {
      const resolved = path.normalize(path.join(path.dirname(file), spec));
      targets.add(rel(resolved).replace(/\.(ts|tsx|js|jsx)$/, ''));
    }
  }
  return targets;
}

function needsDom(content: string): boolean {
  if (RTL_RE.test(content)) return true;
  // An explicit `node` pragma means DOM references are assertions of absence
  // (`typeof document === 'undefined'`), not consumption.
  if (/@vitest-environment\s+node/.test(content)) return false;
  const lines = content
    .split('\n')
    .filter((l) => DOM_GLOBALS_RE.test(l) && !l.trim().startsWith('//'));
  return lines.length > 0 && !lines.every((l) => DOM_STUB_LINE_RE.test(l));
}

/** Assert current violations ⊆ allowlist AND allowlist ⊆ current violations (no drift). */
function expectAllowlistClean(current: string[], allowed: readonly string[], rule: string) {
  const allowedSet = new Set(allowed);
  const currentSet = new Set(current);
  const fresh = current.filter((v) => !allowedSet.has(v));
  const stale = allowed.filter((v) => !currentSet.has(v));
  expect(fresh, `${rule} — NEW violations:\n${fresh.join('\n')}`).toEqual([]);
  expect(
    stale,
    `${rule} — allowlist entries fixed; DELETE them from auditBaseline.json:\n${stale.join('\n')}`
  ).toEqual([]);
}

// Mirrors scripts/test-audit-scan.mjs — category → production domain map and
// the registered non-mirror infrastructure dirs. Keep the two in sync.
const CATEGORY_DOMAIN: Record<string, string[]> = {
  components: ['src/components', 'src/pages'],
  pages: ['src/pages'],
  routes: ['src/routes'],
  engine: ['src/engine'],
  data: ['src/data'],
  lib: ['src/lib'],
  utils: ['src/utils'],
  constants: ['src/constants'],
  schemas: ['src/schemas'],
  state: ['src/state'],
  hooks: ['src/hooks'],
  lore: ['src/lore'],
};
// Non-mirror dirs: suite infrastructure and repo-audit homes that exist by
// design (see docs/TESTING.md). Any other src/test/<dir>/ is drift — the
// category check below skips unlisted dirs entirely, so registration here is
// what keeps a stray dir from silently escaping conformance.
const NON_MIRROR_DIRS = new Set([
  '_fixtures',
  '_helpers',
  '_mocks',
  '_setup',
  'config',
  'integration',
  'megaplan',
  'perf',
  'scripts',
  'ui',
  'vite',
]);
// Registered dispositions for src/test/megaplan/ guard specs — every guard
// must declare LIVE_RATCHET (fails on regression) or RETIRE→successor. All 28
// current guards pin regressable invariants (T6 wave-2 audit); new guards
// must register here.
const GUARD_REGISTRY: Record<string, string> = {
  'appShell.cta.test.tsx': 'LIVE_RATCHET',
  'documentationParity.test.ts': 'LIVE_RATCHET',
  'duplication.guard.test.ts': 'LIVE_RATCHET',
  'entriesInLoop.guard.test.ts': 'LIVE_RATCHET',
  'fileBudget.test.ts': 'LIVE_RATCHET',
  'informationArchitecture.test.ts': 'LIVE_RATCHET',
  'legibility.contract.test.ts': 'LIVE_RATCHET',
  'markdownSanitize.guard.test.ts': 'LIVE_RATCHET',
  'orphanScan.guard.test.ts': 'LIVE_RATCHET',
  'pagePrimitives.conformance.test.tsx': 'LIVE_RATCHET',
  'paramBudget.guard.test.ts': 'LIVE_RATCHET',
  'scanInLoop.guard.test.ts': 'LIVE_RATCHET',
  'skipCount.guard.test.ts': 'LIVE_RATCHET',
  'styleArchives.wired.test.tsx': 'LIVE_RATCHET',
  'testSuiteAudit.guard.test.ts': 'LIVE_RATCHET',
  'typeSurface.test.ts': 'LIVE_RATCHET',
  'uiTokens.guard.test.ts': 'LIVE_RATCHET',
  'v11DeadSurface.guard.test.ts': 'LIVE_RATCHET',
  'v11Dedup.guard.slow.test.ts': 'LIVE_RATCHET',
  'v11Restructure.guard.test.ts': 'LIVE_RATCHET',
  'v11Wiring.contract.test.ts': 'LIVE_RATCHET',
  'v12Dedup.guard.test.ts': 'LIVE_RATCHET',
  'v12Srp.guard.test.ts': 'LIVE_RATCHET',
  'v14EntryPoints.guard.test.ts': 'LIVE_RATCHET',
  'v14PipelineDocs.guard.test.ts': 'LIVE_RATCHET',
  'v18Dedup.guard.test.ts': 'LIVE_RATCHET',
  'v18Preservation.guard.test.ts': 'LIVE_RATCHET',
  'v18Srp.guard.test.ts': 'LIVE_RATCHET',
  'v19Dedup.guard.test.ts': 'LIVE_RATCHET',
  'v19Preservation.guard.test.ts': 'LIVE_RATCHET',
  'v19Srp.guard.test.ts': 'LIVE_RATCHET',
  'wiring.wired.test.tsx': 'LIVE_RATCHET',
};

describe('testQualityAudit', () => {
  it('no test file uses Date.now() for deterministic logic', () => {
    const files = listTsFiles(TEST_DIR, /\.test\.ts$/);
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (line.startsWith('//') || line.startsWith('*') || line.includes('mockResolvedValue'))
          continue;
        if (line.includes('Date.now()') && !line.includes('mock') && !line.includes('Mock')) {
          violations.push(`${path.basename(file)}:${i + 1}`);
        }
      }
    }
    expect(violations.length).toBeLessThan(5);
  });

  it('all test files have at least one describe block', () => {
    const files = listTsFiles(TEST_DIR, /\.test\.ts$/);
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (!content.includes('describe(')) {
        violations.push(path.basename(file));
      }
    }
    expect(violations, `Test files without describe(): ${violations.join(', ')}`).toHaveLength(0);
  });

  it('no vitest test files outside src/test/', () => {
    const strays = allVitestTestFiles()
      .map(rel)
      .filter((f) => !f.startsWith('src/test/'));
    expectAllowlistClean(strays, baseline.strayTestFiles, 'colocated-test-files');
  });

  it('no basename collisions importing the same module', () => {
    const byBasename = new Map<string, string[]>();
    for (const f of allVitestTestFiles()) {
      const base = path.basename(f);
      const arr = byBasename.get(base) ?? [];
      arr.push(f);
      byBasename.set(base, arr);
    }
    const pairs: string[] = [];
    for (const files of byBasename.values()) {
      if (files.length < 2) continue;
      const importSets = files.map((f) => extractImportTargets(f));
      const shared = [...importSets[0]!].filter((t) => importSets.every((s) => s.has(t)));
      if (shared.length === 0) continue;
      pairs.push(files.map(rel).sort().join(' <-> '));
    }
    expectAllowlistClean(pairs.sort(), baseline.sameModuleBasenamePairs, 'same-module-basename');
  });

  it('no local entity factories when _fixtures/factories exists', () => {
    const violations: string[] = [];
    for (const f of allVitestTestFiles()) {
      const content = fs.readFileSync(f, 'utf8');
      if (hasLocalFactory(content) && !f.endsWith('factories.test.ts')) {
        violations.push(rel(f));
      }
    }
    expectAllowlistClean(violations.sort(), baseline.localFactoryFiles, 'local-factories');
  });

  it('DOM-consuming tests carry @vitest-environment jsdom', () => {
    const violations: string[] = [];
    for (const f of allVitestTestFiles()) {
      const content = fs.readFileSync(f, 'utf8');
      if (needsDom(content) && !/@vitest-environment\s+\w+/.test(content)) {
        violations.push(rel(f));
      }
    }
    expectAllowlistClean(violations.sort(), baseline.missingJsdomPragma, 'missing-jsdom-pragma');
  });

  it('slow tests live under src/test and match the slow config include', () => {
    const slowFiles = allVitestTestFiles()
      .map(rel)
      .filter((f) => f.includes('.slow.test.'));
    const outside = slowFiles.filter((f) => !f.startsWith('src/test/'));
    expect(outside, `Slow tests outside src/test/: ${outside.join(', ')}`).toEqual([]);
    const slowConfig = fs.readFileSync(path.join(REPO_ROOT, 'vitest.config.slow.ts'), 'utf8');
    expect(slowConfig).toContain('src/test/**/*.slow.test.ts');
    expect(slowConfig).toContain('src/test/**/*.slow.test.tsx');
    // default config must exclude slow tests so they never run in the fast suite
    const defaultConfig = fs.readFileSync(path.join(REPO_ROOT, 'vitest.config.ts'), 'utf8');
    expect(defaultConfig).toContain('**/*.slow.test.ts');
    expect(defaultConfig).toContain('**/*.slow.test.tsx');
  });

  it('slow suffix is terminal (foo.slow.test.ts, never foo.slow.bar.test.ts)', () => {
    const violations = allVitestTestFiles()
      .map(rel)
      .filter((f) => f.includes('.slow.') && !/\.slow\.test\.(ts|tsx)$/.test(f));
    expect(violations, `misplaced .slow qualifier:\n${violations.join('\n')}`).toEqual([]);
  });

  it('test files import from their own domain (category conformance)', () => {
    // A test under src/test/<cat>/ should import ≥1 module from that domain —
    // otherwise its subjects live elsewhere and the file is misfiled.
    // Zero-prod-import files are scanner-style audits and exempt.
    const violations: string[] = [];
    for (const f of allVitestTestFiles()) {
      const relPath = rel(f);
      const cat = /^src\/test\/([^/]+)\//.exec(relPath)?.[1];
      const domain = cat ? CATEGORY_DOMAIN[cat] : undefined;
      if (!domain) continue;
      const prod = [...extractImportTargets(f)].filter(
        (t) => t.startsWith('src/') && !t.startsWith('src/test')
      );
      if (prod.length > 0 && !prod.some((t) => domain.some((d) => t.startsWith(d)))) {
        violations.push(relPath);
      }
    }
    expectAllowlistClean(violations.sort(), baseline.misplacedCategoryFiles, 'misplaced-category');
  });

  it('e2e marathon specs carry the @slow tag', () => {
    // A spec whose timeout exceeds 5min is a marathon — it must be tagged
    // @slow so `bun run e2e` (chromium smoke, --grep-invert @slow) skips it.
    // Sub-5min bumps for slow mobile nav are smoke-tier and stay untagged.
    const e2eDir = path.join(REPO_ROOT, 'e2e');
    const violations: string[] = [];
    for (const f of listTsFiles(e2eDir, /\.spec\.ts$/)) {
      const content = fs.readFileSync(f, 'utf8');
      const maxTimeout = Math.max(
        0,
        ...[...content.matchAll(/test\.setTimeout\(([^)]*)\)/g)].flatMap((m) =>
          [...m[1]!.matchAll(/(\d[\d_]*)/g)].map((n) => Number(n[1]!.replace(/_/g, '')))
        )
      );
      if (maxTimeout > 300_000 && !content.includes("'@slow'")) {
        violations.push(rel(f));
      }
    }
    expect(violations, `marathon e2e specs missing @slow tag:\n${violations.join('\n')}`).toEqual(
      []
    );
  });

  it('runnerGroups.json matches live isolation signals (regen: test-audit-scan)', () => {
    const ISOLATION_SIGNALS =
      /vi\.mock\(|mock\.module\(|vi\.stubGlobal|vi\.stubEnv|(?:globalThis|global)\.\w+\s*=(?!=)|Object\.defineProperty\(\s*(?:globalThis|global)\b|@vitest-isolate\b/;
    const live: string[] = [];
    for (const f of allVitestTestFiles()) {
      const content = fs.readFileSync(f, 'utf8');
      const pragma = /@vitest-environment\s+(\w+)/.exec(content)?.[1];
      if (ISOLATION_SIGNALS.test(content) || pragma === 'jsdom' || needsDom(content)) {
        live.push(rel(f));
      }
    }
    live.sort();
    const declared = [...runnerGroups.isolated].sort();
    const missing = live.filter((f) => !declared.includes(f));
    const extra = declared.filter((f) => !live.includes(f));
    expect(
      missing,
      `files needing isolation missing from runnerGroups.json — rerun scripts/test-audit-scan.mjs:\n${missing.join('\n')}`
    ).toEqual([]);
    expect(
      extra,
      `stale runnerGroups.json entries — rerun scripts/test-audit-scan.mjs:\n${extra.join('\n')}`
    ).toEqual([]);
  });

  it('filename qualifiers follow the suffix taxonomy', () => {
    // Grammar: <subject>[.<category>…][.<subject-qualifier>][.slow].test.{ts,tsx}
    //   category qualifiers: integration | e2e | perf | guard (any position)
    //   subject qualifier:   ≤1 token matching ^[a-z][a-zA-Z]*$ (free-form area
    //                        hints like .crown, .helpers, .contract — validated
    //                        wave-2: all 41 live qualifiers fit)
    //   .slow:               terminal only (separate check, restated here)
    const CATEGORY_QUALIFIERS = new Set(['integration', 'e2e', 'perf', 'guard']);
    const violations: string[] = [];
    for (const f of allVitestTestFiles()) {
      const base = path.basename(f).replace(/\.test\.(ts|tsx)$/, '');
      const qualifiers = base.split('.').slice(1);
      let subjectCount = 0;
      for (let i = 0; i < qualifiers.length; i++) {
        const q = qualifiers[i]!;
        if (q === 'slow') {
          if (i !== qualifiers.length - 1)
            violations.push(`${rel(f)} — .slow must be terminal`);
        } else if (!CATEGORY_QUALIFIERS.has(q)) {
          if (!/^[a-z][a-zA-Z]*$/.test(q)) {
            violations.push(`${rel(f)} — malformed qualifier '.${q}'`);
          } else if (++subjectCount > 1) {
            violations.push(`${rel(f)} — more than one subject qualifier`);
          }
        }
      }
    }
    expect(violations, `suffix-taxonomy violations:\n${violations.join('\n')}`).toEqual([]);
  });

  it('every src/test subdir is registered (domain map or non-mirror list)', () => {
    // The category-conformance check only evaluates dirs present in
    // CATEGORY_DOMAIN — an unlisted dir escapes it silently (that is how
    // src/test/layout/ drifted in). Every dir must be declared: mirror domain
    // or registered non-mirror infrastructure.
    const unregistered = new Set<string>();
    for (const f of allVitestTestFiles()) {
      const cat = /^src\/test\/([^/]+)\//.exec(rel(f))?.[1];
      if (cat && !CATEGORY_DOMAIN[cat] && !NON_MIRROR_DIRS.has(cat)) unregistered.add(cat);
    }
    expectAllowlistClean(
      [...unregistered].sort(),
      baseline.unregisteredTestDirs ?? [],
      'unregistered-src-test-dir'
    );
  });

  it('CI bun-test shard enumerates all test dirs dynamically (no coverage drift)', () => {
    // The shard loop hardcoded `src/test/engine/*/ + 15 dirs — engine-root
    // files (51) and unlisted dirs (19 more) silently never ran under bun in
    // CI (wave-2 finding V7: 70 files, incl. the bunViCompat canary itself).
    // Require filesystem-driven enumeration — a literal dir list drifts.
    const ci = fs.readFileSync(
      path.join(REPO_ROOT, '.github/workflows/ci.yml'),
      'utf8'
    );
    const shard = ci.slice(ci.indexOf('name: Run bun test suite'));
    expect(
      /for d in src\/test\//.test(shard),
      'bun-test shard enumerates a hardcoded src/test dir list — use `for d in $(find src/test …)`'
    ).toBe(false);
    expect(
      /find src\/test/.test(shard),
      'bun-test shard must enumerate src/test dynamically (find src/test …)'
    ).toBe(true);
  });

  it('bunfig.toml ignores every *.slow.test.* file (slow tier sync)', () => {
    const bunfig = fs.readFileSync(path.join(REPO_ROOT, 'bunfig.toml'), 'utf8');
    expect(bunfig).toContain('**/*.slow.test.ts');
    expect(bunfig).toContain('**/*.slow.test.tsx');
    const outside = allVitestTestFiles()
      .map(rel)
      .filter((f) => f.includes('.slow.test.') && !f.startsWith('src/test/'));
    expect(outside, `slow tests outside src/test/: ${outside.join(', ')}`).toEqual([]);
  });

  it('every megaplan guard is registered in GUARD_REGISTRY', () => {
    const guards = listTsFiles(path.join(TEST_DIR, 'megaplan'), /\.test\.tsx?$/).map((f) => path.basename(f));
    const unregistered = guards.filter((g) => !(g in GUARD_REGISTRY));
    const stale = Object.keys(GUARD_REGISTRY).filter((g) => !guards.includes(g));
    expect(
      unregistered,
      `megaplan guards missing from GUARD_REGISTRY — register a disposition:\n${unregistered.join('\n')}`
    ).toEqual([]);
    expect(
      stale,
      `GUARD_REGISTRY entries for deleted guards — remove them:\n${stale.join('\n')}`
    ).toEqual([]);
  });
});
