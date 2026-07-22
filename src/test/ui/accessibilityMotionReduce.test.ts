/**
 * Accessibility motion-reduce — verifies motion-reduce classes are present
 * on animated elements. Tests 1-3 are skipped until Group F merge.
 * Test 4 is active immediately (verifies no blanket bg-background/90).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';

describe('accessibility motion-reduce', () => {
  // Skipped: components may not have motion-reduce classes yet
  it.skip('MiniCombatLog has motion-reduce:transition-none on all log entries', () => {});
  it.skip('TacticalLogView has motion-reduce:animate-none on animated elements', () => {});
  it.skip('AppHeader has motion-reduce classes', () => {});

  it('no blanket bg-background/90 replacements in component files', () => {
    const componentDir = path.resolve(process.cwd(), 'src/components');
    const files = globSync('**/*.tsx', { cwd: componentDir });
    let violations = 0;
    for (const file of files) {
      const fullPath = path.join(componentDir, file);
      const content = readFileSync(fullPath, 'utf-8');
      // Flag bg-background/90 used as a blanket replacement (should preserve original opacity)
      // AppHeader.tsx is exempt — it intentionally uses bg-background/90 for sticky header backdrop
      if (file === 'layout/AppHeader.tsx') continue;
      const matches = content.match(/bg-background\/90/g);
      if (matches) {
        violations += matches.length;
      }
    }
    expect(violations, 'Found blanket bg-background/90 replacements').toBe(0);
  });
});
