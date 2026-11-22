/**
 * Week Finalization Service
 * Handles post-bout side effects: crowd mood, gazette, rivalries
 * Extracted from boutProcessorService.ts to enforce SRP
 */
import type { GameState } from '@/types/state.types';
import type { CrowdMoodType } from '@/types/shared.types';
import type { StateImpact } from '@/engine/impacts';
import type { BoutResult } from './boutProcessorService';
import { computeCrowdMood } from '@/engine/bout/crowdMood';
import { updateRivalriesFromBouts } from '@/engine/matchmaking/rivalryLogic';
import { generateWeeklyGazette } from '@/engine/gazette/gazetteFactory';
import { getFightsForWeek } from '@/engine/core/historyUtils';
import { SeededRNG } from '@/utils/random';

/**
 * Finalizes week side effects into StateImpact
 * Includes: fame delta, crowd mood, gazette, rivalries
 */
export function finalizeWeekSideEffectsToImpact(
  state: GameState,
  results: BoutResult[]
): StateImpact {
  const playerFameGain = results.filter((r) => r.outcome.winner === 'A' && !r.rivalStable).length;
  const newMood = computeCrowdMood(state.arenaHistory);
  const oldMood = state.crowdMood;

  // Unified fame tracking: player.fame is the authority
  // Dedupe by week — older saves accumulated duplicated/out-of-order
  // entries when this field was applied with append semantics.
  const seen = new Set<number>();
  const window: { week: number; mood: CrowdMoodType }[] = [];
  for (let i = (state.moodHistory?.length ?? 0) - 1; i >= 0 && window.length < 19; i--) {
    const entry = state.moodHistory![i]!;
    if (seen.has(entry.week)) continue;
    seen.add(entry.week);
    window.unshift(entry);
  }
  window.sort((a, b) => a.week - b.week);

  const impact: StateImpact = {
    fameDelta: playerFameGain,
    crowdMood: newMood,
    moodHistory: [...window, { week: state.absoluteWeek, mood: newMood }],
  };

  // Add mood change notification if mood changed significantly
  if (oldMood && oldMood !== newMood) {
    impact.newsletterItems = [
      {
        id: `mood_change_${state.absoluteWeek}`,
        week: state.absoluteWeek,
        title: `Crowd Mood Shift: ${oldMood} → ${newMood}`,
        items: [
          `The arena atmosphere has shifted from ${oldMood} to ${newMood}. This will affect fame gains, kill probabilities, and gazette tone this week.`,
        ],
      },
    ];
  }

  const weekFights = getFightsForWeek(state.arenaHistory, state.absoluteWeek);
  const gazetteRng = new SeededRNG(state.absoluteWeek * 9973 + 123);
  impact.gazettes = [
    generateWeeklyGazette({
      fights: weekFights,
      mood: newMood,
      week: state.absoluteWeek,
      graveyard: state.graveyard,
      allFights: state.arenaHistory,
      rng: gazetteRng,
    }),
  ];
  const rng = new SeededRNG(state.absoluteWeek * 13);
  impact.rivalries = updateRivalriesFromBouts(
    state.rivalries || [],
    weekFights,
    state.absoluteWeek,
    rng
  );

  return impact;
}
