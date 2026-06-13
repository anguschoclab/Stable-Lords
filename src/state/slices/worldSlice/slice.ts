import { StateCreator } from 'zustand';
import type { GameStore } from '@/state/useGameStore';
import type { WorldSlice } from './types';
import { defaultWorldState } from './initialState';
import { createBoutActions } from './boutActions';
import { createPromoterActions } from './promoterActions';
import { createCombatActions } from './combatActions';
import { createPlayerActions } from './playerActions';

export const createWorldSlice: StateCreator<GameStore, [], [], WorldSlice> = (set, _get) => ({
  ...defaultWorldState,
  ...createBoutActions(set),
  ...createPromoterActions(set),
  ...createCombatActions(set),
  ...createPlayerActions(set),
});
