/**
 * Campaign Focus Evaluator
 * Auto-detects the optimal campaign archetype for each warrior or respects player pins.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { isTournamentPrepWeek } from '@/engine/core/absoluteWeek';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import type { CampaignFocus } from './types';

const REHAB_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical', 'Permanent']);

/**
 * Flattened contender-id sets keyed on the index Map instance. The same
 * per-tick index is shared by every warrior evaluation (perception snapshot,
 * council report), so membership flattens once per index, not once per warrior.
 */
const contenderSetCache = new WeakMap<Map<string, WarriorId[]>, Set<WarriorId>>();

function contenderIds(index: Map<string, WarriorId[]>): Set<WarriorId> {
  let set = contenderSetCache.get(index);
  if (!set) {
    set = new Set<WarriorId>();
    for (const ids of index.values()) {
      for (const id of ids) set.add(id);
    }
    contenderSetCache.set(index, set);
  }
  return set;
}

/**
 * Determine or retrieve the campaign focus archetype for a warrior.
 * `contenderIndex` — the once-per-tick per-arena top-N ladder — avoids a
 * re-rank per warrior; built on demand when omitted.
 */
export function evaluateCampaignFocus(
  warrior: Warrior,
  state: GameState,
  contenderIndex?: Map<string, WarriorId[]>
): CampaignFocus {
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
  const rank = state.realmRankings?.[warrior.id]?.overallRank;
  const isContender = rank !== undefined && rank >= 1 && rank <= 256;
  if (isContender && (isTournamentPrepWeek(state.week) || state.isTournamentWeek)) {
    return 'TOURNAMENT_PUSH';
  }

  // 5. Ranked Venue Contender -> CROWN_BID
  const index = contenderIndex ?? buildContenderIndex(state);
  if (contenderIds(index).has(warrior.id)) return 'CROWN_BID';

  // 6. Young Developing Fighter -> PROSPECT_DEV
  if (totalBouts < 5 && (warrior.age ?? 18) <= 22) {
    return 'PROSPECT_DEV';
  }

  // 6. Default Prime Solvency -> PURSE_HUNTER
  return 'PURSE_HUNTER';
}
