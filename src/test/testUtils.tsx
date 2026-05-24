import React from 'react';
import { render } from '@testing-library/react';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { GameState } from '@/types/game';
import { useGameStore } from '@/state/useGameStore';

// Provide a default mock for localStorage BEFORE importing game store
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      const { [key]: _, ...rest } = store;
      store = rest;
    },
    clear: function () {
      store = {};
    },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });/**
                                                                                            * Render with game state.
                                                                                            * @param ui - Ui.
                                                                                            * @param partialState - Partial state.
                                                                                            * @returns The result.
                                                                                            */


// A helper to inject a mock state into the Zustand store before rendering
/**
 * Render with game state.
 * @param ui - Ui.
 * @param partialState - Partial state.
 * @returns The result.
 */
export function renderWithGameState(
  ui: React.ReactElement,
  partialState: Partial<ReturnType<typeof createFreshState>> = {}
) {
  // Import useGameStore dynamically inside the function to ensure it's initialized
  const { useGameStore } = require('@/state/useGameStore');

  // Get a clean base state
  const baseState = createFreshState('test-seed');

  // Merge the partial overrides
  const mockState = {
    ...baseState,
    ...partialState,
  };

  // Set the state in the store directly
  useGameStore.getState().loadGame('test-slot', mockState as GameState);
  useGameStore.setState({
    atTitleScreen: false,
    isInitialized: true,
  });

  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
