import { type GameState } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { resolveImpacts } from './impacts';
import { truncateState } from '@/engine/storage/truncation';
import { evaluateStopConditions, type SoftStopCondition } from './pipeline/tick/timeAdvance';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import { getNamesFromTitle } from '@/utils/fightTitle';

/**
 * Defines the shape of autosim week summary.
 */
export interface AutosimWeekSummary {
  week: number;
  bouts: number;
  deaths: number;
  injuries: number;
  deathNames: string[];
  injuryNames: string[];
}

/**
 * Defines the shape of autosim result.
 */
export interface AutosimResult {
  finalState: GameState;
  weeksSimmed: number;
  stopReason: 'max_weeks' | 'death' | 'injury' | 'bankrupt' | 'no_pairings' | 'custom';
  stopDetail: string;
  weekSummaries: AutosimWeekSummary[];
}

/**
 * Default stop conditions for autosim — evaluated EVERY week.
 */
export const DEFAULT_AUTOSIM_STOP_CONDITIONS: SoftStopCondition[] = [
  { type: 'rosterEmpty' },
  { type: 'noPairings' },
];

/**
 * Strategy map: raw stop-condition reason strings → autosim stop reasons.
 * Unlisted keys fall back to 'max_weeks'.
 */
const STOP_REASON_MAP: Record<string, AutosimResult['stopReason']> = {
  roster_empty: 'no_pairings',
  no_pairings: 'no_pairings',
  player_death: 'death',
  custom_condition: 'custom',
};

/**
 * Convert stop-condition reason strings to autosim stop reasons
 */
function mapStopReason(reason: string | null | undefined): AutosimResult['stopReason'] {
  return (reason && STOP_REASON_MAP[reason]) || 'max_weeks';
}

/**
 * Defines the shape of autosim options.
 */
export interface AutosimOptions {
  weeksToSim: number;
  onProgress?: (current: number, total: number) => void;
  /** Defaults to DEFAULT_AUTOSIM_STOP_CONDITIONS; evaluated every week. */
  stopConditions?: SoftStopCondition[];
}

/**
 * Process player bout offers after week advancement
 */
export function processPlayerOffers(state: GameState): GameState {
  const index = state.warriorToOfferIds;
  if (!index) return processPlayerOffersScan(state);

  const seen = new Set<string>();
  for (const warrior of state.roster) {
    const offerIds = index.get(warrior.id);
    if (!offerIds) continue;
    for (const offerId of offerIds) {
      if (seen.has(offerId)) continue;
      seen.add(offerId);
      const offer = state.boutOffers[offerId as BoutOfferId];
      if (!offer || offer.status !== 'Proposed') continue;
      if (offer.hype > 100 || offer.purse > 200) {
        const impact = respondToBoutOffer(state, offer.id, warrior.id, 'Accepted');
        state = resolveImpacts(state, [impact]);
      }
    }
  }
  return state;
}

function processPlayerOffersScan(state: GameState): GameState {
  const playerIds = new Set(state.roster.map((w) => w.id));
  const playerOffers = Object.values(state.boutOffers).filter(
    (o) => o.status === 'Proposed' && o.warriorIds.some((id) => playerIds.has(id))
  );

  playerOffers.forEach((offer) => {
    const playerWarriorId = offer.warriorIds.find((id) => playerIds.has(id));
    if (!playerWarriorId) return;
    if (offer.hype > 100 || offer.purse > 200) {
      const impact = respondToBoutOffer(state, offer.id, playerWarriorId as WarriorId, 'Accepted');
      state = resolveImpacts(state, [impact]);
    }
  });

  return state;
}

/**
 * Extract week summary from state after advancement.
 */
export function extractWeekSummary(state: GameState, weekNumber: number): AutosimWeekSummary {
  const boutSummaries = state.lastSimulationReport?.bouts ?? [];
  const deathNames: string[] = [];
  for (let i = 0; i < boutSummaries.length; i++) {
    const b = boutSummaries[i];
    if (!b) continue;
    if (b.by === 'Kill') {
      const n = getNamesFromTitle(b.title);
      deathNames.push(b.winner === 'A' ? n.d : n.a);
    }
  }

  return {
    week: weekNumber,
    bouts: boutSummaries.length,
    deaths: deathNames.length,
    injuries: 0,
    deathNames,
    injuryNames: [],
  };
}

/**
 * Check bankruptcy condition
 */
function checkBankruptcy(state: GameState): boolean {
  return state.treasury < BANKRUPTCY_THRESHOLD;
}

/**
 * Run the autosimulation — a single sequential week-advancement path.
 *
 * The old dual-path (sequential vs. quarter-chunked "batch") design has been
 * removed: batch mode deferred player-offer processing to quarter boundaries
 * and only evaluated stop conditions per chunk, so the two paths could
 * diverge. There is now exactly one loop; the per-week clone overhead that
 * motivated batching is instead eliminated by `mutableInput` (weeks after the
 * first run on autosim-owned state, no structuredClone needed).
 *
 * Stop conditions are evaluated after EVERY week, so a death/empty roster/
 * missing pairings halts the run immediately rather than at a 13-week
 * checkpoint.
 */
export async function runAutosim(
  initialState: GameState,
  options: AutosimOptions
): Promise<AutosimResult> {
  const { weeksToSim, onProgress } = options;
  const stopConditions = options.stopConditions ?? DEFAULT_AUTOSIM_STOP_CONDITIONS;
  let state = initialState;
  let weeksSimmed = 0;
  const weekSummaries: AutosimWeekSummary[] = [];

  for (let i = 0; i < weeksToSim; i++) {
    // 1. Advance week headless. Week 1 clones the caller-owned input; weeks
    // after that run on the state advanceWeek itself returned — exclusively
    // owned by this loop — so mutableInput skips the structuredClone.
    state = await advanceWeek(state, {
      headless: true,
      mutableInput: i > 0,
    });

    // 2. Auto-respond to player contracts
    state = processPlayerOffers(state);

    // 3. Extract week summary
    weekSummaries.push(extractWeekSummary(state, state.week));
    weeksSimmed++;

    // NF3: truncate historical arrays periodically to bound memory growth.
    // deferredBoutLogs needs no flush — headless bouts produce no transcripts.
    if (weeksSimmed % 50 === 0) {
      state = truncateState(state);
    }

    if (onProgress) {
      onProgress(weeksSimmed, weeksToSim);
    }

    // 4. Per-week stop conditions (roster empty / no pairings / player death /
    // custom), then the autosim-specific bankruptcy gate.
    const stop = evaluateStopConditions(state, stopConditions);
    if (stop.shouldStop) {
      return {
        finalState: truncateState(state),
        weeksSimmed,
        stopReason: mapStopReason(stop.reason),
        stopDetail: `Stopped: ${stop.reason}`,
        weekSummaries,
      };
    }
    if (checkBankruptcy(state)) {
      return {
        finalState: truncateState(state),
        weeksSimmed,
        stopReason: 'bankrupt',
        stopDetail: 'Stable ran out of treasury',
        weekSummaries,
      };
    }
  }

  return {
    finalState: truncateState(state),
    weeksSimmed,
    stopReason: 'max_weeks',
    stopDetail: 'Reached maximum simulation weeks',
    weekSummaries,
  };
}
