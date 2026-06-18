import { describe, it, expect } from 'vitest';
import { collectAllKnownWarriors, buildWarriorMap } from '@/utils/warriorCollection';
import type { Warrior } from '@/types/warrior.types';

describe('warriorCollection', () => {
  const dummyWarrior = (id: string): Warrior => ({ id, name: id }) as Warrior;

  const mockState = {
    roster: [dummyWarrior('p1')],
    graveyard: [dummyWarrior('g1')],
    retired: [dummyWarrior('r1')],
    rivals: [{ id: 'rival_stable', name: 'Rival', renown: 1, roster: [dummyWarrior('rv1')] }],
  };

  describe('collectAllKnownWarriors', () => {
    it('collects warriors from all available sources', () => {
      const all = collectAllKnownWarriors(mockState);
      expect(all.length).toBe(4);
      expect(all.map((w) => w.id)).toEqual(['p1', 'g1', 'r1', 'rv1']);
    });

    it('handles missing rivals array safely', () => {
      const stateWithoutRivals = { ...mockState, rivals: undefined } as any;
      const all = collectAllKnownWarriors(stateWithoutRivals);
      expect(all.length).toBe(3);
      expect(all.map((w) => w.id)).toEqual(['p1', 'g1', 'r1']);
    });
  });

  describe('buildWarriorMap', () => {
    it('builds a map of all warriors by ID', () => {
      const map = buildWarriorMap(mockState);
      expect(map.size).toBe(4);
      expect(map.get('p1')?.id).toBe('p1');
      expect(map.get('rv1')?.id).toBe('rv1');
    });

    it('latest entry overwrites duplicate IDs', () => {
      const duplicateState = {
        roster: [dummyWarrior('dup')],
        graveyard: [],
        retired: [],
        rivals: [{ roster: [{ ...dummyWarrior('dup'), name: 'latest_dup' } as Warrior] }],
      } as any;
      const map = buildWarriorMap(duplicateState);
      expect(map.size).toBe(1);
      expect(map.get('dup')?.name).toBe('latest_dup');
    });
  });
});
