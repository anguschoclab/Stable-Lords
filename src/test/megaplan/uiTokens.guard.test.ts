import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectUiAudit } from '../../../scripts/ui-audit-scan.mjs';

/**
 * Design-token guard — megaplan Phase-6 ratchet.
 *
 * Baseline (2026-09-27): 90 token-violation hits / 24 files,
 * 114 motion-violation hits / 49 files, 92 screaming-copy candidates,
 * 0 rng-violations, 0 fake-chrome. Guards assert the ceilings never grow;
 * Phase 6 drives them to zero and these numbers get tightened then.
 *
 * Phase-6 tightening: screaming-copy was 100% false positives (enum literals
 * and const refs caught by a loose `(['"\`>])` trigger). The rule now only
 * counts SCREAMING_SNAKE in display positions (JSX text children, display
 * attributes) — verified zero real occurrences — so the ceiling is 0.
 *
 * V19 design-bible conformance sweep (§C): four new classes at ceiling 0 —
 *   radius-violation    0px structural radius (rounded-none/rounded-full exempt)
 *   undefined-class     glow-/animate- tokens must resolve (dead-class bait)
 *   italic-tabular      numbers never render italic
 *   tracking-overflow   letter-spacing never exceeds 0.15em
 */
const CEILINGS = {
  'token-violation': 0,
  'screaming-copy': 0,
  'motion-violation': 0,
  'rng-violation': 0,
  'fake-chrome': 0,
  'radius-violation': 0,
  'undefined-class': 0,
  'italic-tabular': 0,
  'tracking-overflow': 0,
  'dead-keyframe': 0,
} as const;

describe('megaplan: design-token guard', () => {
  const { findings } = collectUiAudit();

  for (const [cls, ceiling] of Object.entries(CEILINGS)) {
    it(`${cls}: count <= ${ceiling}`, () => {
      const rows = findings[cls] ?? [];
      expect(
        rows.length,
        `${cls} grew past baseline — ${rows
          .slice(0, 5)
          .map((r: { file: string; line: number }) => `${r.file}:${r.line}`)
          .join(', ')}`
      ).toBeLessThanOrEqual(ceiling);
    });
  }

  it('rng-violation stays at zero (RNG policy)', () => {
    expect(findings['rng-violation']).toEqual([]);
  });
});
