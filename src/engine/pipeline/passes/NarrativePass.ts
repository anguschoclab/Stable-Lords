import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { generateWeeklyGazette } from '@/engine/gazette/gazetteFactory';
import { processOwnerGrudges } from '@/engine/owner/grudges';
import { updateRivalriesFromBouts } from '@/engine/matchmaking/rivalryLogic';
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
  const rng = rootRng || new SeededRNGService(state.absoluteWeek * 9973 + 456);

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

  // 2. Owner Grudges
  const { grudges, gazetteItems } = processOwnerGrudges(state, state.ownerGrudges || []);

  // 3. Rivalry Escalation
  const rivalries = updateRivalriesFromBouts(state.rivalries || [], weekFights, state.absoluteWeek, rng);

  const impact: StateImpact = {
    gazettes,
    ownerGrudges: grudges,
    rivalries,
  };

  if (gazetteItems.length > 0) {
    impact.newsletterItems = [
      {
        id: rng.uuid(),
        week: state.absoluteWeek + 1,
        title: 'Stable Rivalries & Grudges',
        items: gazetteItems,
      },
    ];
  }

  return impact;
}
