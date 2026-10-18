import type { AvatarConfig, AvatarData } from '@/types/avatar.types';

/**
 * Avatar slice surface — cache + lazy accessors.
 */
export interface AvatarSlice {
  avatarCache: Record<string, AvatarData>;
  getAvatar: (id: string) => AvatarData | undefined;
  setAvatar: (id: string, avatar: AvatarData) => void;
  ensureAvatar: (config: AvatarConfig) => AvatarData;
  rerollAvatar: (config: AvatarConfig) => AvatarData;
  invalidateAvatar: (id: string) => void;
}
