import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { convertRetiredToTrainer } from '@/engine/trainers/trainers';
import { makeWarrior } from '@/test/_fixtures/factories';

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
});
