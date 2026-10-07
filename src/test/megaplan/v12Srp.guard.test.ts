import { describe, it, expect } from 'vitest';
// @ts-expect-error — .mjs scanner has no types
import { collectSizes } from '../../../scripts/function-length.mjs';

/**
 * MEGAPLAN-V12 single-responsibility spec (test-first, red until Phase 3):
 *
 * S1: `emitWarriorBid` in boutBidding/generation.ts packs six intent
 * strategies (VENDETTA, CROWN_CAMPAIGN, challenged-response, RECOVERY,
 * EXPANSION, default) into one 83-line function. The decomposition contract:
 * per-intent emitters exist and no function in the module exceeds the
 * single-strategy budget.
 */

const GENERATION = 'src/engine/ai/workers/competitionWorker/boutBidding/generation.ts';
const INTENT_EMITTER_BUDGET = 60;

interface FnRec {
  file: string;
  name: string;
  len: number;
}

describe('megaplan V12: single-responsibility decomposition', () => {
  const { functions } = collectSizes() as { functions: FnRec[] };
  const genFns = functions.filter((f) => f.file === GENERATION);

  it('S1: emitWarriorBid is decomposed — no function in generation.ts exceeds the per-strategy budget', () => {
    const over = genFns.filter((f) => f.len > INTENT_EMITTER_BUDGET);
    expect(
      over.map((f) => `${f.name} (${f.len})`),
      `functions over ${INTENT_EMITTER_BUDGET} lines in generation.ts — split per-intent emitters`
    ).toEqual([]);
  });
});
