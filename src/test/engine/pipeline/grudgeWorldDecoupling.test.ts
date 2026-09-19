/**
 * Stage C.0 — G5: grudges AND rivalries must update even when the player is
 * stopped/headless. Both currently live in NarrativePass, which the pipeline
 * skips in that mode. After C.1 they live in WorldPass.
 */
import { describe, it, expect } from 'vitest';
import { runWorldPass } from '@/engine/pipeline/passes/WorldPass';
import { runNarrativePass } from '@/engine/pipeline/passes/NarrativePass';
import {
  makeGameState,
  makeRival,
  makeOwner,
  makeWarrior,
  makeFightSummary,
} from '@/test/_fixtures/factories';
import type { StableId, WarriorId } from '@/types/shared.types';

function clashingPair() {
  const aggroWarrior = makeWarrior({ id: 'aw1' as WarriorId });
  const methodWarrior = makeWarrior({ id: 'mw1' as WarriorId });
  const a = makeRival({
    id: 'rA' as StableId,
    owner: makeOwner({ id: 'ownA' as never, personality: 'Aggressive' }),
    roster: [aggroWarrior],
  });
  const b = makeRival({
    id: 'rB' as StableId,
    owner: makeOwner({ id: 'ownB' as never, personality: 'Methodical' }),
    roster: [methodWarrior],
  });
  return { a, b };
}

function killBetween(week: number) {
  return makeFightSummary({
    warriorIdA: 'aw1' as WarriorId,
    warriorIdD: 'mw1' as WarriorId,
    stableIdA: 'rA' as StableId,
    stableIdD: 'rB' as StableId,
    winner: 'A',
    by: 'Kill',
    week,
    absoluteWeek: week,
  });
}

describe('grudge/rivalry world decoupling (G5)', () => {
  it('WorldPass processes owner grudges (previously NarrativePass-only)', () => {
    const { a, b } = clashingPair();
    const state = makeGameState({
      rivals: [a, b],
      week: 5,
      absoluteWeek: 5,
      arenaHistory: [killBetween(4)],
    });
    const impact = runWorldPass(state, 6);
    const grudges = impact.ownerGrudges ?? state.ownerGrudges;
    expect(
      grudges.some(
        (g) =>
          (g.ownerIdA === 'ownA' && g.ownerIdB === 'ownB') ||
          (g.ownerIdA === 'ownB' && g.ownerIdB === 'ownA')
      )
    ).toBe(true);
  });

  it('WorldPass emits rivalries impact', () => {
    const { a, b } = clashingPair();
    const state = makeGameState({
      rivals: [a, b],
      week: 5,
      absoluteWeek: 5,
      arenaHistory: [killBetween(5)],
    });
    const impact = runWorldPass(state, 6);
    expect(impact.rivalries).toBeDefined();
  });

  it('NarrativePass no longer owns grudge processing', () => {
    const { a, b } = clashingPair();
    const state = makeGameState({
      rivals: [a, b],
      week: 5,
      absoluteWeek: 5,
      arenaHistory: [killBetween(4)],
      ownerGrudges: [],
    });
    const impact = runNarrativePass(state, 5, 6);
    // Gazette work stays; ownerGrudges must NOT be re-emitted here
    expect(impact.ownerGrudges).toBeUndefined();
  });
});
