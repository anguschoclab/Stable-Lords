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
} from './types';
import { evaluateCampaignFocus } from './campaignFocusEvaluator';
import { evaluateTournamentAdvice } from './tournamentAdvisor';
import { evaluateBoutOffers } from './boutOfferAdvisor';
import { evaluateTrainingAdvice } from './trainingAdvisor';
import { evaluateTacticsAdvice } from './tacticsAdvisorBridge';
import { isActive } from '@/engine/warriorStatus';
import { getFatigueBand } from '@/engine/core/fatigueUtils';

/**
 * Generate a complete Stable Council Report evaluating all active roster warriors.
 */
export function buildStableCouncilReport(state: GameState): StableCouncilReport {
  const activeWarriors = (state.roster || []).filter(isActive);

  const cards: WarriorAdvisorCard[] = activeWarriors.map((warrior) => {
    const campaignFocus = evaluateCampaignFocus(warrior, state);
    const tournamentAdvice = evaluateTournamentAdvice(warrior, state);
    const fightAdvice = evaluateBoutOffers(warrior, state, campaignFocus, tournamentAdvice);
    const trainingAdvice = evaluateTrainingAdvice(warrior, state);
    const tacticsAdvice = evaluateTacticsAdvice(warrior, campaignFocus);

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

    // Construct Training Assignment
    let trainingAssignment: TrainingAssignment;
    if (trainingAdvice.mode === 'recovery') {
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
      suggestedCampaignFocus: campaignFocus,
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

  // Calculate Stable-wide KPIs
  const combatReadyCount = cards.filter((c) => c.fightAdvice.action === 'ACCEPT_OFFER').length;
  const rehabCount = cards.filter((c) => c.campaignFocus === 'REHABILITATION').length;
  const tournamentContenderCount = cards.filter(
    (c) => c.tournamentAdvice.qualifiedTier !== null
  ).length;

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

  const projectedPurseGold = cards.reduce((acc, c) => {
    if (c.fightAdvice.action === 'ACCEPT_OFFER' && c.fightAdvice.recommendedOffer) {
      return acc + (c.fightAdvice.recommendedOffer.purse ?? 0);
    }
    return acc;
  }, 0);

  const projectedTrainingCost = activeWarriors.length * 20;

  // Synthesize High-Priority Stable Directives
  const stableDirectives: string[] = [];
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
  if (stableDirectives.length === 0) {
    stableDirectives.push('Stable operations are balanced. Review individual warrior profiles below.');
  }

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
    stableDirectives,
    allActionPayloads,
  };

  return {
    summary,
    cards,
  };
}
