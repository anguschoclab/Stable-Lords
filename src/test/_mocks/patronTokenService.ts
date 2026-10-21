import { vi } from 'vitest';
import type { GameState } from '@/types/state.types';

/**
 * Shared stub for @/engine/tokens/patronTokenService — awardToken is an
 * identity pass-through so prize-award specs assert medals/purses without
 * minting real insight tokens (real token behavior lives in
 * awardsTokens.test.ts).
 */
export const PatronTokenService = {
  awardToken: vi.fn((state: GameState) => state),
};
