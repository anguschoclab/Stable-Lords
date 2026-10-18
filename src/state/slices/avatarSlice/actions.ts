import type { GameStore } from '@/state/useGameStore';
import type { AvatarConfig, AvatarData } from '@/types/avatar.types';
import { generateAvatar } from '@/engine/avatar/avatarGenerator';
import { cryptoRandomInt } from '@/utils/cryptoRandom';

type Set = (fn: (state: GameStore) => Partial<GameStore>) => void;
type Get = () => GameStore;

/**
 * Creates avatar-related actions for the game store.
 */
export function createAvatarActions(
  set: Set,
  get: Get
): Pick<
  GameStore,
  'getAvatar' | 'setAvatar' | 'ensureAvatar' | 'rerollAvatar' | 'invalidateAvatar'
> {
  return {
    getAvatar: (id: string) => get().avatarCache[id],

    setAvatar: (id: string, avatar: AvatarData) => {
      set((state) => ({ avatarCache: { ...state.avatarCache, [id]: avatar } }));
    },

    ensureAvatar: (config: AvatarConfig) => {
      const cached = get().avatarCache[config.entityId];
      if (cached) return cached;
      const next = generateAvatar(config);
      set((state) => ({
        avatarCache: { ...state.avatarCache, [config.entityId]: next },
      }));
      return next;
    },

    rerollAvatar: (config: AvatarConfig) => {
      const newSeed = cryptoRandomInt(0, 999999);
      const next = generateAvatar({ ...config, seed: newSeed });
      set((state) => ({
        avatarCache: { ...state.avatarCache, [config.entityId]: next },
      }));
      return next;
    },

    invalidateAvatar: (id: string) => {
      set((state) => {
        const { [id]: _removed, ...avatarCache } = state.avatarCache;
        return { avatarCache };
      });
    },
  };
}
