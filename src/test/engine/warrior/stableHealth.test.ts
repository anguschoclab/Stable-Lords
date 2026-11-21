import { describe, it, expect } from 'vitest';
// V30-W1.1: shared weekly health tick — fatigue decay + baseline injury tick
// for all wounded, accelerated recovery only via 'recovery' assignments.
// Both the player roster and rival rosters consume this one implementation.
import { tickStableHealth } from '@/engine/warrior/stableHealth';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { InjuryData } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

const inj = (name: string, weeks: number): InjuryData =>
  ({
    id: `inj-${name}` as InjuryData['id'],
    name,
    description: name,
    severity: 'Minor',
    weeksRemaining: weeks,
    penalties: {},
  }) as InjuryData;

describe('tickStableHealth (V30 unified ruleset)', () => {
  it('decays fatigue by 25 for any warrior with fatigue > 0', () => {
    const w = makeWarrior({ fatigue: 60 });
    const out = tickStableHealth({ warriors: [w] });
    expect(out.warriors[0]!.fatigue).toBe(35);
  });

  it('clamps fatigue at 0 and leaves zero-fatigue warriors untouched', () => {
    const w = makeWarrior({ fatigue: 10 });
    const out = tickStableHealth({ warriors: [w] });
    expect(out.warriors[0]!.fatigue).toBe(0);
    const zero = makeWarrior({ fatigue: 0 });
    const out2 = tickStableHealth({ warriors: [zero] });
    expect(out2.warriors[0]).toBe(zero); // unchanged → same reference
  });

  it('ticks every wounded warrior by 1 week baseline, removing healed injuries', () => {
    const w = makeWarrior({ injuries: [inj('Bruise', 2), inj('Cut', 1)] });
    const out = tickStableHealth({ warriors: [w] });
    const injuries = out.warriors[0]!.injuries as InjuryData[];
    expect(injuries).toHaveLength(1);
    expect(injuries[0]!.name).toBe('Bruise');
    expect(injuries[0]!.weeksRemaining).toBe(1);
    expect(out.healed.get(w.id)).toEqual(['Cut']);
  });

  it('recovery-assigned warriors heal an extra (1 + healingBonus) on top of baseline', () => {
    const w = makeWarrior({ injuries: [inj('Bruise', 10)] });
    const out = tickStableHealth({
      warriors: [w],
      recoveryWarriorIds: new Set([w.id]),
      healingBonus: 2,
    });
    const injuries = out.warriors[0]!.injuries as InjuryData[];
    // baseline −1 plus active recovery −(1+2) = −4 total
    expect(injuries[0]!.weeksRemaining).toBe(6);
  });

  it('unassigned wounded warriors do NOT get accelerated healing (unified ruleset)', () => {
    const w = makeWarrior({ injuries: [inj('Bruise', 10)] });
    const out = tickStableHealth({ warriors: [w], healingBonus: 3 });
    const injuries = out.warriors[0]!.injuries as InjuryData[];
    expect(injuries[0]!.weeksRemaining).toBe(9); // baseline −1 only
  });

  it('skips inactive warriors entirely', () => {
    const w = makeWarrior({ status: 'Dead', fatigue: 50, injuries: [inj('Bruise', 5)] });
    const out = tickStableHealth({ warriors: [w] });
    expect(out.warriors[0]).toBe(w);
  });

  it('produces identical per-warrior outcomes for a player-roster and rival-roster shape', () => {
    const mk = () =>
      makeWarrior({ id: 'w1' as WarriorId, fatigue: 40, injuries: [inj('Bruise', 6)] });
    const playerOut = tickStableHealth({ warriors: [mk()] });
    const rivalOut = tickStableHealth({ warriors: [mk()] });
    expect(rivalOut.warriors[0]!.fatigue).toBe(playerOut.warriors[0]!.fatigue);
    expect(rivalOut.warriors[0]!.injuries).toEqual(playerOut.warriors[0]!.injuries);
  });
});
