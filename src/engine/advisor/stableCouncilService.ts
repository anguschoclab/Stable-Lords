import type { GameState, BoutOffer } from '@/types/state.types';
import type {
  WarriorAdvisorCard,
  StableAdvisorSummary,
  StableCouncilReport,
  CouncilLookahead,
} from './types';
import { isActive } from '@/engine/warrior/warriorStatus';
import { TRAINING_COST } from '@/constants/economy';
import { deriveAbsoluteWeek, weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';
import { buildContenderIndex } from '@/engine/championship/arenaChampionship';
import { buildWarriorCard, type CardBuildContext } from './stableCouncil/cards';
import {
  computeCardKpis,
  buildStableDirectives,
  collectUnresolvedDirectives,
} from './stableCouncil/directives';
import {
  listFutureCommitments,
  listRecoveryEtas,
  listTitleDefenses,
} from './stableCouncil/lookahead';

/** Unassigned-training count, pending-offer count, and solvency warning. */
function computeSummarySignals(
  state: GameState,
  activeWarriors: GameState['roster'],
  playerWarriorIds: Set<string>
) {
  const assignedWarriorIds = new Set((state.trainingAssignments || []).map((a) => a.warriorId));
  const unassignedTrainingCount = activeWarriors.filter(
    (w) => !assignedWarriorIds.has(w.id)
  ).length;

  const pendingBoutOffersCount = Object.values(state.boutOffers || {}).filter(
    (o: BoutOffer) =>
      o.status === 'Proposed' &&
      o.warriorIds.some((wid) => playerWarriorIds.has(wid) && o.responses[wid] === 'Pending')
  ).length;

  const projectedTrainingCost = activeWarriors.length * TRAINING_COST;
  const treasury = state.treasury ?? 0;
  const solvencyWarning =
    treasury < 0
      ? `Treasury in deficit (${treasury}G) — stable is approaching bankruptcy.`
      : treasury < projectedTrainingCost
        ? `Treasury (${treasury}G) cannot cover projected training costs (${projectedTrainingCost}G).`
        : undefined;

  return {
    assignedWarriorIds,
    unassignedTrainingCount,
    pendingBoutOffersCount,
    projectedTrainingCost,
    treasury,
    solvencyWarning,
  };
}

/** Multi-week lookahead: commitments, recoveries, tournament countdown, defenses. */
function buildLookahead(
  state: GameState,
  cards: WarriorAdvisorCard[],
  activeWarriors: GameState['roster'],
  playerWarriorIds: Set<string>,
  currentAbsWeek: number,
  upcomingAbsWeek: number
): CouncilLookahead {
  return {
    futureCommitments: listFutureCommitments(state, cards, playerWarriorIds, upcomingAbsWeek),
    recoveryEtas: listRecoveryEtas(activeWarriors, currentAbsWeek),
    // isTournamentWeek is authoritative (matches evaluateTournamentAdvice) —
    // brackets run day-by-day. The countdown tracks seasonals only: the
    // Grand Championship isn't a bracket most warriors can enter.
    weeksUntilTournament: state.isTournamentWeek ? 0 : weeksUntilNextSeasonalTournament(state.week),
    projectedContenders: cards
      .filter((c) => c.tournamentAdvice.qualifiedTier !== null)
      .map((c) => ({
        warriorId: c.warriorId,
        warriorName: c.warriorName,
        tierName: c.tournamentAdvice.tierName ?? c.tournamentAdvice.qualifiedTier ?? 'Unknown Tier',
      })),
    titleDefenses: listTitleDefenses(state, cards, playerWarriorIds),
  };
}

/**
 * Compute a complete Stable Council Report evaluating all active roster warriors.
 * Uncached — safe for callers that mutate a GameState in place (e.g. the autosim
 * loop's mutableInput path, where the same object identity persists across weeks).
 * React/UI subscribers should use buildStableCouncilReport instead.
 * @see buildStableCouncilReport — the snapshot-memoized wrapper for React subscribers
 */
export function computeStableCouncilReport(state: GameState): StableCouncilReport {
  const activeWarriors = (state.roster || []).filter(isActive);
  // One ladder rank for the whole report — the same shared perception
  // primitive rival crown campaigns use, not a per-warrior re-scan.
  const contenderIndex = buildContenderIndex(state);

  // warriorId → the arena they reign over — the crown a champion defends is
  // state the card surfaces as "defending", not a ladder rank.
  const championArenaByWarrior = new Map<string, string>();
  for (const [arenaId, t] of Object.entries(state.arenaChampions ?? {})) {
    if (t?.champion) championArenaByWarrior.set(t.champion.warriorId, arenaId);
  }

  const ctx: CardBuildContext = { state, contenderIndex, championArenaByWarrior };
  const cards: WarriorAdvisorCard[] = activeWarriors.map((w) => buildWarriorCard(w, ctx));

  const kpis = computeCardKpis(cards);

  const playerWarriorIds = new Set(activeWarriors.map((w) => w.id));
  const {
    assignedWarriorIds,
    unassignedTrainingCount,
    pendingBoutOffersCount,
    projectedTrainingCost,
    treasury,
    solvencyWarning,
  } = computeSummarySignals(state, activeWarriors, playerWarriorIds);

  const { stableDirectives, unresolvedDirectives, lookahead } = buildCouncilSections(
    state,
    cards,
    kpis,
    activeWarriors,
    playerWarriorIds,
    assignedWarriorIds,
    unassignedTrainingCount,
    projectedTrainingCost,
    treasury
  );

  const allActionPayloads = cards.map((c) => c.actionPayload);

  const summary: StableAdvisorSummary = {
    totalWarriors: activeWarriors.length,
    combatReadyCount: kpis.combatReadyCount,
    rehabCount: kpis.rehabCount,
    tournamentContenderCount: kpis.tournamentContenderCount,
    unassignedTrainingCount,
    pendingBoutOffersCount,
    projectedPurseGold: kpis.projectedPurseGold,
    projectedTrainingCost,
    treasury,
    solvencyWarning,
    stableDirectives,
    allActionPayloads,
  };

  return {
    summary,
    cards,
    unresolvedDirectives,
    lookahead,
  };
}

/** Stable directives, unresolved directive queue, and the multi-week lookahead. */
function buildCouncilSections(
  state: GameState,
  cards: WarriorAdvisorCard[],
  kpis: ReturnType<typeof computeCardKpis>,
  activeWarriors: GameState['roster'],
  playerWarriorIds: Set<string>,
  assignedWarriorIds: Set<string>,
  unassignedTrainingCount: number,
  projectedTrainingCost: number,
  treasury: number
): {
  stableDirectives: ReturnType<typeof buildStableDirectives>;
  unresolvedDirectives: ReturnType<typeof collectUnresolvedDirectives>;
  lookahead: ReturnType<typeof buildLookahead>;
} {
  const stableDirectives = buildStableDirectives(
    state,
    cards,
    kpis,
    unassignedTrainingCount,
    projectedTrainingCost,
    treasury
  );

  const currentAbsWeek = state.absoluteWeek ?? deriveAbsoluteWeek(state.year, state.week);
  const upcomingAbsWeek = currentAbsWeek + 1;

  const unresolvedDirectives = collectUnresolvedDirectives(
    state,
    cards,
    activeWarriors,
    playerWarriorIds,
    assignedWarriorIds,
    upcomingAbsWeek
  );

  return {
    stableDirectives,
    unresolvedDirectives,
    lookahead: buildLookahead(
      state,
      cards,
      activeWarriors,
      playerWarriorIds,
      currentAbsWeek,
      upcomingAbsWeek
    ),
  };
}

const reportCache = new WeakMap<GameState, StableCouncilReport>();

/**
 * Snapshot-memoized report builder for React subscribers. `useWorldState`
 * (reconstructGameState) mints a new GameState object whenever any tracked
 * field changes, so a reference-keyed WeakMap dedupes the N concurrent
 * useStableAdvisor() mounts (Advisor page, Training, BookingOffice,
 * ControlCenter widget) down to one computation per store snapshot.
 * Engine-side callers that mutate state in place must call
 * computeStableCouncilReport directly — a ref-keyed cache cannot see
 * in-place mutation.
 * @see computeStableCouncilReport — the uncached implementation this memoizes
 */
export function buildStableCouncilReport(state: GameState): StableCouncilReport {
  const cached = reportCache.get(state);
  if (cached) return cached;
  const report = computeStableCouncilReport(state);
  reportCache.set(state, report);
  return report;
}
