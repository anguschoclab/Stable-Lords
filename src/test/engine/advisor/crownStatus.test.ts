/**
 * Stage G — advisor crown card data.
 * computeStableCouncilReport stamps each card with the warrior's real crown
 * standing: which ladder they're ranked on and their position — the same
 * contender index rivals campaign against, never a fabricated label.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { computeStableCouncilReport } from '@/engine/advisor/stableCouncilService';
import { makeWarrior, makeGameState, resetFixtureIds } from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

const ARENA = 'standard_arena';
const ARENA_B = 'brass_ring';

function venueWarrior(id: string, arenaId: string, wins: number, losses = 0) {
  return makeVenueWarrior(id, { wins, losses, arenaId, age: 24 });
}

function titleAt(championId: string | null, over: Partial<ArenaTitle> = {}): ArenaTitle {
  return makeArenaTitle(championId, over);
}

describe('advisor crown standing', () => {
  it('reports the contender rank and arena for a ranked warrior', () => {
    // w1 is the stronger contender; w2 trails on wins → w2 should rank #2.
    const w1 = venueWarrior('w1', ARENA, 6);
    const w2 = venueWarrior('w2', ARENA, 4);
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [w1, w2],
      arenaChampions: { [ARENA]: titleAt('someone_else') },
      boutOffers: {},
    });
    const report = computeStableCouncilReport(state);
    const card = report.cards.find((c) => c.warriorId === w2.id);
    expect(card?.crownStanding?.arenaId).toBe(ARENA);
    expect(card?.crownStanding?.rank).toBe(2);
  });

  it('picks the best rank when a warrior contends at multiple arenas', () => {
    // Ranked #2 at standard_arena (w1 leads), #1 at brass_ring → reports
    // brass_ring as the best crown path.
    const w1 = venueWarrior('w1', ARENA, 6);
    const climber = makeWarrior({
      id: 'wx' as WarriorId,
      age: 24,
      career: {
        wins: 7,
        losses: 0,
        kills: 0,
        byArena: {
          [ARENA]: { wins: 3, losses: 0, kills: 0 },
          [ARENA_B]: { wins: 4, losses: 0, kills: 0 },
        },
      },
    });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [w1, climber],
      arenaChampions: { [ARENA]: titleAt('c1'), [ARENA_B]: titleAt('c2') },
      boutOffers: {},
    });
    const report = computeStableCouncilReport(state);
    const card = report.cards.find((c) => c.warriorId === 'wx');
    expect(card?.crownStanding?.arenaId).toBe(ARENA_B);
    expect(card?.crownStanding?.rank).toBe(1);
  });

  it('marks a reigning champion as defending, not climbing', () => {
    const champ = venueWarrior('champ', ARENA, 8);
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [champ],
      arenaChampions: { [ARENA]: titleAt('champ') },
      boutOffers: {},
    });
    const report = computeStableCouncilReport(state);
    const card = report.cards.find((c) => c.warriorId === 'champ');
    expect(card?.crownStanding?.arenaId).toBe(ARENA);
    expect(card?.crownStanding?.isChampion).toBe(true);
  });

  it('omits crown standing for warriors on no ladder', () => {
    const green = makeWarrior({ id: 'w1' as WarriorId, age: 20 });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [green],
      arenaChampions: { [ARENA]: titleAt(null) },
    });
    const report = computeStableCouncilReport(state);
    const card = report.cards.find((c) => c.warriorId === 'w1');
    expect(card?.crownStanding).toBeUndefined();
  });
});
