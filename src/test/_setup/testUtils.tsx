import React from 'react';
import { render } from '@testing-library/react';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { GameState } from '@/types/game';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';

/**
 * A helper to inject a mock state into the Zustand store before rendering.
 * @param ui - React element to render.
 * @param partialState - Partial state overrides.
 * @returns The rendered result.
 */
export function renderWithGameState(
  ui: React.ReactElement,
  partialState: Partial<ReturnType<typeof createFreshState>> = {}
) {
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
