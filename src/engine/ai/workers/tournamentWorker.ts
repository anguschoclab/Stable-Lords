/**
 * Tournament worker — TOURNAMENT_CAMPAIGN preparation shaping (G13).
 *
 * Preparation only: the season's top-2 fame warriors get rest ('recovery')
 * training assignments, which suppress their bout bids through the same
 * isBookable gate every other assignment uses (G19 wiring). Committee
 * selection stays rank-based — this worker cannot influence entry, only
 * how fresh the stable's contenders are when the bracket lands.
 */
import type { RivalStableData } from '@/types/state.types';
import { logAgentAction } from '../agentCore';
import { isActive } from '@/engine/warriorStatus';

/** Contenders rested per campaign week — the stable's tournament core. */
const CAMPAIGN_REST_COUNT = 2;

/**
 * Weekly TOURNAMENT_CAMPAIGN prep: assign 'recovery' training to the stable's
 * top-fame active warriors so they enter the bracket rested. No-op for any
 * other intent or when every contender is already resting.
 */
export function processTournamentPrep(
  rival: RivalStableData,
  week: number
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const gazetteItems: string[] = [];
  if (rival.strategy?.intent !== 'TOURNAMENT_CAMPAIGN') {
    return { updatedRival: rival, gazetteItems };
  }

  const contenders = rival.roster
    .filter(isActive)
    .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))
    .slice(0, CAMPAIGN_REST_COUNT);
  if (contenders.length === 0) {
    return { updatedRival: rival, gazetteItems };
  }

  const alreadyRested = new Set(rival.trainingAssignments.map((a) => a.warriorId));
  const newAssignments = contenders
    .filter((w) => !alreadyRested.has(w.id))
    .map((w) => ({ warriorId: w.id, type: 'recovery' as const }));
  if (newAssignments.length === 0) {
    return { updatedRival: rival, gazetteItems };
  }

  let updatedRival: RivalStableData = {
    ...rival,
    trainingAssignments: [...rival.trainingAssignments, ...newAssignments],
  };
  updatedRival = logAgentAction(
    updatedRival,
    'ROSTER',
    `Resting ${newAssignments.length} contender(s) for the tournament bracket.`,
    'Low',
    week,
    'TOURNAMENT_PREP'
  );
  gazetteItems.push(
    `🏆 ${updatedRival.owner.stableName} rests its top contenders ahead of the tournament.`
  );

  return { updatedRival, gazetteItems };
}
