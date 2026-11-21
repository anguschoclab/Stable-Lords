import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectParityViolations } from '../../../scripts/parity-flow-scan.mjs';

/**
 * Parity-flow guard — V30 same-ruleset ratchet.
 *
 * Rival-stable weekly mechanics must route through the shared flows: the AI
 * side may not re-declare or re-invoke the per-stable primitives the
 * harmonization moved behind the unified executors (recovery, injury rolls,
 * attribute/drill training, baseline injury tick, fatigue decay, the removed
 * AI_TRAINING_EFFECTIVENESS handicap, and the -500 ledger magic cap).
 *
 * A violation means a parallel implementation crept back in — fix the call
 * site to consume the shared flow, don't allowlist it.
 */
describe('parityFlow guard (V30)', () => {
  it('no duplicated AI-side mechanics outside the shared flows', () => {
    const { violations } = collectParityViolations() as {
      violations: { file: string; line: number; rule: string; text: string }[];
    };
    expect(
      violations,
      violations
        .map((v) => `${v.file}:${v.line} [${v.rule}] ${v.text}`)
        .join('\n')
    ).toEqual([]);
  });
});
