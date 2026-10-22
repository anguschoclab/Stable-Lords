import type { GameState, RivalStableData, Warrior } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { PerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';

/**
 * Shared, read-only context every rival shard sees. Must be treated as
 * immutable — shard workers receive a structured clone, so any mutation here
 * would silently diverge between in-line and distributed execution.
 */
export interface RivalShardContext {
  state: GameState;
  perception: PerceptionSnapshot;
  successorByStable: Map<StableId, Warrior>;
  nextWeek: number;
}

/**
 * Shrinks the shard-broadcast state to the rival-processing read surface.
 * The transitive read set (AI workers, economy, scheduling assistants,
 * successor minting) covers roster/rivals/graveyard/retired/recruitPool/
 * freeAgents/tournaments/arenaHistory/rankings/offers/champions/maps —
 * everything else is dead weight that postMessage would clone into every
 * shard every week. The SAME narrowed ctx feeds the in-line path, so
 * sequential and distributed runs read identical input by construction.
 */
export function narrowRivalShardState(state: GameState): GameState {
  return {
    ...state,
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    grandChampions: [],
    matchHistory: [],
    killEvents: [],
    scoutReports: [],
    moodHistory: [],
    ledger: [],
    awards: [],
    insightTokens: [],
    seasonalGrowth: [],
    unacknowledgedDeaths: [],
    coachDismissed: [],
    bookmarks: [],
    deferredBoutLogs: [],
    pendingResolutionData: undefined,
    lastWeekBoutDisplay: undefined,
    stewardReport: undefined,
    worldOptions: undefined,
    contentPacks: [],
    promoters: {},
  };
}

/**
 * Per-shard work item: one rival stable plus its deterministic position in
 * the week's rival ordering. `index` feeds the strategy seed, so it must be
 * stable across sequential and distributed execution.
 */
export interface RivalShardInput {
  rival: RivalStableData;
  index: number;
}

/**
 * Result of processing one rival stable for the week: the updated stable
 * (or its bankruptcy replacement) and any gazette lines it produced.
 */
export interface RivalShardOutput {
  rival: RivalStableData;
  gazetteItems: string[];
  /** Set when `rival` is a bankruptcy successor: the id of the stable it replaces. */
  replacesStableId?: RivalStableData['id'];
}
