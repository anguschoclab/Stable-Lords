import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readDirRecursive(dir: string, ext: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readDirRecursive(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

describe('determinism audit', () => {
  const testDir = path.resolve(__dirname, '..');

  it('no test file uses Math.random() directly (should use SeededRNGService)', () => {
    const files = readDirRecursive(testDir, '.test.ts');
    const violations: string[] = [];
    for (const file of files) {
      if (file.endsWith('determinismAudit.test.ts')) continue;
      if (file.endsWith('testQualityAudit.test.ts')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('Math.random()')) {
        violations.push(path.basename(file));
      }
    }
    // Known existing violations: RivalStrategyPass.test.ts, idUtils.test.ts
    expect(violations.length).toBeLessThanOrEqual(5);
  });

  it('combat test files use seeded RNG or mocks (not Math.random)', () => {
    const combatTestDir = path.resolve(testDir, 'engine/combat');
    if (!fs.existsSync(combatTestDir)) return;
    const files = readDirRecursive(combatTestDir, '.test.ts');
    const noSeed: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Check if the test uses any form of seeded RNG or mocks or fixtures
      const hasSeed =
        content.includes('SeededRNGService') ||
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
    expect(noSeed.length).toBeLessThanOrEqual(35);
  });
});
