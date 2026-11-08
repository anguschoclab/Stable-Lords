/**
 * Canon: a warrior's will gates exhaustion collapse — when a gassed-out,
 * hurt fighter would be stopped, a WL + killDesire check lets them refuse
 * the stoppage and fight on under fatigue (Noblish Island doctrine).
 */
import { describe, it, expect } from 'vitest';
import { applyEnduranceCosts } from '@/engine/combat/resolution/exchangeHelpers/mechanics/enduranceCosts';
import { rollWillCheck, willCheckChance } from '@/engine/combat/mechanics/willChecks';
import { makeFighterState, makeResolutionContext } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import type { CombatEvent } from '@/types/combat.types';

const attrs = (WL: number) => ({ ST: 10, CN: 10, SZ: 10, WT: 10, WL, SP: 10, DF: 10 });

/** Drive the real hook: A is already gassed and beaten; D is fresh. */
const endsInStoppage = (wl: number, seed: number) => {
  const rng = new SeededRNG(seed);
  const ctx = makeResolutionContext({ rng: () => rng.next() });
  const events: CombatEvent[] = [];
  const fA = makeFighterState({ endurance: 0, hp: 10, maxHp: 100, attributes: attrs(wl) });
  const fD = makeFighterState({ label: 'D' });
  applyEnduranceCosts({
    events,
    ctx,
    fA,
    fD,
    aGoesFirst: true,
    curAttOE: 5,
    curAttAL: 5,
    curAttWepReq: { endurancePenalty: 1 },
    curDefWepReq: { endurancePenalty: 1 },
    OE_D: 5,
    AL_D: 5,
    OE_A: 5,
    AL_A: 5,
  });
  return events.some((e) => e.type === 'BOUT_END');
};

describe('willCheckChance / rollWillCheck (pure check)', () => {
  it('high WL passes a mid roll, low WL fails it', () => {
    expect(rollWillCheck(21, 5, () => 0.5)).toBe(true);
    expect(rollWillCheck(3, 5, () => 0.5)).toBe(false);
  });
  it('chance clamps to [0, 1]', () => {
    expect(willCheckChance(3, 1)).toBe(0);
    expect(willCheckChance(25, 10)).toBe(1);
  });
  it('killDesire leans the check — a killer digs deeper', () => {
    expect(willCheckChance(10, 10)).toBeGreaterThan(willCheckChance(10, 1));
  });
});

describe('will check gates exhaustion stoppage', () => {
  it('high-WL fighters resist the stoppage far more often', () => {
    const trials = 200;
    let wl3Ends = 0;
    let wl21Ends = 0;
    for (let seed = 1; seed <= trials; seed++) {
      if (endsInStoppage(3, seed)) wl3Ends++;
      if (endsInStoppage(21, seed)) wl21Ends++;
    }
    expect(wl21Ends / trials).toBeLessThan(wl3Ends / trials - 0.4);
  });
  it('low-WL fighters are almost always stopped', () => {
    const trials = 200;
    let ends = 0;
    for (let seed = 1; seed <= trials; seed++) {
      if (endsInStoppage(3, seed)) ends++;
    }
    expect(ends / trials).toBeGreaterThan(0.8);
  });
});
