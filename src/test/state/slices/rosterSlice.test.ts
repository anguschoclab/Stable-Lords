import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createRosterSlice, RosterSlice } from '@/state/slices/rosterSlice';
import { act } from '@testing-library/react';
import type { Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

const mockWarrior: Warrior = {
  id: 'w1' as import('@/types/shared.types').WarriorId,
  name: 'Gaius',
  style: FightingStyle.AimedBlow,
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
  age: 20,
};

const createTestStore = () =>
  create<RosterSlice & { week: number }>()(
    immer((set: any, get: any, api: any) => ({
      ...createRosterSlice(set, get, api),
      week: 1,
    })) as any
  );

describe('RosterSlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should add a warrior to the roster', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
    });
    expect(useTestStore.getState().roster).toHaveLength(1);
    expect(useTestStore.getState().roster[0]!.id).toBe('w1');
  });

  it('should kill a warrior and move them to the graveyard', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
    });

    act(() => {
      useTestStore
        .getState()
        .killWarrior('w1' as import('@/types/shared.types').WarriorId, 'rival_1', 'Decapitation');
    });

    expect(useTestStore.getState().roster).toHaveLength(0);
    expect(useTestStore.getState().graveyard).toHaveLength(1);
    expect(useTestStore.getState().graveyard[0]).toMatchObject({
      id: 'w1',
      status: 'Dead',
      deathCause: 'Decapitation',
    });
  });

  it('should retire a warrior and move them to retired list', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
    });

    act(() => {
      useTestStore.getState().retireWarrior('w1' as import('@/types/shared.types').WarriorId);
    });

    expect(useTestStore.getState().roster).toHaveLength(0);
    expect(useTestStore.getState().retired).toHaveLength(1);
    expect(useTestStore.getState().retired[0]!.status).toBe('Retired');
  });

  it('should set roster', () => {
    act(() => {
      useTestStore.getState().setRoster([mockWarrior, { ...mockWarrior, id: 'w2' } as any]);
    });
    expect(useTestStore.getState().roster).toHaveLength(2);
  });

  it('should do nothing if killWarrior targets non-existent warrior', () => {
    act(() => {
      useTestStore.getState().killWarrior('none' as any, 'killer', 'cause');
    });
    expect(useTestStore.getState().graveyard).toHaveLength(0);
  });

  it('should do nothing if retireWarrior targets non-existent warrior', () => {
    act(() => {
      useTestStore.getState().retireWarrior('none' as any);
    });
    expect(useTestStore.getState().retired).toHaveLength(0);
  });

  it('should release a warrior', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.getState().releaseWarrior('w1' as any);
    });
    expect(useTestStore.getState().roster).toHaveLength(0);
    expect(useTestStore.getState().retired).toHaveLength(1);
    expect(useTestStore.getState().retired[0]!.status).toBe('Retired');
  });

  it('should do nothing if releaseWarrior targets non-existent warrior', () => {
    act(() => {
      useTestStore.getState().releaseWarrior('none' as any);
    });
    expect(useTestStore.getState().retired).toHaveLength(0);
  });

  it('should update warrior equipment', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.getState().updateWarriorEquipment('w1' as any, { weapon: 'sword', armor: 'mail', shield: 'kite', helm: 'pot' });
    });
    expect(useTestStore.getState().roster[0]!.equipment).toEqual({ weapon: 'sword', armor: 'mail', shield: 'kite', helm: 'pot' });
  });

  it('should rename warrior in roster, graveyard, and retired', () => {
    act(() => {
      useTestStore.setState({
        roster: [{ ...mockWarrior, id: 'w1', name: 'OldName1' } as any],
        graveyard: [{ ...mockWarrior, id: 'w2', name: 'OldName2' } as any],
        retired: [{ ...mockWarrior, id: 'w3', name: 'OldName3' } as any],
      });
      useTestStore.getState().renameWarrior('w1' as any, 'NewName1');
      useTestStore.getState().renameWarrior('w2' as any, 'NewName2');
      useTestStore.getState().renameWarrior('w3' as any, 'NewName3');
    });
    expect(useTestStore.getState().roster[0]!.name).toBe('NewName1');
    expect(useTestStore.getState().graveyard[0]!.name).toBe('NewName2');
    expect(useTestStore.getState().retired[0]!.name).toBe('NewName3');
  });

  it('should acknowledge death', () => {
    act(() => {
      useTestStore.setState({ unacknowledgedDeaths: ['w1', 'w2'] as any });
      useTestStore.getState().acknowledgeDeath('w1' as any);
    });
    expect(useTestStore.getState().unacknowledgedDeaths).toEqual(['w2']);
  });

  it('should consume insight token of type Weapon', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.setState({ insightTokens: [{ id: 't1', type: 'Weapon' }] as any });
      useTestStore.getState().consumeInsightToken('t1' as any, 'w1' as any);
    });
    const w = useTestStore.getState().roster[0]!;
    expect(w.favorites?.discovered.weapon).toBe(true);
    expect(useTestStore.getState().insightTokens).toHaveLength(0);
  });

  it('should consume insight token of type Rhythm', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.setState({ insightTokens: [{ id: 't1', type: 'Rhythm' }] as any });
      useTestStore.getState().consumeInsightToken('t1' as any, 'w1' as any);
    });
    const w = useTestStore.getState().roster[0]!;
    expect(w.favorites?.discovered.rhythm).toBe(true);
  });

  it('should consume insight token of type Style', () => {
    act(() => {
      const w = { ...mockWarrior, baseSkills: { ATT: 10, DEF: 10, PHY: 10, MEN: 10 }, derivedStats: { HP: 10 } };
      useTestStore.getState().addWarrior(w as any);
      useTestStore.setState({ insightTokens: [{ id: 't1', type: 'Style' }] as any });
      useTestStore.getState().consumeInsightToken('t1' as any, 'w1' as any);
    });
    const w = useTestStore.getState().roster[0]!;
    expect(w.baseSkills?.ATT).toBe(11);
  });

  it('should consume insight token of type Attribute', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.setState({ insightTokens: [{ id: 't1', type: 'Attribute' }] as any });
      useTestStore.getState().consumeInsightToken('t1' as any, 'w1' as any);
    });
    const w = useTestStore.getState().roster[0]!;
    const attrs = w.attributes;
    const totalAttrs = Object.values(attrs).reduce((a, b) => (a as number) + (b as number), 0);
    expect(totalAttrs).toBe(71); // Starts at 70 (7x10)
  });

  it('should consume insight token of type Tactic', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.setState({ insightTokens: [{ id: 't1', type: 'Tactic' }] as any });
      useTestStore.getState().consumeInsightToken('t1' as any, 'w1' as any);
    });
    const w = useTestStore.getState().roster[0]!;
    expect(w.flair).toContain('Tactical Insight');
  });

  it('should do nothing if consumeInsightToken targets non-existent token', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.setState({ insightTokens: [{ id: 't1', type: 'Weapon' }] as any });
      useTestStore.getState().consumeInsightToken('none' as any, 'w1' as any);
    });
    const w = useTestStore.getState().roster[0]!;
    expect(w.favorites).toBeUndefined();
    expect(useTestStore.getState().insightTokens).toHaveLength(1);
  });

  it('should update warrior equipment correctly', () => {
    act(() => {
      useTestStore.getState().addWarrior(mockWarrior);
      useTestStore.getState().updateWarriorEquipment('w2' as any, { weapon: 'sword', armor: 'mail', shield: 'kite', helm: 'pot' });
    });
    expect(useTestStore.getState().roster[0]!.equipment).toBeUndefined(); // w1 doesn't get w2's equip
  });

});
