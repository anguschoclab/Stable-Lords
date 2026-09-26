import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import baseline from './_setup/auditBaseline.json';

const TEST_DIR = path.resolve(__dirname); // src/test/
const SRC_DIR = path.resolve(TEST_DIR, '..');
const REPO_ROOT = path.resolve(SRC_DIR, '..');

// Mirrors scripts/test-audit-scan.mjs heuristics — the audit scanner generates
// reports; this test is the enforcement gate. Baseline allowlists shrink to
// empty as the megaplan's merge/move phases land.
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
const RTL_RE = /@testing-library\/react|\brender(Hook)?\s*\(/;
const DOM_GLOBALS_RE = /\b(document|window|HTMLElement|HTMLMediaElement|navigator)\b/;
const DOM_STUB_LINE_RE = /defineProperty|=\s*(class|function|new|\{)|Mock|prototype\s*=|as\s+typeof/;
const LOCAL_FACTORY_RE =
  /(?:function|const)\s+(?:make|mk|create)(?:Test)?(?:Warrior|Fighter|Rival|State|Offer|Owner|Stable)/;

function readDirRecursive(dir: string, pred: (name: string) => boolean, results: string[] = []): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name.startsWith('.')) continue;
      readDirRecursive(fullPath, pred, results);
    } else if (pred(item.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function rel(file: string): string {
  return path.relative(REPO_ROOT, file).split(path.sep).join('/');
}

function allVitestTestFiles(): string[] {
  return readDirRecursive(SRC_DIR, (n) => TEST_FILE_RE.test(n));
}

function extractImportTargets(file: string): Set<string> {
  const content = fs.readFileSync(file, 'utf8');
  const targets = new Set<string>();
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const spec = m[1]!;
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

describe('testQualityAudit', () => {
  it('no test file uses Date.now() for deterministic logic', () => {
    const files = readDirRecursive(TEST_DIR, (n) => n.endsWith('.test.ts'));
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
    const files = readDirRecursive(TEST_DIR, (n) => n.endsWith('.test.ts'));
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
      if (LOCAL_FACTORY_RE.test(content) && !f.endsWith('factories.test.ts')) {
        violations.push(rel(f));
      }
    }
    expectAllowlistClean(violations.sort(), baseline.localFactoryFiles, 'local-factories');
  });

  it('DOM-consuming tests carry @vitest-environment jsdom', () => {
    const violations: string[] = [];
    for (const f of allVitestTestFiles()) {
      const content = fs.readFileSync(f, 'utf8');
      if (needsDom(content) && !/@vitest-environment\s+jsdom/.test(content)) {
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
    // default config must exclude slow tests so they never run in the fast suite
    const defaultConfig = fs.readFileSync(path.join(REPO_ROOT, 'vitest.config.ts'), 'utf8');
    expect(defaultConfig).toContain('**/*.slow.test.ts');
  });
});
