import type { StateCreator } from 'zustand';
import type { GameStore } from '@/state/useGameStore';
import type { AvatarSlice } from './types';
import { defaultAvatarState } from './initialState';
import { createAvatarActions } from './actions';

/** Avatar slice: portrait cache plus lazy generation/reroll actions. */
export const createAvatarSlice: StateCreator<GameStore, [], [], AvatarSlice> = (
  set,
  get
) => ({
  ...defaultAvatarState,
  ...createAvatarActions(set, get),
});
