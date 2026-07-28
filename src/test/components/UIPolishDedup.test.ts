/**
 * UI polish dedup tests — verifies no duplicate motion-reduce classes
 * exist in any component source file's className strings.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const COMPONENTS_DIR = path.resolve(__dirname, '../../components');

function findTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsxFiles(fullPath));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('UI polish — no duplicate motion-reduce classes', () => {
  const files = findTsxFiles(COMPONENTS_DIR);

  it('found component files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no className string has duplicate motion-reduce:transition-none', () => {
    const violations: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      const classNameMatches = source.matchAll(/className=["'`{]([^"'`]*?)["'`}/]/g);
      for (const match of classNameMatches) {
        const cls = match[1] || '';
        const count = (cls.match(/motion-reduce:transition-none/g) || []).length;
        if (count > 1) {
          violations.push(`${path.relative(COMPONENTS_DIR, file)}: ${count}x motion-reduce:transition-none`);
        }
      }
    }
    expect(violations, `Duplicate motion-reduce:transition-none found:\n${violations.join('\n')}`).toHaveLength(0);
  });

  it('no className string has duplicate motion-reduce:transform-none', () => {
    const violations: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      const classNameMatches = source.matchAll(/className=["'`{]([^"'`]*?)["'`}/]/g);
      for (const match of classNameMatches) {
        const cls = match[1] || '';
        const count = (cls.match(/motion-reduce:transform-none/g) || []).length;
        if (count > 1) {
          violations.push(`${path.relative(COMPONENTS_DIR, file)}: ${count}x motion-reduce:transform-none`);
        }
      }
    }
    expect(violations, `Duplicate motion-reduce:transform-none found:\n${violations.join('\n')}`).toHaveLength(0);
  });
});
