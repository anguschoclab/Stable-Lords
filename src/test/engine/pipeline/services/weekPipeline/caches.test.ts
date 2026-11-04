import { describe, it, expect, vi } from 'vitest';
import { impactsAffectWeekCaches, buildWeekCaches } from '@/engine/pipeline/services/weekPipeline/caches';
import { GameState, Warrior } from '@/types/game';
import * as warriorLookup from '@/engine/core/warriorLookup';

describe('weekPipeline/caches', () => {
  describe('impactsAffectWeekCaches', () => {
    it('returns true if any impact has a key in CACHE_TOUCHING_KEYS', () => {
      expect(impactsAffectWeekCaches([{}])).toBe(false);
      expect(impactsAffectWeekCaches([{ treasuryDelta: 100 }])).toBe(false);
      expect(impactsAffectWeekCaches([{ rosterUpdates: new Map() }])).toBe(true);
      expect(impactsAffectWeekCaches([{ treasuryDelta: 100, deadWarriorIds: [] }])).toBe(true);
    });

    it('returns false for empty impacts or impacts without cache-touching keys', () => {
      expect(impactsAffectWeekCaches([])).toBe(false);
      expect(impactsAffectWeekCaches([null as any])).toBe(false);
    });
  });

  describe('buildWeekCaches', () => {
    it('populates state map properties and clears warrior lookup cache', () => {
      vi.spyOn(warriorLookup, 'clearWarriorCache');

      const mockState = {
        player: { id: 'player-stable' },
        roster: [{ id: 'w1' } as Warrior],
        rivals: [
          { id: 'rival-1', roster: [{ id: 'w2' } as Warrior] },
        ],
        rivalries: [
          { stableIdA: 'player-stable', stableIdB: 'rival-1' },
        ],
        ownerGrudges: [
          { ownerIdA: 'o1', ownerIdB: 'o2' },
        ]
      } as unknown as GameState;

      buildWeekCaches(mockState);

      expect(warriorLookup.clearWarriorCache).toHaveBeenCalled();

      expect(mockState.warriorMap).toBeDefined();
      expect(mockState.warriorMap?.size).toBe(2);
      expect(mockState.warriorMap?.get('w1')).toEqual({ id: 'w1' });
      expect(mockState.warriorMap?.get('w2')).toEqual({ id: 'w2' });

      expect(mockState.warriorToStableMap).toBeDefined();
      expect(mockState.warriorToStableMap?.get('w1')).toEqual({ stableId: 'player-stable', isPlayer: true });
      expect(mockState.warriorToStableMap?.get('w2')).toEqual({ stableId: 'rival-1', isPlayer: false });

      expect(mockState.rivalMap).toBeDefined();
      expect(mockState.rivalMap?.get('rival-1')).toEqual(mockState.rivals![0]);

      expect(mockState.rivalryMap).toBeDefined();
      expect(mockState.rivalryMap?.size).toBe(1);

      expect(mockState.grudgeMap).toBeDefined();
      expect(mockState.grudgeMap?.size).toBe(1);
    });
  });
});
