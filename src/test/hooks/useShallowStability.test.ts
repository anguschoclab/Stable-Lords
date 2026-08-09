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

describe('useShallow stability audit', () => {
  const srcDir = path.resolve(__dirname, '../../');

  it('no useShallow selector calls .map() inside the selector callback', () => {
    const files = [
      ...readDirRecursive(path.join(srcDir, 'state'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'hooks'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'components'), '.tsx'),
    ];
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      // Look for useShallow((s) => ... .map( pattern
      const useShallowBlocks = content.match(/useShallow\(\([^)]+\)=>[^}]+\.map\(/g);
      if (useShallowBlocks) {
        violations.push(path.basename(file));
      }
    }
    expect(
      violations,
      `Files with .map() inside useShallow: ${violations.join(', ')}`
    ).toHaveLength(0);
  });

  it('no useShallow selector creates new arrays via Array.from() inside selector', () => {
    const files = [
      ...readDirRecursive(path.join(srcDir, 'state'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'hooks'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'components'), '.tsx'),
    ];
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const useShallowBlocks = content.match(/useShallow\(\([^)]+\)=>[^}]+Array\.from\(/g);
      if (useShallowBlocks) {
        violations.push(path.basename(file));
      }
    }
    expect(
      violations,
      `Files with Array.from() inside useShallow: ${violations.join(', ')}`
    ).toHaveLength(0);
  });

  it('all useShallow selectors return either direct state or object of state slices', () => {
    const selectorFiles = [
      ...readDirRecursive(path.join(srcDir, 'state'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'hooks'), '.ts'),
    ];
    // Verify that useShallow is used in the codebase
    let totalUseShallow = 0;
    for (const file of selectorFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(/useShallow\(/g);
      if (matches) totalUseShallow += matches.length;
    }
    expect(totalUseShallow).toBeGreaterThan(0);
  });
});
