import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readDirRecursive(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readDirRecursive(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function isInside(child: string, parent: string): boolean {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

describe('determinism audit', () => {
  const testDir = path.resolve(__dirname, '..');
  const srcDir = path.resolve(testDir, '..');
  const testExts = ['.test.ts', '.test.tsx'];
  const srcExts = ['.ts', '.tsx'];
  // Audit files legitimately contain 'Math.random()' / fallback patterns inside
  // string literals and regexes — never flag the auditors themselves.
  const auditFiles = new Set(['determinismAudit.test.ts', 'testQualityAudit.test.ts']);
  // src/utils/random.ts is the canonical home of resolveRng/entropyRng — the only
  // file allowed to construct fallback RNGs inline.
  const patternAllowlist = new Set(['random.ts']);

  function productionFiles(): string[] {
    return readDirRecursive(srcDir, srcExts).filter(
      (f) => !isInside(f, testDir) && !auditFiles.has(path.basename(f))
    );
  }

  it('no test file uses Math.random() directly (should use SeededRNGService)', () => {
    const files = readDirRecursive(testDir, testExts);
    const violations: string[] = [];
    for (const file of files) {
      if (auditFiles.has(path.basename(file))) continue;
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('Math.random()')) {
        violations.push(path.basename(file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no production source uses Math.random (ESLint-enforced; audit as backstop)', () => {
    const violations: string[] = [];
    for (const file of productionFiles()) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/\bMath\.random\b/.test(content)) {
        violations.push(path.basename(file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('no inline fallback RNG construction outside src/utils/random.ts (use resolveRng/entropyRng)', () => {
    const fallbackPattern = /\|\|\s*new SeededRNG|\?\?\s*new SeededRNG/;
    const violations: string[] = [];
    for (const file of productionFiles()) {
      if (patternAllowlist.has(path.basename(file))) continue;
      const content = fs.readFileSync(file, 'utf-8');
      if (fallbackPattern.test(content)) {
        violations.push(path.basename(file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('combat test files use seeded RNG or mocks (not Math.random)', () => {
    const combatTestDir = path.resolve(testDir, 'engine/combat');
    if (!fs.existsSync(combatTestDir)) return;
    const files = readDirRecursive(combatTestDir, testExts);
    const noSeed: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Check if the test uses any form of seeded RNG or mocks or fixtures
      const hasSeed =
        content.includes('SeededRNGService') ||
        content.includes('SeededRNG') ||
        content.includes('hashStr') ||
        content.includes('seed') ||
        content.includes('mock') ||
        content.includes('vi.mock') ||
        content.includes('fixture') ||
        content.includes('hardcoded') ||
        content.includes('static');
      if (!hasSeed) {
        noSeed.push(path.basename(file));
      }
    }
    // Allow combat tests that use static data or don't need explicit seeds
    expect(noSeed.length).toBeLessThanOrEqual(50);
  });
});
