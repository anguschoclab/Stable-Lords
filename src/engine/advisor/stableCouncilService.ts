/**
 * Master Stable Council Service
 * Synthesizes per-warrior advisories into an executive War Council briefing,
 * computing stable-wide KPIs, prioritized directives, and atomic execution payloads.
 */
import type { GameState, TrainingAssignment, BoutOffer } from '@/types/state.types';
import type {
  WarriorAdvisorCard,
  StableAdvisorSummary,
  StableCouncilReport,
  WarriorActionPayload,
  CouncilDirective,
  CouncilLookahead,
} from './types';
import { evaluateCampaignFocus } from './campaignFocusEvaluator';
import { evaluateTournamentAdvice } from './tournamentAdvisor';
import { evaluateBoutOffers } from './boutOfferAdvisor';
import { evaluateTrainingAdvice } from './trainingAdvisor';
import { evaluateTacticsAdvice } from './tacticsAdvisorBridge';
import { getOpponentIntel } from './intelAdvisor';
import { isActive } from '@/engine/warriorStatus';
import { getFatigueBand } from '@/engine/core/fatigueUtils';
import { TRAINING_COST } from '@/constants/economy';
import { boutOfferAbsoluteWeek, deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { getScoutCost } from '@/engine/scouting';

/**
 * Compute a complete Stable Council Report evaluating all active roster warriors.
 * Uncached — safe for callers that mutate a GameState in place (e.g. the autosim
 * loop's mutableInput path, where the same object identity persists across weeks).
 * React/UI subscribers should use buildStableCouncilReport instead.
 * @see buildStableCouncilReport — the snapshot-memoized wrapper for React subscribers
 */
export function computeStableCouncilReport(state: GameState): StableCouncilReport {
  const activeWarriors = (state.roster || []).filter(isActive);

  const cards: WarriorAdvisorCard[] = activeWarriors.map((warrior) => {
    const campaignFocus = evaluateCampaignFocus(warrior, state);
    // What the council would recommend absent the player's pin — lets the UI
    // surface "Suggested: X" when the pin diverges from auto-detection.
    const suggestedCampaignFocus = evaluateCampaignFocus(
      { ...warrior, campaignFocus: undefined },
      state
    );
    const tournamentAdvice = evaluateTournamentAdvice(warrior, state);
    const fightAdvice = evaluateBoutOffers(warrior, state, campaignFocus, tournamentAdvice);
    const trainingAdvice = evaluateTrainingAdvice(warrior, state);
    const tacticsAdvice = evaluateTacticsAdvice(warrior, campaignFocus, {
      opponent: fightAdvice.opponent ?? undefined,
      state,
    });

    const fatigue = warrior.fatigue ?? 0;
    const fatigueStatus = {
      band: getFatigueBand(fatigue),
      value: fatigue,
    };

    const injuryStatus = {
      isInjured: (warrior.injuries || []).some((i) => (i.weeksRemaining ?? 1) > 0),
      severities: (warrior.injuries || []).map((i) => i.severity),
      requiresRecovery: campaignFocus === 'REHABILITATION',
    };

    // Construct Training Assignment — but only when this warrior's week is
    // training rather than fighting. isBookable() excludes warriors holding
    // any assignment, so a warrior booked to fight (ACCEPT_OFFER) or a
    // fight-focused warrior waiting for offers must carry none, or the
    // promoter/challenge pipeline can never book them (autopilot starvation).
    const requiresRecovery =
      campaignFocus === 'REHABILITATION' || injuryStatus.requiresRecovery;
    const wantsBooking =
      !requiresRecovery &&
      (campaignFocus === 'PURSE_HUNTER' ||
        campaignFocus === 'VETERAN_TWILIGHT' ||
        (campaignFocus === 'TOURNAMENT_PUSH' &&
          tournamentAdvice.status === 'QUALIFYING'));
    const holdsForBooking =
      fightAdvice.action === 'NO_VIABLE_OFFERS' && wantsBooking;

    let trainingAssignment: TrainingAssignment | undefined;
    if (fightAdvice.action === 'ACCEPT_OFFER' || holdsForBooking) {
      trainingAssignment = undefined;
    } else if (trainingAdvice.mode === 'recovery') {
      trainingAssignment = { warriorId: warrior.id, type: 'recovery' };
    } else if (trainingAdvice.mode === 'skillDrill') {
      trainingAssignment = {
        warriorId: warrior.id,
        type: 'skillDrill',
        skill: trainingAdvice.targetSkill ?? 'ATT',
      };
    } else if (trainingAdvice.mode === 'trait') {
      trainingAssignment = {
        warriorId: warrior.id,
        type: 'trait',
        trainerId: trainingAdvice.targetTrainerId,
        weeksRemaining: 4,
      };
    } else {
      trainingAssignment = {
        warriorId: warrior.id,
        type: 'attribute',
        attribute: trainingAdvice.targetAttribute ?? 'ST',
      };
    }

    const actionPayload: WarriorActionPayload = {
      warriorId: warrior.id,
      trainingAssignment,
      boutOfferIdToAccept:
        fightAdvice.action === 'ACCEPT_OFFER' ? fightAdvice.recommendedOfferId : undefined,
      tacticsPlanPatch: {
        offensiveTactic: tacticsAdvice.bestOffensiveTactic,
        defensiveTactic: tacticsAdvice.bestDefensiveTactic,
        OE: tacticsAdvice.suggestedOE,
        AL: tacticsAdvice.suggestedAL,
        fallbackCondition: tacticsAdvice.fallbackCondition,
      },
    };

    // Synthesize concise 1-sentence headline summary
    let headlineSummary = `${trainingAdvice.headline}.`;
    if (fightAdvice.action === 'ACCEPT_OFFER') {
      headlineSummary = `${fightAdvice.headline} · ${trainingAdvice.headline}`;
    } else if (fightAdvice.action === 'BLOCKED_BY_INJURY') {
      headlineSummary = `Med Bay recovery mandated · Combat blocked by injury`;
    } else if (tournamentAdvice.status === 'CONTENDER_REST') {
      headlineSummary = `Resting for ${tournamentAdvice.tierName} · ${trainingAdvice.headline}`;
    }

    return {
      warriorId: warrior.id,
      warriorName: warrior.name,
      style: warrior.style,
      campaignFocus,
      suggestedCampaignFocus,
      fatigueStatus,
      injuryStatus,
      fightAdvice,
      tournamentAdvice,
      trainingAdvice,
      tacticsAdvice,
      headlineSummary,
      actionPayload,
    };
  });

  // Calculate Stable-wide KPIs in a single pass
  let combatReadyCount = 0;
  let rehabCount = 0;
  let tournamentContenderCount = 0;
  let projectedPurseGold = 0;
  for (const c of cards) {
    if (c.fightAdvice.action === 'ACCEPT_OFFER') {
      combatReadyCount++;
      if (c.fightAdvice.recommendedOffer) {
        projectedPurseGold += c.fightAdvice.recommendedOffer.purse ?? 0;
      }
    }
    if (c.campaignFocus === 'REHABILITATION') rehabCount++;
    if (c.tournamentAdvice.qualifiedTier !== null) tournamentContenderCount++;
  }

  const assignedWarriorIds = new Set(
    (state.trainingAssignments || []).map((a) => a.warriorId)
  );
  const unassignedTrainingCount = activeWarriors.filter(
    (w) => !assignedWarriorIds.has(w.id)
  ).length;

  const playerWarriorIds = new Set(activeWarriors.map((w) => w.id));
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

  // Synthesize High-Priority Stable Directives
  const stableDirectives: string[] = [];
  if (treasury < 0) {
    stableDirectives.push(
      `🛑 Treasury deficit (${treasury}G): accept purse bouts and suspend paid coaching before bankruptcy.`
    );
  } else if (treasury < projectedTrainingCost) {
    stableDirectives.push(
      `💰 Treasury (${treasury}G) cannot cover projected training (${projectedTrainingCost}G): prioritize purse bouts and defer paid coaching.`
    );
  }
  if (rehabCount > 0) {
    stableDirectives.push(
      `⚠️ ${rehabCount} warrior${rehabCount > 1 ? 's' : ''} require Med Bay recovery due to active injuries or elevated fatigue.`
    );
  }
  if (combatReadyCount > 0) {
    stableDirectives.push(
      `⚔️ ${combatReadyCount} warrior${combatReadyCount > 1 ? 's have' : ' has'} favorable bout offers with predicted matchup advantages.`
    );
  }
  const restingContenders = cards.filter(
    (c) => c.tournamentAdvice.status === 'CONTENDER_REST'
  ).length;
  if (restingContenders > 0) {
    stableDirectives.push(
      `🏆 ${restingContenders} contender${restingContenders > 1 ? 's are' : ' is'} tapering combat to peak for upcoming seasonal tournament brackets.`
    );
  }
  if (unassignedTrainingCount > 0) {
    stableDirectives.push(
      `🏋️ ${unassignedTrainingCount} warrior${unassignedTrainingCount > 1 ? 's need' : ' needs'} weekly training assignments.`
    );
  }
  // Deeper scouting: flag recommended bouts where the opponent has no dossier
  // and a Basic report is affordable — intel feeds both scoring and tactics.
  const blindOpponents = cards
    .filter(
      (c) =>
        c.fightAdvice.action === 'ACCEPT_OFFER' &&
        c.fightAdvice.opponent &&
        getOpponentIntel(state, c.fightAdvice.opponent.id).length === 0
    )
    .map((c) => c.fightAdvice.opponent?.name ?? 'Unknown Opponent');
  const basicScoutCost = getScoutCost('Basic');
  if (blindOpponents.length > 0 && treasury >= basicScoutCost) {
    stableDirectives.push(
      `🕵️ No scout dossier on ${blindOpponents.slice(0, 3).join(', ')}${
        blindOpponents.length > 3 ? ` and ${blindOpponents.length - 3} more` : ''
      } — commission a Basic scout report (${basicScoutCost}G) before signing.`
    );
  }

  if (stableDirectives.length === 0) {
    stableDirectives.push('Stable operations are balanced. Review individual warrior profiles below.');
  }

  // ── Pre-advance checklist: council recommendations not yet in live state ──
  const currentAbsWeek = state.absoluteWeek ?? deriveAbsoluteWeek(state.year, state.week);
  const upcomingAbsWeek = currentAbsWeek + 1;
  const fightingIds = new Set(
    cards.filter((c) => c.fightAdvice.action === 'ACCEPT_OFFER').map((c) => c.warriorId)
  );
  for (const o of Object.values(state.boutOffers || {})) {
    if (o.status === 'Signed' && boutOfferAbsoluteWeek(o) === upcomingAbsWeek) {
      for (const wid of o.warriorIds) {
        if (playerWarriorIds.has(wid)) fightingIds.add(wid);
      }
    }
  }

  const unresolvedDirectives: CouncilDirective[] = [];
  for (const card of cards) {
    const warrior = activeWarriors.find((w) => w.id === card.warriorId);
    if (!warrior) continue;

    const offerId = card.actionPayload.boutOfferIdToAccept;
    if (offerId) {
      const offer = state.boutOffers?.[offerId];
      const response = offer?.responses?.[card.warriorId];
      if (offer && response !== 'Accepted' && response !== 'Declined') {
        unresolvedDirectives.push({
          kind: 'unsigned-offer',
          warriorId: card.warriorId,
          warriorName: card.warriorName,
          label: `Sign bout contract vs ${card.fightAdvice.opponent?.name ?? 'opponent'} (${offer.purse}G)`,
        });
      }
    }

    const assignment = card.actionPayload.trainingAssignment;
    if (assignment && !assignedWarriorIds.has(card.warriorId)) {
      unresolvedDirectives.push({
        kind: 'unassigned-training',
        warriorId: card.warriorId,
        warriorName: card.warriorName,
        label: `Assign ${assignment.type} training`,
      });
    }

    if (fightingIds.has(card.warriorId) && card.actionPayload.tacticsPlanPatch) {
      const plan = warrior.plan;
      const patch = card.actionPayload.tacticsPlanPatch;
      const diverged =
        !plan ||
        plan.OE !== patch.OE ||
        plan.AL !== patch.AL ||
        plan.offensiveTactic !== patch.offensiveTactic ||
        plan.defensiveTactic !== patch.defensiveTactic ||
        plan.fallbackCondition !== patch.fallbackCondition;
      if (diverged) {
        unresolvedDirectives.push({
          kind: 'unapplied-tactics',
          warriorId: card.warriorId,
          warriorName: card.warriorName,
          label: 'Apply recommended tactics plan',
        });
      }
    }
  }

  // ── Multi-week lookahead ──
  const futureCommitments = Object.values(state.boutOffers || {})
    .filter((o) => {
      const playerId = o.warriorIds.find((wid) => playerWarriorIds.has(wid));
      return (
        playerId !== undefined &&
        boutOfferAbsoluteWeek(o) > upcomingAbsWeek &&
        (o.status === 'Signed' || o.responses[playerId] === 'Accepted')
      );
    })
    .map((o) => {
      const playerId = o.warriorIds.find((wid) => playerWarriorIds.has(wid));
      if (playerId === undefined) return null;
      const opponentId = o.warriorIds.find((wid) => wid !== playerId);
      return {
        offerId: o.id,
        warriorId: playerId,
        warriorName: cards.find((c) => c.warriorId === playerId)?.warriorName ?? playerId,
        opponentName: opponentId
          ? (findWarriorById(state, opponentId)?.name ?? 'Unknown Opponent')
          : 'Unknown Opponent',
        absoluteWeek: boutOfferAbsoluteWeek(o),
        purse: o.purse,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.absoluteWeek - b.absoluteWeek);

  const recoveryEtas = activeWarriors
    .map((w) => {
      const weeks = Math.max(
        0,
        ...(w.injuries || []).map((i) => i.weeksRemaining ?? 0)
      );
      return weeks > 0
        ? {
            warriorId: w.id,
            warriorName: w.name,
            weeksRemaining: weeks,
            returnsAbsoluteWeek: currentAbsWeek + weeks,
          }
        : null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const seasonWeek = ((state.week - 1) % 13) + 1;
  const lookahead: CouncilLookahead = {
    futureCommitments,
    recoveryEtas,
    // isTournamentWeek is authoritative (matches evaluateTournamentAdvice) —
    // brackets run day-by-day and the calendar week isn't necessarily 13.
    weeksUntilTournament: state.isTournamentWeek ? 0 : 13 - seasonWeek,
    projectedContenders: cards
      .filter((c) => c.tournamentAdvice.qualifiedTier !== null)
      .map((c) => ({
        warriorId: c.warriorId,
        warriorName: c.warriorName,
        tierName: c.tournamentAdvice.tierName ?? c.tournamentAdvice.qualifiedTier ?? 'Unknown Tier',
      })),
  };

  const allActionPayloads = cards.map((c) => c.actionPayload);

  const summary: StableAdvisorSummary = {
    totalWarriors: activeWarriors.length,
    combatReadyCount,
    rehabCount,
    tournamentContenderCount,
    unassignedTrainingCount,
    pendingBoutOffersCount,
    projectedPurseGold,
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
