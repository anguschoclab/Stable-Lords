import { StateCreator } from 'zustand';
import type { GameStore } from '@/state/useGameStore';
import type { RosterSlice } from './types';
import { defaultRosterState } from './initialState';
import { createRosterActions } from './actions';

/**
 *
 */
export const createRosterSlice: StateCreator<GameStore, [], [], RosterSlice> = (set, _get) => ({
  ...defaultRosterState,
  ...createRosterActions(set),
});
