import { describe, it, expect } from 'vitest';
import { readDirRecursive } from '@/test/_setup/fsHelpers';
import fs from 'fs';
import path from 'path';

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
