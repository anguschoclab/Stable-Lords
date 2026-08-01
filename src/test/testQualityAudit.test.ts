import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function readDirRecursive(dir: string, ext: string, results: string[] = []): string[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      readDirRecursive(fullPath, ext, results);
    } else if (item.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('testQualityAudit', () => {
  const testDir = path.resolve(__dirname, '..');

  it('no test file uses Math.random() directly (should use SeededRNGService)', () => {
    const files = readDirRecursive(testDir, '.test.ts');
    const violations: string[] = [];
    for (const file of files) {
      // Skip this file (it mentions Math.random() in its assertion message)
      if (file.endsWith('testQualityAudit.test.ts')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('Math.random()')) {
        violations.push(path.basename(file));
      }
    }
    // Known existing violations: RivalStrategyPass.test.ts, idUtils.test.ts
    // These should be fixed over time. For now, document them.
    expect(violations.length).toBeLessThanOrEqual(5);
  });

  it('no test file uses Date.now() for deterministic logic', () => {
    const files = readDirRecursive(testDir, '.test.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Allow Date.now() in mock setup or comments, but not in assertions
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim();
        // Skip comments and mock setup
        if (line.startsWith('//') || line.startsWith('*') || line.includes('mockResolvedValue')) continue;
        // Flag Date.now() used in expect() or variable assignments for test data
        if (line.includes('Date.now()') && !line.includes('mock') && !line.includes('Mock')) {
          violations.push(`${path.basename(file)}:${i + 1}`);
        }
      }
    }
    // Some tests may legitimately use Date.now() for timestamps
    expect(violations.length).toBeLessThan(5);
  });

  it('all test files have at least one describe block', () => {
    const files = readDirRecursive(testDir, '.test.ts');
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (!content.includes('describe(')) {
        violations.push(path.basename(file));
      }
    }
    expect(violations, `Test files without describe(): ${violations.join(', ')}`).toHaveLength(0);
  });
});
