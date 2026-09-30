// @vitest-environment node
/**
 * validateArenaChampions — the single-crown / vacancy-hygiene sanity hook.
 * Runs inside validateStateInvariants (soak + CI slow suites); these unit
 * tests pin each violation class.
 */
import { describe, it, expect } from 'vitest';
import { validateArenaChampions, validateStateInvariants } from '@/engine/validate/stateInvariants';
import { makeGameState, makeWarrior, makeRival } from '@/test/_fixtures/factories';
import type { ArenaTitle } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';

function title(partial: Partial<ArenaTitle> = {}): ArenaTitle {
  return {
    champion: null,
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...partial,
  };
}

const reign = (id: string) => ({
  warriorId: id as WarriorId,
  startedAbsoluteWeek: 10,
  defenses: 2,
  lastActivityWeek: 12,
});

describe('validateArenaChampions', () => {
  it('passes on a clean championship state', () => {
    const state = makeGameState({
      roster: [makeWarrior({ id: 'w1' as WarriorId })],
      arenaChampions: {
        arena_a: title({
          champion: reign('w1'),
          history: [
            {
              warriorId: 'w9' as WarriorId,
              warriorName: 'Old Champ',
              startedAbsoluteWeek: 1,
              endedAbsoluteWeek: 9,
              endReason: 'defeated',
              defenses: 3,
            },
          ],
        }),
      },
    });
    expect(validateArenaChampions(state)).toEqual([]);
    expect(validateStateInvariants(state).filter((v) => v.id === 'arena-champions')).toEqual([]);
  });

  it('flags a warrior reigning over two arenas (single-crown)', () => {
    const state = makeGameState({
      roster: [makeWarrior({ id: 'w1' as WarriorId })],
      arenaChampions: {
        arena_a: title({ champion: reign('w1') }),
        arena_b: title({ champion: reign('w1') }),
      },
    });
    const v = validateArenaChampions(state);
    expect(v.some((x) => x.message.includes('single crown'))).toBe(true);
  });

  it('flags a reigning champion in the graveyard or retired pool', () => {
    const dead = makeWarrior({ id: 'w-dead' as WarriorId });
    const ret = makeWarrior({ id: 'w-ret' as WarriorId });
    const state = makeGameState({
      graveyard: [dead],
      retired: [ret],
      arenaChampions: {
        arena_a: title({ champion: reign('w-dead') }),
        arena_b: title({ champion: reign('w-ret') }),
      },
    });
    const v = validateArenaChampions(state);
    expect(v.some((x) => x.message.includes('graveyard'))).toBe(true);
    expect(v.some((x) => x.message.includes('retired'))).toBe(true);
  });

  it('flags a reigning champion missing from every roster', () => {
    const state = makeGameState({
      arenaChampions: { arena_a: title({ champion: reign('w-ghost') }) },
    });
    const v = validateArenaChampions(state);
    expect(v.some((x) => x.message.includes('not found in any roster'))).toBe(true);
  });

  it('flags invalid status, negative counters, and bad history', () => {
    const state = makeGameState({
      arenaChampions: {
        arena_a: title({
          status: 'bogus' as never,
          refusals: -1,
          noContenderStreak: Number.NaN,
          declinedContenders: { w1: -5 },
          history: [
            {
              warriorId: 'w9' as WarriorId,
              warriorName: 'Old Champ',
              startedAbsoluteWeek: 20,
              endedAbsoluteWeek: 10,
              endReason: 'exploded' as never,
              defenses: 0,
            },
          ],
        }),
      },
    });
    const v = validateArenaChampions(state);
    expect(v.some((x) => x.message.includes('invalid title status'))).toBe(true);
    expect(v.some((x) => x.message.includes('refusals'))).toBe(true);
    expect(v.some((x) => x.message.includes('noContenderStreak'))).toBe(true);
    expect(v.some((x) => x.message.includes('declinedContenders'))).toBe(true);
    expect(v.some((x) => x.message.includes('endReason'))).toBe(true);
    expect(v.some((x) => x.message.includes('before it starts'))).toBe(true);
  });

  it('flags malformed grandChampions entries', () => {
    const state = makeGameState({
      grandChampions: [{ tournamentId: '', year: Number.NaN, warriorId: '' as WarriorId, warriorName: 'x' }],
    });
    const v = validateArenaChampions(state);
    expect(v.some((x) => x.message.includes('grandChampions'))).toBe(true);
  });

  it('rival-owned champions count as found', () => {
    const state = makeGameState({
      rivals: [makeRival({ id: 'r1' as StableId, roster: [makeWarrior({ id: 'w1' as WarriorId })] })],
      arenaChampions: { arena_a: title({ champion: reign('w1') }) },
    });
    expect(validateArenaChampions(state)).toEqual([]);
  });
});

describe('graveyard ↔ roster disjointness', () => {
  it('flags a dead warrior still on a rival roster', () => {
    const dead = makeWarrior({ id: 'dead-1' as WarriorId });
    const state = makeGameState({
      graveyard: [dead],
      rivals: [makeRival({ id: 'r1' as StableId, roster: [dead] })],
    });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'graveyard-roster-disjoint')).toBe(true);
  });

  it('flags a dead warrior still on the player roster', () => {
    const dead = makeWarrior({ id: 'dead-2' as WarriorId });
    const state = makeGameState({ graveyard: [dead], roster: [dead] });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'graveyard-roster-disjoint')).toBe(true);
  });

  it('passes when graveyard and rosters are disjoint', () => {
    const dead = makeWarrior({ id: 'dead-3' as WarriorId });
    const alive = makeWarrior({ id: 'alive-1' as WarriorId });
    const state = makeGameState({
      graveyard: [dead],
      rivals: [makeRival({ id: 'r1' as StableId, roster: [alive] })],
      arenaChampions: {},
    });
    const v = validateStateInvariants(state);
    expect(v.filter((x) => x.id === 'graveyard-roster-disjoint')).toEqual([]);
  });
});
