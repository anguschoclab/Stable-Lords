/**
 * A11y — FighterConfigCard DOM ID uniqueness.
 * Pre-merge test: will FAIL on main because FighterConfigCard uses
 * hardcoded `stat-slider-${key}` IDs (no useId). After PR #781 merge,
 * useId will generate unique IDs per instance.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('FighterConfigCard DOM ID uniqueness', () => {
  it('FighterConfigCard uses useId for unique DOM IDs', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/stable/FighterConfigCard.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // After PR #781, FighterConfigCard should import and use React's useId
    expect(content).toMatch(/useId/);
  });

  it('FighterConfigCard does not use hardcoded stat-slider IDs without useId', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/stable/FighterConfigCard.tsx'
    );
    const content = readFileSync(filePath, 'utf-8');

    // If useId is present, the hardcoded IDs should be prefixed with the unique id
    // This test passes if either useId is used OR if there's no hardcoded stat-slider pattern
    const hasUseId = /useId/.test(content);
    const hasHardcodedId = /id=\{`stat-slider-\$\{key\}`\}/.test(content);

    // If useId is present, hardcoded pattern is OK (it'll be prefixed)
    // If useId is NOT present, hardcoded pattern is a bug (duplicate IDs)
    if (!hasUseId) {
      expect(hasHardcodedId).toBe(false);
    }
  });
});
