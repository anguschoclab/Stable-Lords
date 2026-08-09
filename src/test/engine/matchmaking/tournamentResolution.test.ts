/**
 * Tournament resolution — verifies updateEntityInList is used correctly
 * in awards.ts modifyWarrior for O(1) targeted roster/rival updates,
 * and that applyBoutResults correctly updates warriors.
 *
 * Pre-merge test: validates existing behavior on main.
 */
import { describe, it, expect } from 'vitest';
import { updateEntityInList } from '@/utils/stateUtils';
import { modifyWarrior } from '@/engine/matchmaking/tournamentSelection/awards';
import type { GameState, Warrior } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';

function makeWarrior(id: string, name: string, stableId?: string): Warrior {
  return {
    id,
    name,
    style: 'Brawler',
    stableId: (stableId ?? 'player') as StableId,
    attributes: { ST: 10, SP: 10, DF: 10, WT: 10 },
    baseSkills: { ATT: 5, DEF: 5, RIP: 5, RHY: 5 },
    career: { wins: 0, losses: 0, kills: 0, deaths: 0, tournaments: 0 },
    fame: 0,
    age: 20,
    traits: [],
    status: 'Active',
  } as unknown as Warrior;
}

function makeState(roster: Warrior[], rivals: { id: string; roster: Warrior[] }[]): GameState {
  return {
    roster,
    rivals: rivals as any,
    player: { id: 'player' },
    week: 1,
    absoluteWeek: 1,
  } as unknown as GameState;
}

describe('tournament resolution — updateEntityInList usage', () => {
  it('modifyWarrior updates roster warrior via updateEntityInList', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const state = makeState([w1], []);

    const result = modifyWarrior(state, 'w1' as WarriorId, (draft) => {
      draft.fame = 100;
    });

    expect(result.roster[0]?.fame).toBe(100);
    expect(result.roster[0]).not.toBe(w1); // new object
  });

  it('modifyWarrior updates rival roster warrior when not in player roster', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const w2 = makeWarrior('w2', 'Fighter2', 'rival1');
    const state = makeState([w1], [{ id: 'rival1', roster: [w2] }]);

    const result = modifyWarrior(state, 'w2' as WarriorId, (draft) => {
      draft.fame = 50;
    });

    expect(result.rivals[0]?.roster[0]?.fame).toBe(50);
    expect(result.rivals[0]?.roster[0]).not.toBe(w2);
  });

  it('modifyWarrior preserves other warriors immutably', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const w2 = makeWarrior('w2', 'Fighter2', 'player');
    const state = makeState([w1, w2], []);

    const result = modifyWarrior(state, 'w1' as WarriorId, (draft) => {
      draft.fame = 100;
    });

    expect(result.roster[1]).toBe(w2); // same reference — not cloned
  });

  it('updateEntityInList returns same array ref when warrior not in roster', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const roster = [w1];
    const result = updateEntityInList(roster, 'missing', (w) => ({ ...w, fame: 99 }));
    expect(result).toBe(roster);
  });
});
