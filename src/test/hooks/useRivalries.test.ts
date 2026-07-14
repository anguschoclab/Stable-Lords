// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRivalriesList, useRivalWarriorStable } from '@/hooks/useRivalries';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';

import { FightingStyle } from '@/types/shared.types';
import '@/test/_setup/setup';

type RivalryStateSlice = Parameters<typeof useRivalriesList>[0];

function makeWarrior(id: string, overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: id as Warrior['id'],
    name: `Warrior ${id}`,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
    ...overrides,
  } as Warrior;
}

function makeFight(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'f1' as any,
    week: 10,
    title: 'Test Bout',
    warriorIdA: 'p1' as any,
    warriorIdD: 'r1' as any,
    winner: 'A',
    by: 'KO',
    styleA: 'ST',
    styleD: 'BA',
    ...overrides,
  } as FightSummary;
}

function makeState(overrides: Partial<RivalryStateSlice> = {}): RivalryStateSlice {
  return {
    roster: [],
    graveyard: [],
    rivals: [],
    arenaHistory: [],
    week: 10,
    ...overrides,
  };
}

describe('useRivalriesList', () => {
  it('returns empty array when no arena history', () => {
    const state = makeState({ roster: [makeWarrior('p1')], rivals: [] });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = new Map();

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current).toEqual([]);
  });

  it('returns empty array when no player-involved bouts', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: [
        makeFight({
          warriorIdA: 'r1' as any,
          warriorIdD: 'r2' as any,
          winner: 'A',
        }),
      ],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current).toEqual([]);
  });

  it('correctly tracks player wins and losses', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: [
        makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A' }),
        makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'D' }),
      ],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.playerWins).toBe(1);
    expect(result.current[0]!.playerLosses).toBe(1);
    expect(result.current[0]!.bouts).toBe(2);
  });

  it('intensity = 1 when no kills and bouts < 5', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: [makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A' })],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current[0]!.intensity).toBe(1);
  });

  it('intensity includes kills contribution', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: [
        makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A', by: 'Kill' }),
        makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A', by: 'Kill' }),
      ],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current[0]!.intensity).toBe(4); // 2 kills * 2 = 4, min clamp 1, max 5
  });

  it('intensity caps kill contribution at 4', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: Array.from({ length: 5 }, () =>
        makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A', by: 'Kill' })
      ),
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current[0]!.intensity).toBe(5); // 5 kills * 2 = 10 capped to 4, +1 for bouts >= 5, total 5
  });

  it('intensity includes bouts >= 5 contribution', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: Array.from({ length: 5 }, () =>
        makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A' })
      ),
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current[0]!.intensity).toBe(1); // 0 kills + 1 for bouts >= 5, clamped to [1,5]
  });

  it('sorts by intensity descending', () => {
    const state = makeState({
      roster: [makeWarrior('p1'), makeWarrior('p2')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
        {
          owner: { id: 'owner2', stableName: 'Steel Lions' },
          roster: [makeWarrior('r2')],
        } as any,
      ],
      arenaHistory: [
        ...Array.from({ length: 5 }, () =>
          makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A' })
        ),
        makeFight({ warriorIdA: 'p2' as any, warriorIdD: 'r2' as any, winner: 'A', by: 'Kill' }),
      ],
    });
    const rosterIds = new Set([state.roster[0]!.id, state.roster[1]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current).toHaveLength(2);
    expect(result.current[0]!.stableName).toBe('Steel Lions'); // intensity 4 (kill 2*2) vs 2 (bouts >=5)
    expect(result.current[1]!.stableName).toBe('Iron Wolves');
  });

  it('correctly records kill entries with killer and victim names', () => {
    const state = makeState({
      roster: [makeWarrior('p1', { name: 'PlayerOne' })],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1', { name: 'RivalOne' })],
        } as any,
      ],
      arenaHistory: [
        makeFight({
          warriorIdA: 'p1' as any,
          warriorIdD: 'r1' as any,
          winner: 'A',
          by: 'Kill',
          week: 10,
        }),
      ],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current[0]!.kills).toHaveLength(1);
    expect(result.current[0]!.kills[0]).toEqual({
      killer: 'PlayerOne',
      victim: 'RivalOne',
      week: 10,
    });
  });

  it('skips bouts where rival warrior is not in rivalWarriorStable map', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: [makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A' })],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = new Map(); // empty

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current).toEqual([]);
  });

  it('filters out entries with 0 bouts', () => {
    const state = makeState({
      roster: [makeWarrior('p1')],
      rivals: [
        {
          owner: { id: 'owner1', stableName: 'Iron Wolves' },
          roster: [makeWarrior('r1')],
        } as any,
      ],
      arenaHistory: [makeFight({ warriorIdA: 'p1' as any, warriorIdD: 'r1' as any, winner: 'A' })],
    });
    const rosterIds = new Set([state.roster[0]!.id]);
    const rivalWarriorStable = useRivalWarriorStableResult(state);

    const { result } = renderHook(() => useRivalriesList(state, rosterIds, rivalWarriorStable));
    expect(result.current.every((r) => r.bouts > 0)).toBe(true);
  });
});

function useRivalWarriorStableResult(state: RivalryStateSlice) {
  const { result } = renderHook(() => // eslint-disable-next-line react-hooks/rules-of-hooks
      useRivalWarriorStable(state));
  return result.current;
}
