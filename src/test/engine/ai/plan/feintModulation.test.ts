/**
 * Stage D — AI feint modulation (N3). `feintTendency` already exists and
 * `runFeint` is live; the AI only ever inherited the WT-derived baseline.
 * `aiPlanForWarrior` now shapes it by personality: deceptive stables
 * (Showman, Tactician) feint more, measured ones (Methodical, Pragmatic)
 * less, clamped to [0,10]. Player-authored plans never pass through this
 * generator — their value is untouchable by construction.
 */
import { describe, it, expect } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { defaultPlanForWarrior } from '@/engine/bout/planDefaults';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { OwnerPersonality } from '@/types/state.types';

const withWT = (wt: number) =>
  makeWarrior({ attributes: { ST: 10, CN: 10, SZ: 10, WT: wt, WL: 10, SP: 10, DF: 10 } });

/** WT 17 → baseline feintTendency = floor(3 * 1.5) = 4. */
const cunningWarrior = () => withWT(17);

const planFor = (personality: OwnerPersonality) =>
  aiPlanForWarrior({ w: cunningWarrior(), personality, philosophy: 'Opportunist' });

describe('AI feint modulation', () => {
  it('deceptive personalities raise the inherited baseline', () => {
    const base = defaultPlanForWarrior(cunningWarrior()).feintTendency ?? 0;
    expect(base).toBeGreaterThan(0);
    for (const p of ['Showman', 'Tactician'] as const) {
      expect(planFor(p).feintTendency).toBeGreaterThan(base);
    }
  });

  it('measured personalities lower the inherited baseline', () => {
    const base = defaultPlanForWarrior(cunningWarrior()).feintTendency ?? 0;
    for (const p of ['Methodical', 'Pragmatic'] as const) {
      expect(planFor(p).feintTendency).toBeLessThan(base);
    }
  });

  it('is clamped to [0,10] in both directions', () => {
    // WT 21 → baseline 10 — a deceptive stable cannot push past the cap.
    const showman = aiPlanForWarrior({ w: withWT(21), personality: 'Showman', philosophy: 'Opportunist' });
    expect(showman.feintTendency).toBeLessThanOrEqual(10);

    // WT 15 → baseline 1 — a measured stable floors at 0, never negative.
    const methodical = aiPlanForWarrior({ w: withWT(15), personality: 'Methodical', philosophy: 'Opportunist' });
    expect(methodical.feintTendency).toBeGreaterThanOrEqual(0);
  });

  it('low-WT fighters stay at zero regardless of personality', () => {
    const dull = withWT(10);
    const showman = aiPlanForWarrior({ w: dull, personality: 'Showman', philosophy: 'Opportunist' });
    // Feint needs WT ≥ 15 to fire — boosting a dull fighter's tendency is
    // wasted ink; the modulation only shapes an existing aptitude.
    expect(showman.feintTendency ?? 0).toBe(0);
  });
});
