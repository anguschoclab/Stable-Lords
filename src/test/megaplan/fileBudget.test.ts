import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectSizes } from '../../../scripts/function-length.mjs';

/**
 * File/function size budgets — megaplan ratchet guard.
 *
 * Ceilings start at post-baseline reality and tighten as Phase-3 lands.
 * Exemptions are explicit tokens, not silent drift:
 *   EXEMPT_FILES — homogeneous data/registries where bulk is the point.
 */
const FILE_LINE_CEILING = 1600;
const DATA_FILE_CEILING = 1300;
const FN_LINE_CEILING = 120; // ratcheted to target — 0 violations at lock-in

const EXEMPT_FILES = new Set([
  'src/routeTree.gen.ts', // generated
  'src/data/names/warriorNames.ts', // homogeneous name data (V10)
]);

const isDataFile = (f: string) =>
  f.startsWith('src/data/') || f.startsWith('src/lore/') || f.includes('/names/');

describe('megaplan: file & function budgets', () => {
  const { files, functions } = collectSizes();

  it('no source file exceeds the ceiling (data files get the data ceiling)', () => {
    const violations = files.source.filter(
      (f: { file: string; lines: number }) =>
        !EXEMPT_FILES.has(f.file) &&
        f.lines > (isDataFile(f.file) ? DATA_FILE_CEILING : FILE_LINE_CEILING)
    );
    expect(
      violations.map((v: { file: string; lines: number }) => `${v.file} (${v.lines})`),
      'files over budget — split or add explicit exemption'
    ).toEqual([]);
  });

  it('no function exceeds the length ceiling', () => {
    const violations = functions.filter((f: { len: number }) => f.len > FN_LINE_CEILING);
    expect(
      violations.map((v: { file: string; name: string; len: number }) => `${v.file}::${v.name} (${v.len})`),
      `functions over ${FN_LINE_CEILING} lines`
    ).toEqual([]);
  });

  it('counts stay non-decreasingly-better than baseline (201 fns >80, 2 files >800)', () => {
    // Ratchet: ceilings only ever tighten. Update numbers DOWN as phases land.
    expect(functions.filter((f: { len: number }) => f.len > 80).length).toBeLessThanOrEqual(201);
    expect(files.source.filter((f: { lines: number }) => f.lines > 800).length).toBeLessThanOrEqual(2);
  });
});
