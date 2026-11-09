/**
 * V26 parity — every world-minted roster must obey the same build-quality
 * rules the player's recruit pool obeys:
 *
 *  - Drake DA floors (ST ≥ 7, WL ≥ 7): `biasedAttrs` starts every stat at 3
 *    and spends a 49-point pool with no floor, so it can mint DOA builds
 *    (ST/WL 3–6) that the player's generator is forbidden from creating.
 *  - Fighter-concept steering: `biasedAttrs` ignores the template/style
 *    concept means entirely — builds don't reflect what the stable fielded.
 *  - Per-attribute potential: `makeWarrior` never calls `generatePotential`,
 *    so world-minted warriors have uncapped headroom forever.
 *
 * Covers all mint paths: initial world seed, bankruptcy successors, and the
 * weekly floor refill (all three funnel through `generateRivalStables` →
 * `biasedAttrs` → `createRivalWarrior` → `makeWarrior`).
 *
 * Live since Phase 3 — floors / concept blend / potential.
 */
import { describe, it, expect } from 'vitest';
import { generateRivalStables } from '@/engine/rivals/rivalStableFactory';
import { biasedAttrs } from '@/engine/rivals/rivalWarriorFactory';
import { mintSuccessorStable } from '@/engine/pipeline/passes/rivalStableShard/successorMint';
import { mintFloorRefill } from '@/engine/pipeline/passes/RivalStrategyPass/churn';
import { makeGameState, makeRival } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import { DA_ST_FLOOR, DA_WL_FLOOR } from '@/data/designDoctrine';
import { WORLD_RIVAL_FLOOR } from '@/constants/world';
import { ATTRIBUTE_KEYS, FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { Attributes } from '@/types/shared.types';

/** Post-Phase-3 signature — `style` steers the concept-mean blend. */
const biased = biasedAttrs as unknown as (
  rng: () => number,
  bias: Record<string, number>,
  catchupPool?: number,
  style?: FightingStyle
) => Attributes;

const expectBuildQuality = (roster: Warrior[]) => {
  expect(roster.length).toBeGreaterThan(0);
  for (const w of roster) {
    expect(w.attributes.ST, `${w.name} ST below DA floor`).toBeGreaterThanOrEqual(DA_ST_FLOOR);
    expect(w.attributes.WL, `${w.name} WL below DA floor`).toBeGreaterThanOrEqual(DA_WL_FLOOR);
    expect(w.potential, `${w.name} missing potential`).toBeDefined();
    for (const k of ATTRIBUTE_KEYS) {
      expect(w.potential![k], `${w.name} potential.${k} below attribute`).toBeGreaterThanOrEqual(
        w.attributes[k]
      );
    }
  }
};

describe('generateRivalStables — minted build quality', () => {
  it('mints no DOA builds and carries potential on every warrior', () => {
    const rivals = generateRivalStables(8, 12345, 0);
    for (const r of rivals) expectBuildQuality(r.roster);
  });
});

describe('mid-game mint paths share the quality gate', () => {
  it('bankruptcy successors mint legal builds with potential', () => {
    const state = makeGameState({ rivals: [], absoluteWeek: 50 });
    const s = mintSuccessorStable(state, 0);
    expect(s).toBeDefined();
    expectBuildQuality(s!.roster);
  });

  it('weekly floor refills mint legal builds with potential', () => {
    const state = makeGameState({ rivals: [], absoluteWeek: 51 });
    // One short of the floor so exactly one refill mint runs.
    const fillers = Array.from({ length: WORLD_RIVAL_FLOOR - 1 }, () => makeRival());
    const minted = mintFloorRefill(state, fillers, 52);
    expect(minted.length).toBe(1);
    for (const s of minted) expectBuildQuality(s.roster);
  });
});

describe('biasedAttrs — doctrine parity', () => {
  it('never allocates below the DA floors, even under a hostile bias map', () => {
    const rng = new SeededRNG(99);
    for (let i = 0; i < 200; i++) {
      const attrs = biased(() => rng.next(), { SP: 20, SZ: 20 });
      expect(attrs.ST).toBeGreaterThanOrEqual(DA_ST_FLOOR);
      expect(attrs.WL).toBeGreaterThanOrEqual(DA_WL_FLOOR);
    }
  });

  it('steers toward the style concept mean when a style is supplied', () => {
    // TotalParry is a high-WL/low-SP concept; passing the style should lift
    // mean WL relative to the same draws with no steering.
    const draws = (style?: FightingStyle) => {
      const rng = new SeededRNG(7);
      return Array.from({ length: 120 }, () => biased(() => rng.next(), {}, 0, style));
    };
    const styled = draws(FightingStyle.TotalParry);
    const blind = draws();
    const mean = (rows: { WL: number }[]) =>
      rows.reduce((s, a) => s + a.WL, 0) / rows.length;
    expect(mean(styled)).toBeGreaterThan(mean(blind));
  });
});
