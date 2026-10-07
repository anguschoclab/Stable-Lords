/**
 * MEGAPLAN-V10 gate — scouting focus-ring a11y contracts (PR #1022).
 *
 * Selection buttons on the scouting surfaces swapped bare `outline-none`
 * for `focus-visible:outline-none` + a `focus-visible:ring-2` indicator —
 * keyboard users keep a focus signal while mouse clicks stay clean.
 * Source-level contracts per V9 precedent (TokenCard/WarriorTargetCard).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Rival*List selection buttons were consolidated into the shared
// SelectableCard primitive (MEGAPLAN-V12 D6) — the a11y surface lives there.
const SCOUTING_FILES = [
  'src/components/ui/SelectableCard.tsx',
  'src/components/scouting/StableSelector.tsx',
  'src/components/scouting/components/WarriorSelector.tsx',
] as const;

const buttonClassNames = (src: string): string[] => {
  // className={cn('...')} template literals inside the file — grab each
  // quoted chunk so we can inspect the token set on interactive elements.
  return [...src.matchAll(/className=\{cn\(([^)]*)\)\}/g)].map((m) => m[1]!);
};

describe('scouting focus-visible a11y contracts (MEGAPLAN-V10)', () => {
  for (const f of SCOUTING_FILES) {
    it(`${f} scopes outline suppression to focus-visible and keeps a ring`, () => {
      const src = readFileSync(f, 'utf8');
      const cnCalls = buttonClassNames(src);
      expect(cnCalls.length, `${f} should style at least one cn() className`).toBeGreaterThan(0);

      // Every selection-button className that previously bare-suppressed the
      // outline must now scope it to focus-visible and provide a ring.
      for (const call of cnCalls) {
        if (!/outline-none/.test(call)) continue;
        expect(call, `${f} must scope outline suppression`).toMatch(
          /focus-visible:outline-none/
        );
        expect(call, `${f} must provide a focus-visible ring`).toMatch(/focus-visible:ring-2/);
        expect(call, `${f} must keep the primary ring color`).toMatch(
          /focus-visible:ring-primary/
        );
      }

      // No bare `outline-none` token survives anywhere in the file.
      expect(
        src.match(/(?<!focus-visible:)\boutline-none\b/)?.[0],
        `${f} must not bare-suppress outline`
      ).toBeUndefined();
    });
  }
});
