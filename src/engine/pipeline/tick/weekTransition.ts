import type { GameState } from '@/types/state.types';
import {
  advanceWeek as runWeeklyPipeline,
  type WeekAdvanceOptions,
} from '@/engine/pipeline/services/weekPipelineService';

/**
 * Shared end-of-week transition: run the weekly pipeline, then reset the
 * boundary fields (day wraps to 0; tournament flags clear — the 52-week
 * year wrap-around logic itself lives in SystemPass). Single home for the
 * day-7 branch of advanceDay and the tail of skipToWeekEnd so both paths
 * produce identical boundary state.
 */
export async function finalizeWeekTransition(
  state: GameState,
  opts?: WeekAdvanceOptions
): Promise<GameState> {
  const finalState = await runWeeklyPipeline(state, {
    headless: opts?.headless,
    mutableInput: opts?.mutableInput,
    pool: opts?.pool,
  });
  return {
    ...finalState,
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
  };
}
