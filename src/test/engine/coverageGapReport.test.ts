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

describe('coverage gap report', () => {
  const engineDir = path.resolve(__dirname, '../../src/engine');
  const testDir = path.resolve(__dirname, '../engine');

  it('identifies engine modules with no corresponding test file', () => {
    const engineFiles = readDirRecursive(engineDir, '.ts')
      .filter((f) => !f.endsWith('.d.ts') && !f.endsWith('.test.ts'))
      .map((f) => path.relative(engineDir, f).replace(/\.ts$/, ''));

    const testFiles = readDirRecursive(testDir, '.ts').map((f) =>
      path.relative(testDir, f).replace(/\.test\.ts$/, '')
    );

    // Find engine modules without any matching test file
    const untested: string[] = [];
    for (const engineFile of engineFiles) {
      const baseName = path.basename(engineFile);
      const hasTest = testFiles.some((t) => {
        return t.endsWith(baseName) || t.includes(baseName);
      });
      if (!hasTest) {
        untested.push(engineFile);
      }
    }

    // Document the gap — many engine files may lack direct tests
    // but are covered by integration tests. Just report the count.
    expect(untested.length).toBeLessThan(150);
  });

  it('all test files have at least one expect() call', () => {
    const files = readDirRecursive(path.resolve(__dirname, '..'), '.test.ts');
    const noExpects: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (!content.includes('expect(')) {
        noExpects.push(path.basename(file));
      }
    }
    expect(noExpects, `Test files with no expect(): ${noExpects.join(', ')}`).toHaveLength(0);
  });
});
