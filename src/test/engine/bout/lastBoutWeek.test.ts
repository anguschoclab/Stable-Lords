import { describe, it, expect } from 'vitest';
// V30-W1.5: single lastBoutWeek stamp emitter shared by the weekly pipeline
// bout path and the interactive tournament resolution path.
import { stampLastBoutWeek } from '@/engine/bout/lastBoutWeek';
import { makeWarrior, makeRivalStable } from '@/test/_fixtures/factories';
import { makeAiTestState } from '@/test/_fixtures/aiTestState';
import type { WarriorId, StableId } from '@/types/shared.types';

describe('stampLastBoutWeek (V30 shared emitter)', () => {
  it('stamps both combatants in rosterUpdates regardless of ownership', () => {
    const wA = makeWarrior({ id: 'wA' as WarriorId });
    const wD = makeWarrior({ id: 'wD' as WarriorId });
    const state = makeAiTestState({ roster: [] });
    const impact = stampLastBoutWeek(state, wA, wD, 12);
    expect(impact.rosterUpdates!.get('wA' as WarriorId)).toEqual({ lastBoutWeek: 12 });
    expect(impact.rosterUpdates!.get('wD' as WarriorId)).toEqual({ lastBoutWeek: 12 });
  });

  it('rival-owned combatants also get a rivalWarriorPatches entry (anti-clobber patch, not roster rebuild)', () => {
    const playerW = makeWarrior({ id: 'pw' as WarriorId });
    const rivalW = makeWarrior({ id: 'rw' as WarriorId, stableId: 'r1' as StableId });
    const state = makeAiTestState({
      roster: [playerW],
      rivals: [makeRivalStable('r1', [rivalW])],
    });
    const impact = stampLastBoutWeek(state, playerW, rivalW, 7);
    expect(impact.rivalWarriorPatches!.get('rw' as WarriorId)).toEqual({ lastBoutWeek: 7 });
    expect(impact.rivalWarriorPatches!.has('pw' as WarriorId)).toBe(false);
  });

  it('a bout between two rival warriors patches both', () => {
    const rA = makeWarrior({ id: 'ra' as WarriorId, stableId: 'r1' as StableId });
    const rD = makeWarrior({ id: 'rd' as WarriorId, stableId: 'r2' as StableId });
    const state = makeAiTestState({
      rivals: [makeRivalStable('r1', [rA]), makeRivalStable('r2', [rD])],
    });
    const impact = stampLastBoutWeek(state, rA, rD, 3);
    expect(impact.rivalWarriorPatches!.size).toBe(2);
  });
});
