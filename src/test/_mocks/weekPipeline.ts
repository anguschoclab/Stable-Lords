import { vi } from 'vitest';
import type { GameState } from '@/types/state.types';

/** Shared stub for @/engine/pipeline/services/weekPipelineService — pass-through advanceWeek. */
export const advanceWeek = vi.fn(async (state: GameState) => state);
