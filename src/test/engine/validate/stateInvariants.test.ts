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
      grandChampions: [
        { tournamentId: '', year: Number.NaN, warriorId: '' as WarriorId, warriorName: 'x' },
      ],
    });
    const v = validateArenaChampions(state);
    expect(v.some((x) => x.message.includes('grandChampions'))).toBe(true);
  });

  it('rival-owned champions count as found', () => {
    const state = makeGameState({
      rivals: [
        makeRival({ id: 'r1' as StableId, roster: [makeWarrior({ id: 'w1' as WarriorId })] }),
      ],
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

describe('dead-registry coverage — deadWarriorIds ∪ graveyard', () => {
  it('flags a registered-dead id sitting on the player roster', () => {
    const w = makeWarrior({ id: 'dx-1' as WarriorId });
    const state = makeGameState({ deadWarriorIds: [w.id], roster: [w] });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-id-in-active-store')).toBe(true);
  });

  it('flags a registered-dead id on a rival roster', () => {
    const w = makeWarrior({ id: 'dx-2' as WarriorId });
    const state = makeGameState({
      deadWarriorIds: [w.id],
      rivals: [makeRival({ id: 'r1' as StableId, roster: [w] })],
    });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-id-in-active-store')).toBe(true);
  });

  it('flags a registered-dead id in the free-agent pool', () => {
    const w = makeWarrior({ id: 'dx-3' as WarriorId });
    const state = makeGameState({ deadWarriorIds: [w.id], freeAgents: [w as never] });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-id-in-active-store')).toBe(true);
  });

  it('flags a registered-dead id in the recruit pool', () => {
    const w = makeWarrior({ id: 'dx-4' as WarriorId });
    const state = makeGameState({ deadWarriorIds: [w.id], recruitPool: [w as never] });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-id-in-active-store')).toBe(true);
  });

  it('flags a registered-dead id queued as a legacy founder', () => {
    const w = makeWarrior({ id: 'dx-5' as WarriorId });
    const state = makeGameState({
      deadWarriorIds: [w.id],
      legacyFounderQueue: [w],
    });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-id-in-active-store')).toBe(true);
  });

  it('flags a registered-dead id inside tournament participants', () => {
    const w = makeWarrior({ id: 'dx-6' as WarriorId });
    const state = makeGameState({
      deadWarriorIds: [w.id],
      tournaments: [
        { id: 't1', participants: [w], completed: false, bracket: [] } as never,
      ],
    });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-id-in-active-store')).toBe(true);
  });

  it('does not flag dead ids that are only in the graveyard or stamped Dead', () => {
    const w = makeWarrior({ id: 'dx-7' as WarriorId, status: 'Dead' as never });
    const state = makeGameState({
      deadWarriorIds: [w.id],
      graveyard: [w],
      tournaments: [
        {
          id: 't1',
          participants: [{ ...w, status: 'Dead' } as never],
          completed: true,
          bracket: [],
        } as never,
      ],
    });
    const v = validateStateInvariants(state);
    expect(v.filter((x) => x.id === 'dead-id-in-active-store')).toEqual([]);
  });
});

describe('graveyard uniqueness and retired overlap', () => {
  it('flags duplicate warrior ids inside the graveyard', () => {
    const w = makeWarrior({ id: 'dup-1' as WarriorId });
    const state = makeGameState({ graveyard: [w, { ...w }] });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'graveyard-unique-ids')).toBe(true);
  });

  it('flags an id present in both graveyard and retired pools', () => {
    const w = makeWarrior({ id: 'ov-1' as WarriorId });
    const state = makeGameState({
      graveyard: [w],
      retired: [{ ...w, status: 'Retired' as never }],
      deadWarriorIds: [w.id],
    });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'dead-retired-overlap')).toBe(true);
  });
});

describe('stale signed offers', () => {
  it('flags a Signed offer that references a dead warrior', () => {
    const dead = makeWarrior({ id: 'off-dead' as WarriorId });
    const alive = makeWarrior({ id: 'off-alive' as WarriorId });
    const state = makeGameState({
      roster: [alive],
      graveyard: [dead],
      deadWarriorIds: [dead.id],
      boutOffers: {
        o1: {
          id: 'o1',
          status: 'Signed',
          warriorIds: [alive.id, dead.id],
          boutWeek: 5,
        } as never,
      },
    });
    const v = validateStateInvariants(state);
    expect(v.some((x) => x.id === 'stale-signed-offer')).toBe(true);
  });

  it('ignores signed offers whose warriors are all alive and rostered', () => {
    const a = makeWarrior({ id: 'off-a' as WarriorId });
    const b = makeWarrior({ id: 'off-b' as WarriorId });
    const state = makeGameState({
      roster: [a],
      rivals: [makeRival({ id: 'r1' as StableId, roster: [b] })],
      boutOffers: {
        o1: {
          id: 'o1',
          status: 'Signed',
          warriorIds: [a.id, b.id],
          boutWeek: 5,
        } as never,
      },
    });
    const v = validateStateInvariants(state);
    expect(v.filter((x) => x.id === 'stale-signed-offer')).toEqual([]);
  });
});
