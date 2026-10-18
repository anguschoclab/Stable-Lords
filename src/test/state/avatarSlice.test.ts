import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { AvatarConfig, AvatarData } from '@/types/avatar.types';

describe('avatarSlice', () => {
  const config: AvatarConfig = {
    entityId: 'w-1',
    entityType: 'warrior',
    seed: 12345,
    name: 'Aulus',
    age: 25,
  };

  beforeEach(() => {
    const fresh = createFreshState('test');
    useGameStore.getState().loadGame('autosave', fresh);
  });

  it('defaults avatarCache to an empty object', () => {
    expect(useGameStore.getState().avatarCache).toEqual({});
  });

  it('getAvatar returns undefined for unknown ids', () => {
    expect(useGameStore.getState().getAvatar('missing')).toBeUndefined();
  });

  it('setAvatar and getAvatar round-trip', () => {
    const avatar: AvatarData = {
      seed: 1,
      entityType: 'warrior',
      gender: 'masc',
      ageGroup: 'adult',
      primaryColor: '#000',
      layers: [],
    };
    useGameStore.getState().setAvatar('w-1', avatar);
    expect(useGameStore.getState().getAvatar('w-1')).toEqual(avatar);
  });

  it('ensureAvatar returns cached value on hit', () => {
    const avatar: AvatarData = {
      seed: 1,
      entityType: 'warrior',
      gender: 'masc',
      ageGroup: 'adult',
      primaryColor: '#000',
      layers: [{ category: 'base', src: '/x.png', z: 0 }],
    };
    useGameStore.getState().setAvatar('w-1', avatar);
    expect(useGameStore.getState().ensureAvatar(config)).toBe(avatar);
  });

  it('ensureAvatar generates and stores on miss', () => {
    const avatar = useGameStore.getState().ensureAvatar(config);
    expect(avatar).toBeDefined();
    expect(useGameStore.getState().getAvatar('w-1')).toBe(avatar);
  });

  it('rerollAvatar overwrites the cache with a new seed', () => {
    const first = useGameStore.getState().ensureAvatar(config);
    const second = useGameStore.getState().rerollAvatar(config);
    expect(second.seed).not.toBe(first.seed);
    expect(useGameStore.getState().getAvatar('w-1')?.seed).toBe(second.seed);
  });

  it('invalidateAvatar removes the cache entry', () => {
    useGameStore.getState().ensureAvatar(config);
    useGameStore.getState().invalidateAvatar('w-1');
    expect(useGameStore.getState().getAvatar('w-1')).toBeUndefined();
  });

  it('survives a save/load round-trip', () => {
    useGameStore.getState().ensureAvatar(config);
    const state = useGameStore.getState();
    const fresh = { ...state } as unknown as import('@/types/state.types').GameState;
    useGameStore.getState().loadGame('autosave', fresh);
    expect(useGameStore.getState().getAvatar('w-1')).toBeDefined();
  });
});
