import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { generateWeeklyGazette } from '@/engine/gazette/gazetteFactory';
import { getFightsForWeek } from '@/engine/core/historyUtils';

/**
 * Stable Lords — Narrative Pipeline Pass
 * Bundles Gazette generation, Grudges, and Rivalry updates into a single impact.
 */
export function runNarrativePass(
  state: GameState,
  _currentWeek: number,
  _nextWeek: number,
  rootRng?: IRNGService
): StateImpact {
  const rng = resolveRng(rootRng, state.absoluteWeek * 9973 + 456);

  // 1. Gazette generation
  const weekFights = getFightsForWeek(state.arenaHistory, state.absoluteWeek);
  const story = generateWeeklyGazette(
    weekFights,
    state.crowdMood,
    state.absoluteWeek,
    state.graveyard,
    state.arenaHistory,
    rng
  );
  const gazettes = [...(state.gazettes || []), { ...story, week: state.absoluteWeek }].slice(-50);

  // 2. Owner grudges and rivalries are world state — they were relocated to
  // WorldPass (G5) so they keep updating in headless/player-stopped runs.

  const impact: StateImpact = {
    gazettes,
  };

  return impact;
}
