import { describe, it, expect } from 'vitest';
import { listFiles as readDirRecursive } from '@/test/_helpers/fsWalk';
import fs from 'fs';
import path from 'path';

// The original regexes required `)=>` with no space — Prettier always
// emits `) =>`, so both guards could never match (dead since inception).
// Repaired to allow whitespace; the .map rule is also narrowed to the real
// hazard — callbacks that allocate a fresh object each call. Primitive
// projections like `(w) => w.id` (the #1062 pattern) are the recommended
// useShallow idiom and are allowed.
const MAP_TO_OBJECT_RE =
  /useShallow\(\s*\([^)]*\)\s*=>\s*[^;}]*\.map\(\s*\([^)]*\)\s*=>\s*\(?\s*{/g;
const ARRAY_FROM_RE = /useShallow\(\s*\([^)]*\)\s*=>\s*[^;}]*Array\.from\(/g;

describe('useShallow stability audit', () => {
  const srcDir = path.resolve(__dirname, '../../');

  it('audit regexes actually match their planted-positive shapes (F2)', () => {
    expect(MAP_TO_OBJECT_RE.test('useShallow((s) => s.roster.map((w) => ({ id: w.id })))')).toBe(
      true
    );
    expect(MAP_TO_OBJECT_RE.test('useShallow((s) => s.roster.map((w) => w.id))')).toBe(false);
    expect(ARRAY_FROM_RE.test('useShallow((s) => Array.from(s.ids))')).toBe(true);
  });

  it('no useShallow selector maps to freshly-allocated objects inside the callback', () => {
    const files = [
      ...readDirRecursive(path.join(srcDir, 'state'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'hooks'), '.ts'),
      ...readDirRecursive(path.join(srcDir, 'components'), '.tsx'),
    ];
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (MAP_TO_OBJECT_RE.test(content)) {
        violations.push(path.basename(file));
      }
    }
    expect(
      violations,
      `Files with object-allocating .map() inside useShallow: ${violations.join(', ')}`
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
      if (ARRAY_FROM_RE.test(content)) {
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
