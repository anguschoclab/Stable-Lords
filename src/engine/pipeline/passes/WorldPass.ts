import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import type { GameState, Season } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import { processOwnerGrudges } from '@/engine/owner/grudges';
import { updateRivalriesFromBouts } from '@/engine/matchmaking/rivalryLogic';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { rollWeather } from '@/engine/weather/seasonalWeather';
import { SEASONS } from '@/types/enumSources';

/**
 * Stable Lords — World Pipeline Pass
 * Handles seasonal transitions and weather changes.
 */


/**
 * Compute next season.
 */
export function computeNextSeason(newWeek: number): Season {
  return SEASONS[Math.floor((newWeek - 1) / 13) % 4] ?? 'Spring';
}

/**
 * Weathers available in every season.
 */
/**
 * Run world pass.
 * @param _state -
 * @param nextWeek -
 * @param rng -
 */
export function runWorldPass(_state: GameState, nextWeek: number, rng?: IRNGService): StateImpact {
  const rngService = resolveRng(rng, nextWeek * 13);
  const nextSeason = computeNextSeason(nextWeek);
  const nextWeather = rollWeather(rngService, nextSeason);

  // ── World-facing social layer (relocated from NarrativePass — G5):
  // grudges and rivalries are world state, not player-facing narrative, so
  // they must keep updating in headless mode and when the player is stopped.
  const weekFights = getFightsForWeek(_state.arenaHistory, _state.absoluteWeek);
  const { grudges, gazetteItems } = processOwnerGrudges(_state, _state.ownerGrudges || []);
  const rivalries = updateRivalriesFromBouts(
    _state.rivalries || [],
    weekFights,
    _state.absoluteWeek,
    rngService
  );

  const impact: StateImpact = {
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather,
    ownerGrudges: grudges,
    rivalries,
  };

  if (gazetteItems.length > 0) {
    impact.newsletterItems = [
      {
        id: rngService.uuid(),
        week: _state.absoluteWeek + 1,
        title: 'Stable Rivalries & Grudges',
        items: gazetteItems,
      },
    ];
  }

  return impact;
}
