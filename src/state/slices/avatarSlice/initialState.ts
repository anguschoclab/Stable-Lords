import type { AvatarSlice } from './types';

export const defaultAvatarState: Omit<
  AvatarSlice,
  'getAvatar' | 'setAvatar' | 'ensureAvatar' | 'rerollAvatar' | 'invalidateAvatar'
> = {
  avatarCache: {},
};
