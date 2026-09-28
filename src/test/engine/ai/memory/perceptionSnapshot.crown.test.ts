// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { makeRival, makeGameState } from '@/test/_fixtures/factories';
import { makeVenueWarrior, makeArenaTitle } from '@/test/_fixtures/arenaTitle';
import type { ArenaTitle } from '@/types/state.types';

const ARENA_A = 'standard_arena';
const ARENA_B = 'mudpit_arena';

function venueWarrior(id: string, arenaId: string, rec: { wins: number; losses: number }) {
  return makeVenueWarrior(id, { wins: rec.wins, losses: rec.losses, arenaId });
}

function titleAt(championId: string | null, over: Partial<ArenaTitle> = {}): ArenaTitle {
  return makeArenaTitle(championId, over);
}

describe('buildContenderIndex', () => {
  it('ranks eligible venue veterans per arena', () => {
    const w1 = venueWarrior('w1', ARENA_A, { wins: 5, losses: 0 });
    const w2 = venueWarrior('w2', ARENA_A, { wins: 3, losses: 2 });
    const state = makeGameState({
      rivals: [makeRival({ roster: [w1, w2] })],
      arenaChampions: { [ARENA_A]: titleAt(null) },
    });
    const index = buildContenderIndex(state, 5);
    expect(index.get(ARENA_A)).toEqual(['w1', 'w2']);
  });

  it('excludes ineligible warriors (too few venue bouts, cooling down, crowned)', () => {
    const eligible = venueWarrior('w1', ARENA_A, { wins: 3, losses: 0 });
    const green = venueWarrior('w2', ARENA_A, { wins: 1, losses: 0 });
    const cooling = venueWarrior('w3', ARENA_A, { wins: 4, losses: 0 });
    const crowned = venueWarrior('w4', ARENA_A, { wins: 6, losses: 0 });
    const state = makeGameState({
      week: 5,
      absoluteWeek: 5,
      rivals: [makeRival({ roster: [eligible, green, cooling, crowned] })],
      arenaChampions: {
        [ARENA_A]: titleAt(null, { declinedContenders: { w3: 20 } }),
        [ARENA_B]: titleAt('w4'),
      },
    });
    const index = buildContenderIndex(state, 5);
    expect(index.get(ARENA_A)).toEqual(['w1']);
  });
});

describe('PerceptionSnapshot — crown indexes', () => {
  it('exposes a per-arena contender index built once per tick', () => {
    const w1 = venueWarrior('w1', ARENA_A, { wins: 4, losses: 0 });
    const state = makeGameState({
      rivals: [makeRival({ roster: [w1] })],
      arenaChampions: { [ARENA_A]: titleAt(null) },
    });
    const perception = buildPerceptionSnapshot(state);
    expect(perception.contenderIndexByArena.get(ARENA_A)).toEqual(['w1']);
  });

  it('keeps the champion lookup alongside the contender index', () => {
    const champ = venueWarrior('champ', ARENA_A, { wins: 7, losses: 1 });
    const contender = venueWarrior('w1', ARENA_A, { wins: 4, losses: 0 });
    const state = makeGameState({
      rivals: [makeRival({ roster: [champ, contender] })],
      arenaChampions: { [ARENA_A]: titleAt('champ') },
    });
    const perception = buildPerceptionSnapshot(state);
    expect(perception.championByArena.get(ARENA_A)).toBe('champ');
    expect(perception.contenderIndexByArena.get(ARENA_A)).toEqual(['w1']);
  });
});
