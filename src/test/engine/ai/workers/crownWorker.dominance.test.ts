/**
 * Stage F — dominant-player pressure.
 * When the player stable dominates the realm rankings, rival crown campaigns
 * preferentially target the thrones the PLAYER holds — dethroning the top
 * stable is worth more than taking an easier rival crown.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { assessCrownOpportunity } from '@/engine/ai/workers/crownWorker';
import { makeRival, makeWarrior, makeGameState, resetFixtureIds } from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import type { ArenaTitle, GameState, RankingEntry } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

beforeEach(() => resetFixtureIds());

function venueWarrior(id: string, arenaId: string, wins: number, losses: number) {
  return makeVenueWarrior(id, { wins, losses, arenaId });
}

function titleAt(championId: string): ArenaTitle {
  return makeArenaTitle(championId, { defenses: 2 });
}

/** Rankings where the player's warrior is #1 of ten — 'Dominant' threat. */
function dominantRankings(playerWarriorId: string): Record<WarriorId, RankingEntry> {
  const entries: Record<WarriorId, RankingEntry> = {
    [playerWarriorId as WarriorId]: { overallRank: 1, classRank: 1, compositeScore: 100 },
  };
  for (let i = 2; i <= 10; i++) {
    entries[`dummy-${i}` as WarriorId] = {
      overallRank: i,
      classRank: i,
      compositeScore: 100 - i,
    };
  }
  return entries;
}

/**
 * The contender is a modest climber at the player's arena (worse venue record
 * than the player champion → 'crown climb') but clearly outclasses the rival
 * champion at arena_b → 'winnable throne'. Neutral threat must pick arena_b;
 * only the dethrone bonus can flip the campaign to arena_a.
 */
function climber() {
  return makeWarrior({
    id: 'climber' as WarriorId,
    career: {
      wins: 6,
      losses: 5,
      kills: 0,
      byArena: {
        arena_a: { wins: 3, losses: 3, kills: 0 },
        arena_b: { wins: 3, losses: 1, kills: 0 },
      },
    },
  });
}

describe('dominant-player crown pressure', () => {
  const playerChamp = venueWarrior('player-champ', 'arena_a', 8, 2);
  const rivalChamp = venueWarrior('rival-champ', 'arena_b', 5, 10);

  function world(over: Partial<GameState> = {}): GameState {
    const championing = makeRival({ roster: [rivalChamp] });
    return makeGameState({
      week: 5,
      absoluteWeek: 5,
      roster: [playerChamp],
      rivals: [championing],
      arenaChampions: {
        arena_a: titleAt('player-champ'),
        arena_b: titleAt('rival-champ'),
      },
      ...over,
    });
  }

  it('prefers the player-held throne when the player is dominant', () => {
    const rival = makeRival({ roster: [climber()], treasury: 2000 });
    const championing = makeRival({ roster: [rivalChamp] });
    const state = world({
      rivals: [rival, championing],
      realmRankings: dominantRankings('player-champ'),
    });
    const assessment = assessCrownOpportunity(rival, state);
    expect(assessment?.arenaId).toBe('arena_a');
  });

  it('does not favor the player throne when the player is unranked (neutral threat)', () => {
    const rival = makeRival({ roster: [climber()], treasury: 2000 });
    const championing = makeRival({ roster: [rivalChamp] });
    const state = world({ rivals: [rival, championing], realmRankings: {} });
    const assessment = assessCrownOpportunity(rival, state);
    expect(assessment?.arenaId).toBe('arena_b');
  });
});
