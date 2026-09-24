/**
 * Campaign Focus Evaluator
 * Auto-detects the optimal campaign archetype for each warrior or respects player pins.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type { CampaignFocus } from './types';

const REHAB_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical', 'Permanent']);

/**
 * Determine or retrieve the campaign focus archetype for a warrior.
 */
export function evaluateCampaignFocus(warrior: Warrior, state: GameState): CampaignFocus {
  // 1. Explicit player override takes precedence
  if (warrior.campaignFocus) {
    return warrior.campaignFocus;
  }

  // 2. Health & Fatigue Hard Check -> REHABILITATION
  const hasRehabInjury = (warrior.injuries || []).some(
    (inj) => REHAB_SEVERITIES.has(inj.severity) && (inj.weeksRemaining ?? 1) > 0
  );
  if (hasRehabInjury || (warrior.fatigue ?? 0) >= 40) {
    return 'REHABILITATION';
  }

  // 3. Aging & Career Arc -> VETERAN_TWILIGHT
  const totalBouts = (warrior.career?.wins ?? 0) + (warrior.career?.losses ?? 0);
  if ((warrior.age ?? 18) > 25 && totalBouts >= 15) {
    return 'VETERAN_TWILIGHT';
  }

  // 4. Tournament Timing & Qualification -> TOURNAMENT_PUSH
  const seasonWeek = ((state.week - 1) % 13) + 1;
  const rank = state.realmRankings?.[warrior.id]?.overallRank;
  const isContender = rank !== undefined && rank >= 1 && rank <= 256;
  if (isContender && (seasonWeek >= 10 || state.isTournamentWeek)) {
    return 'TOURNAMENT_PUSH';
  }

  // 5. Young Developing Fighter -> PROSPECT_DEV
  if (totalBouts < 5 && (warrior.age ?? 18) <= 22) {
    return 'PROSPECT_DEV';
  }

  // 6. Default Prime Solvency -> PURSE_HUNTER
  return 'PURSE_HUNTER';
}
