import { describe, it, expect } from 'vitest';
import {
  resolveWarriorName,
  resolveStableName,
  findWarrior,
  findStableId,
  clearHistoryResolverCaches,
} from '@/engine/core/historyResolver';

describe('historyResolver', () => {
  const mockState: any = {
    player: { id: 'p1', stableName: 'Player Stable', name: 'Player' },
    roster: [
      { id: 'w1', name: 'Warrior 1' },
      { id: 'shared-id', name: 'Roster Warrior' },
    ],
    graveyard: [
      { id: 'w2', name: 'Warrior 2' },
      { id: 'shared-id', name: 'Grave Warrior' },
    ],
    retired: [{ id: 'w3', name: 'Warrior 3' }],
    rivals: [
      {
        id: 'r1',
        owner: { id: 'r1', stableName: 'Rival Stable 1' },
        roster: [
          { id: 'w4', name: 'Warrior 4' },
          { id: 'shared-id', name: 'Rival Warrior' },
        ],
      },
    ],
  };

  describe('resolveWarriorName', () => {
    it('should resolve name from roster', () => {
      expect(resolveWarriorName(mockState, 'w1', 'Fallback')).toBe('Warrior 1');
    });

    it('should resolve name from graveyard', () => {
      expect(resolveWarriorName(mockState, 'w2', 'Fallback')).toBe('Warrior 2');
    });

    it('should resolve name from retired', () => {
      expect(resolveWarriorName(mockState, 'w3', 'Fallback')).toBe('Warrior 3');
    });

    it('should resolve name from rivals', () => {
      expect(resolveWarriorName(mockState, 'w4', 'Fallback')).toBe('Warrior 4');
    });

    it('should use fallback if not found', () => {
      expect(resolveWarriorName(mockState, 'unknown', 'Fallback')).toBe('Fallback');
    });

    it('should prioritize roster > graveyard > retired > rivals', () => {
      expect(resolveWarriorName(mockState, 'shared-id', 'Fallback')).toBe('Roster Warrior');
    });

    it('should return legacyName when warriorId is undefined', () => {
      expect(resolveWarriorName(mockState, undefined, 'Fallback')).toBe('Fallback');
    });

    it('should return legacyName when warriorId is empty string', () => {
      expect(resolveWarriorName(mockState, '', 'Fallback')).toBe('Fallback');
    });

    it('should return legacyName when warrior is removed from all lists', () => {
      const emptyState: any = {
        player: mockState.player,
        roster: [],
        graveyard: [],
        retired: [],
        rivals: [],
      };
      expect(resolveWarriorName(emptyState, 'w1', 'Fallback')).toBe('Fallback');
    });
  });

  describe('resolveStableName', () => {
    it('should resolve player stable name', () => {
      expect(resolveStableName(mockState, 'p1', 'Fallback')).toBe('Player Stable');
    });

    it('should resolve rival stable name', () => {
      expect(resolveStableName(mockState, 'r1', 'Fallback')).toBe('Rival Stable 1');
    });

    it('should use fallback if not found', () => {
      expect(resolveStableName(mockState, 'unknown', 'Fallback')).toBe('Fallback');
    });

    it('should return legacyName when stableId is undefined', () => {
      expect(resolveStableName(mockState, undefined, 'Fallback')).toBe('Fallback');
    });

    it('should return legacyName when stableId is empty string', () => {
      expect(resolveStableName(mockState, '', 'Fallback')).toBe('Fallback');
    });
  });

  describe('findWarrior', () => {
    it('should find warrior by id', () => {
      const w = findWarrior(mockState, 'w1');
      expect(w?.name).toBe('Warrior 1');
    });

    it('should find warrior by name', () => {
      const w = findWarrior(mockState, undefined, 'Warrior 4');
      expect(w?.id).toBe('w4');
    });

    it('should prioritize ID over Name if both provided', () => {
      const w = findWarrior(mockState, 'w1', 'Warrior 4');
      expect(w?.id).toBe('w1');
    });

    it('should prioritize roster over other lists when searching by name', () => {
      const stateWithNameConflict: any = {
        ...mockState,
        roster: [...mockState.roster, { id: 'w-new', name: 'Warrior 4' }],
      };
      const w = findWarrior(stateWithNameConflict, undefined, 'Warrior 4');
      expect(w?.id).toBe('w-new');
    });

    it('should return undefined when neither id nor name is provided', () => {
      expect(findWarrior(mockState)).toBeUndefined();
    });

    it('should return undefined when warrior is not found by id or name', () => {
      expect(findWarrior(mockState, 'non-existent', 'Non Existent')).toBeUndefined();
    });

    it('should find by name when id is not found but name is', () => {
      const w = findWarrior(mockState, 'non-existent-id', 'Warrior 1');
      expect(w?.id).toBe('w1');
    });
  });

  describe('findStableId', () => {
    it('should return player id when name matches player stableName', () => {
      expect(findStableId(mockState, 'Player Stable')).toBe('p1');
    });

    it('should return rival id when name matches rival owner.stableName', () => {
      expect(findStableId(mockState, 'Rival Stable 1')).toBe('r1');
    });

    it('should return undefined when name is not found', () => {
      expect(findStableId(mockState, 'Unknown Stable')).toBeUndefined();
    });

    it('should return undefined when name is empty string', () => {
      expect(findStableId(mockState, '')).toBeUndefined();
    });
  });

  describe('clearHistoryResolverCaches', () => {
    it('should clear caches so a removed warrior falls back after cache clear', () => {
      const stateWithW1: any = { ...mockState };
      expect(resolveWarriorName(stateWithW1, 'w1', 'Fallback')).toBe('Warrior 1');

      clearHistoryResolverCaches();

      const stateWithoutW1: any = {
        ...mockState,
        roster: mockState.roster.filter((w: any) => w.id !== 'w1'),
      };
      expect(resolveWarriorName(stateWithoutW1, 'w1', 'Fallback')).toBe('Fallback');
    });
  });

  it('should handle state changes (new state object)', () => {
    const nextState = { ...mockState, roster: [{ id: 'w1', name: 'Updated Warrior 1' }] };
    expect(resolveWarriorName(nextState, 'w1', 'Fallback')).toBe('Updated Warrior 1');
  });
});
