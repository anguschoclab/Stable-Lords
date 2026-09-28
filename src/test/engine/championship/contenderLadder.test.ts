/**
 * Stage G — title posture surfacing.
 * ArenaDetail needs the *queue* behind the throne, not just its holder:
 * `topContenders` exposes the same eligible-contender ordering the
 * championship pass uses to book title bouts — never a fabricated list.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { topContenders } from '@/engine/championship/arenaChampionship';
import {
  makeWarrior,
  makeGameState,
  resetFixtureIds,
} from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

const ARENA = 'standard_arena';

function venueWarrior(id: string, wins: number, losses = 0) {
  return makeVenueWarrior(id, { wins, losses, arenaId: ARENA });
}

function titleAt(championId: string | null): ArenaTitle {
  return makeArenaTitle(championId);
}

describe('topContenders', () => {
  it('returns the eligible ladder ordered best-first with venue records', () => {
    const best = venueWarrior('w_best', 6);
    const mid = venueWarrior('w_mid', 4, 1);
    const worst = venueWarrior('w_worst', 3, 3);
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [best, mid, worst],
      arenaChampions: { [ARENA]: titleAt('champ_x') },
    });
    const ladder = topContenders(state, ARENA, 3);
    expect(ladder.map((c) => c.warrior.id)).toEqual(['w_best', 'w_mid', 'w_worst']);
    expect(ladder[0]!.wins).toBe(6);
  });

  it('excludes the reigning champion and sub-MIN_BOUTS warriors', () => {
    const champ = venueWarrior('reigning', 10);
    const contender = venueWarrior('w1', 4);
    const green = makeWarrior({ id: 'green' as WarriorId, career: { wins: 0, losses: 0, kills: 0 } });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [champ, contender, green],
      arenaChampions: { [ARENA]: titleAt('reigning') },
    });
    const ladder = topContenders(state, ARENA, 5);
    expect(ladder.map((c) => c.warrior.id)).toEqual(['w1']);
  });

  it('honors the declined-contender cooldown', () => {
    const declined = venueWarrior('w_dec', 6);
    const other = venueWarrior('w_other', 4);
    const title = titleAt('champ_x');
    title.declinedContenders = { ['w_dec' as WarriorId]: 99 };
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [declined, other],
      arenaChampions: { [ARENA]: title },
    });
    const ladder = topContenders(state, ARENA, 5);
    expect(ladder.map((c) => c.warrior.id)).toEqual(['w_other']);
  });

  it('caps at the requested depth', () => {
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [
        venueWarrior('a', 8),
        venueWarrior('b', 6),
        venueWarrior('c', 5),
        venueWarrior('d', 4),
      ],
      arenaChampions: { [ARENA]: titleAt(null) },
    });
    expect(topContenders(state, ARENA, 2)).toHaveLength(2);
  });
});
