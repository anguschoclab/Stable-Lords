import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { convertRetiredToTrainer } from '@/engine/trainers/trainers';
import { makeWarrior } from '@/test/_fixtures/factories';
import { resolveImpacts } from '@/engine/impacts';

describe('avatar lifecycle', () => {
  beforeEach(() => {
    const fresh = createFreshState('test');
    useGameStore.getState().loadGame('autosave', fresh);
  });

  it('convertRetiredToTrainer copies avatarSeed from the warrior', () => {
    const warrior = makeWarrior({ id: 'w-1' as any, avatarSeed: 12345 });
    const trainer = convertRetiredToTrainer(warrior);
    expect(trainer.avatarSeed).toBe(warrior.avatarSeed);
  });

  it('retiring a warrior invalidates the cached avatar', () => {
    const warrior = makeWarrior({ id: 'w-1' as any, avatarSeed: 12345 });
    useGameStore.getState().ensureAvatar({
      entityId: warrior.id,
      entityType: 'warrior',
      seed: warrior.avatarSeed ?? 0,
      name: warrior.name,
      age: warrior.age,
    });
    expect(useGameStore.getState().getAvatar(warrior.id)).toBeDefined();
    useGameStore.getState().retireWarrior(warrior.id as import('@/types/shared.types').WarriorId);
    expect(useGameStore.getState().getAvatar(warrior.id)).toBeUndefined();
  });

  it('invalidates a cached avatar when aging crosses a visual age group', () => {
    const warrior = makeWarrior({ id: 'w-2' as any, age: 34, avatarSeed: 23456 });
    const state = createFreshState('aging');
    state.roster = [warrior];
    state.avatarCache = {
      [warrior.id]: {
        seed: 23456,
        entityType: 'warrior',
        gender: 'masc',
        ageGroup: 'adult',
        primaryColor: '#000000',
        layers: [],
      },
    };
    const next = resolveImpacts(state, [{ rosterUpdates: new Map([[warrior.id, { age: 35 }]]) }]);
    expect(next.avatarCache?.[warrior.id]).toBeUndefined();
  });
});
