import { describe, it, expect } from 'vitest';
import { applyBoutResults } from '@/engine/matchmaking/tournamentSelection/resolution/results';
import { SeededRNG } from '@/utils/random';
import { makeGameState, makeWarrior, makeRival, makeOwner } from '@/test/_fixtures/factories';
import { makeFightOutcome } from '@/test/_fixtures/tournamentState';
import type { StableId, WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * V27 consequence parity: the day-tick `applyBoutResults` path must deliver
 * the same post-bout consequences the `tour_*` pipeline path delivers —
 * records, lastBoutWeek stamps, progression (learns/XP), death artifacts,
 * house rules, and injuries — not just a bare career update.
 */
const mk = (id: string, stableId?: string) =>
  makeWarrior({ id: id as WarriorId, stableId: stableId as StableId });

function stateWith(wA: Warrior, wD: Warrior, over: Record<string, unknown> = {}) {
  const r1 = makeRival({
    id: 'r1' as StableId,
    owner: makeOwner({ id: 'r1' as StableId }),
    roster: [wD],
  });
  return makeGameState({
    roster: [wA],
    rivals: [r1],
    week: 10,
    absoluteWeek: 10,
    isTournamentWeek: true,
    ...over,
  });
}

describe('consequence parity — non-kill bouts', () => {
  it('stamps lastBoutWeek on both combatants like the pipeline path', () => {
    const wA = mk('wA');
    const wD = mk('wD', 'r1');
    const next = applyBoutResults({
      state: stateWith(wA, wD),
      wA,
      wD,
      outcome: makeFightOutcome('A'),
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(5),
      round: 1,
    });
    expect(next.roster[0]!.lastBoutWeek).toBe(10);
    expect(next.rivals[0]!.roster[0]!.lastBoutWeek).toBe(10);
  });

  it('rolls progressions (learns/XP) — the pipeline path grants them, day-tick must too', () => {
    // Over many seeds at least some bout must produce an XP or skill delta —
    // today the path produces zero progressions ever.
    let progressed = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const wA = mk('wA');
      const wD = mk('wD', 'r1');
      const next = applyBoutResults({
        state: stateWith(wA, wD),
        wA,
        wD,
        outcome: makeFightOutcome('A'),
        tId: 't1',
        tName: 'Cup',
        rng: new SeededRNG(seed),
        round: 1,
      });
      const a = next.roster[0]!;
      const d = next.rivals[0]!.roster[0]!;
      if ((a.xp ?? 0) > 0 || (d.xp ?? 0) > 0) progressed++;
      if (Object.keys(a.learnedSkills ?? {}).length > 0) progressed++;
      if (Object.keys(d.learnedSkills ?? {}).length > 0) progressed++;
    }
    expect(progressed).toBeGreaterThan(0);
  });

  it('applies computed fame/popularity deltas rather than a flat win-bonus', () => {
    const wA = mk('wA');
    const wD = mk('wD', 'r1');
    const next = applyBoutResults({
      state: stateWith(wA, wD, { crowdMood: 'Bloodthirsty' }),
      wA,
      wD,
      // fameFromTags reads post.tags — 'Flashy'+'bloody' yield +4 pop
      // for the winner, exercising the computed-delta path.
      outcome: { ...makeFightOutcome('A'), post: { tags: ['Flashy', 'bloody'], xpA: 0, xpD: 0 } } as any,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(9),
      round: 1,
    });
    // Popularity must move on the day-tick path — the pipeline grants
    // calculated fame/pop deltas; a flat +1 fame can never move popularity.
    expect(next.roster[0]!.popularity).not.toBe(wA.popularity);
  });
});

describe('consequence parity — deaths and house rules', () => {
  const killOutcome = { winner: 'D', by: 'Kill', minutes: 3, log: [], post: { tags: [] } } as never;

  it('emits the death obituary + unacknowledgedDeaths the pipeline path produces', () => {
    const wA = mk('wA');
    const wD = mk('wD', 'r1');
    const next = applyBoutResults({
      state: stateWith(wA, wD),
      wA,
      wD,
      outcome: killOutcome,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(11),
      round: 1,
    });
    expect(next.unacknowledgedDeaths).toContain('wA');
    const items = (next.newsletter ?? []).flatMap((n) => n.items ?? []);
    expect(items.length).toBeGreaterThan(0);
  });

  it('honors severeInjuryInsteadOfDeath — the pipeline maims instead of killing', () => {
    const wA = mk('wA');
    const wD = mk('wD', 'r1');
    const next = applyBoutResults({
      state: stateWith(wA, wD, { houseRules: { severeInjuryInsteadOfDeath: true } }),
      wA,
      wD,
      outcome: killOutcome,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(13),
      round: 1,
    });
    expect(next.graveyard ?? []).toHaveLength(0);
    expect(next.deadWarriorIds ?? []).not.toContain('wA');
    expect(next.roster[0]!.injuries.length).toBeGreaterThan(0);
  });

  it('does not create bloodfeud marks for tournament kills (feud exclusion holds)', () => {
    const wA = mk('wA');
    const wD = mk('wD', 'r1');
    const next = applyBoutResults({
      state: stateWith(wA, wD),
      wA,
      wD,
      outcome: killOutcome,
      tId: 't1',
      tName: 'Cup',
      rng: new SeededRNG(17),
      round: 1,
    });
    expect(next.bloodfeudMarks ?? []).toHaveLength(0);
  });
});
