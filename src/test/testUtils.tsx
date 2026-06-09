import React from 'react';
import { render } from '@testing-library/react';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { GameState } from '@/types/game';
import '@/test/setup'; /**
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
