import { describe, it, expect } from 'vitest';
import { applyBoutResults } from '@/engine/matchmaking/tournamentSelection/resolution/results';
import { updateWarriorAfterBout } from '@/engine/bout/warriorStateUpdater';
import { tournamentRoundFromContractId } from '@/engine/bout/core/pairings';
import { SeededRNG } from '@/utils/random';
import { makeGameState, makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';
import { makeFightOutcome } from '@/test/_fixtures/tournamentState';
import type { StableId, WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

const mk = (id: string, stableId?: string, career = { wins: 2, losses: 1, kills: 0 }) =>
  makeWarrior({ id: id as WarriorId, stableId: stableId as StableId, career });

function twoWarriorState(wA: Warrior, wD: Warrior) {
  const r1 = makeRival({
    id: 'r1' as StableId,
    owner: makeOwner({ id: 'r1' as StableId }),
    roster: [wD],
  });
  return makeGameState({ roster: [wA], rivals: [r1], week: 10, absoluteWeek: 10 });
}

describe('fight-equivalents — unit accrual', () => {
  it('updateWarriorAfterBout grows fightEquivalents by feDelta from the W/L baseline', () => {
    const w = mk('w1'); // career 2+1 = 3 bouts fought
    const next = updateWarriorAfterBout({
      warrior: w,
      fameDelta: 1,
      popularityDelta: 0,
      isWinner: true,
      wasKilled: false,
      tags: [],
      feDelta: 1,
    });
    expect(next.fightEquivalents).toBe(4); // baseline 3 + 1 arena bout
  });

  it('feDelta 0 leaves the counter untouched (no stamp on bouts that do not accrue)', () => {
    const w = mk('w1');
    const next = updateWarriorAfterBout({
      warrior: w,
      fameDelta: 0,
      popularityDelta: 0,
      isWinner: false,
      wasKilled: false,
      tags: [],
      feDelta: 0,
    });
    expect(next.fightEquivalents ?? 0).toBe(0);
  });
});

describe('fight-equivalents — tournament accrual (odd rounds fought)', () => {
  const outcomes: [number, number][] = [
    [1, 1],
    [2, 0],
    [3, 1],
    [4, 0],
    [5, 1],
    [6, 0],
  ];
  for (const [round, expectedDelta] of outcomes) {
    it(`round ${round} fought → +${expectedDelta} FE for both combatants`, () => {
      const wA = mk('wA', undefined, { wins: 0, losses: 0, kills: 0 });
      const wD = mk('wD', 'r1', { wins: 0, losses: 0, kills: 0 });
      const state = twoWarriorState(wA, wD);
      const next = applyBoutResults({
        state,
        wA,
        wD,
        outcome: makeFightOutcome('A'),
        tId: 't1',
        tName: 'Cup',
        rng: new SeededRNG(7),
        round,
      });
      const nextA = next.roster.find((w) => w.id === 'wA')!;
      const nextD = next.rivals[0]!.roster.find((w) => w.id === 'wD')!;
      expect(nextA.fightEquivalents ?? 0).toBe(expectedDelta);
      expect(nextD.fightEquivalents ?? 0).toBe(expectedDelta);
    });
  }

  it('career W/L keeps counting every tourney bout regardless of round parity', () => {
    const wA = mk('wA', undefined, { wins: 0, losses: 0, kills: 0 });
    const wD = mk('wD', 'r1', { wins: 0, losses: 0, kills: 0 });
    const state = twoWarriorState(wA, wD);
    const next = applyBoutResults({
      state,
      wA,
      wD,
      outcome: makeFightOutcome('A'),
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(7),
      round: 2, // even round — no FE, but the record still counts
    });
    const nextA = next.roster.find((w) => w.id === 'wA')!;
    expect(nextA.career.wins).toBe(1);
    expect(nextA.fightEquivalents ?? 0).toBe(0);
  });
});

describe('tour_* contractId round parsing', () => {
  it('parses the round segment from synthetic tournament contractIds', () => {
    expect(tournamentRoundFromContractId('tour_t-rookies-spring-y1-w10_3_0')).toBe(3);
    expect(tournamentRoundFromContractId('tour_t1_1_0')).toBe(1);
    expect(tournamentRoundFromContractId('tour_abc_6_12')).toBe(6);
  });
  it('returns undefined for non-tournament or malformed ids', () => {
    expect(tournamentRoundFromContractId('offer-123')).toBeUndefined();
    expect(tournamentRoundFromContractId('tour_short')).toBeUndefined();
    expect(tournamentRoundFromContractId(undefined)).toBeUndefined();
  });
});
