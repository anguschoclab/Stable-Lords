import type { WarriorId } from '@/types/shared.types';
import type { GameState, TrainingAssignment } from '@/types/state.types';
import type { WarriorAdvisorCard, WarriorActionPayload } from '../types';
import { evaluateCampaignFocus } from '../campaignFocusEvaluator';
import { evaluateTournamentAdvice } from '../tournamentAdvisor';
import { evaluateBoutOffers } from '../boutOfferAdvisor';
import { evaluateTrainingAdvice } from '../trainingAdvisor';
import { evaluateTacticsAdvice } from '../tacticsAdvisorBridge';
import { getFatigueBand } from '@/engine/core/fatigueUtils';
/** Shared per-report evaluation context threaded into each card build. */
export interface CardBuildContext {
  state: GameState;
  contenderIndex: Map<string, WarriorId[]>;
  championArenaByWarrior: Map<string, string>;
}

/**
 * Construct the warrior's weekly Training Assignment — but only when their
 * week is training rather than fighting. isBookable() excludes warriors
 * holding any assignment, so a warrior booked to fight (ACCEPT_OFFER) or a
 * fight-focused warrior waiting for offers must carry none, or the
 * promoter/challenge pipeline can never book them (autopilot starvation).
 */
function buildTrainingAssignment(
  warrior: GameState['roster'][number],
  fightAdvice: WarriorAdvisorCard['fightAdvice'],
  trainingAdvice: WarriorAdvisorCard['trainingAdvice'],
  holdsForBooking: boolean
): TrainingAssignment | undefined {
  if (fightAdvice.action === 'ACCEPT_OFFER' || holdsForBooking) return undefined;
  if (trainingAdvice.mode === 'recovery') {
    return { warriorId: warrior.id, type: 'recovery' };
  }
  if (trainingAdvice.mode === 'skillDrill') {
    return {
      warriorId: warrior.id,
      type: 'skillDrill',
      skill: trainingAdvice.targetSkill ?? 'ATT',
    };
  }
  if (trainingAdvice.mode === 'trait') {
    return {
      warriorId: warrior.id,
      type: 'trait',
      trainerId: trainingAdvice.targetTrainerId,
      weeksRemaining: 4,
    };
  }
  return {
    warriorId: warrior.id,
    type: 'attribute',
    attribute: trainingAdvice.targetAttribute ?? 'ST',
  };
}

/**
 * Crown standing — the warrior's best title-ladder position, read off the
 * shared contender index (same ordering rivals campaign against). A
 * reigning champion reports the arena they defend instead.
 */
function resolveCrownStanding(
  warriorId: WarriorId,
  ctx: CardBuildContext
): WarriorAdvisorCard['crownStanding'] {
  const championArena = ctx.championArenaByWarrior.get(warriorId);
  if (championArena) return { arenaId: championArena, isChampion: true };
  let bestArena: string | undefined;
  let bestRank = Infinity;
  for (const [arenaId, ids] of ctx.contenderIndex) {
    const idx = ids.indexOf(warriorId);
    if (idx >= 0 && idx + 1 < bestRank) {
      bestRank = idx + 1;
      bestArena = arenaId;
    }
  }
  if (bestArena) return { arenaId: bestArena, rank: bestRank, isChampion: false };
  return undefined;
}

/** Synthesize a concise 1-sentence headline summary for the card. */
function composeHeadline(
  fightAdvice: WarriorAdvisorCard['fightAdvice'],
  tournamentAdvice: WarriorAdvisorCard['tournamentAdvice'],
  trainingAdvice: WarriorAdvisorCard['trainingAdvice']
): string {
  if (fightAdvice.action === 'ACCEPT_OFFER') {
    return `${fightAdvice.headline} · ${trainingAdvice.headline}`;
  }
  if (fightAdvice.action === 'BLOCKED_BY_INJURY') {
    return `Med Bay recovery mandated · Combat blocked by injury`;
  }
  if (tournamentAdvice.status === 'CONTENDER_REST') {
    return `Resting for ${tournamentAdvice.tierName} · ${trainingAdvice.headline}`;
  }
  return `${trainingAdvice.headline}.`;
}

/** Fatigue/injury status + whether the council holds the warrior for booking. */
function deriveBookingStatus(
  warrior: GameState['roster'][number],
  campaignFocus: ReturnType<typeof evaluateCampaignFocus>,
  tournamentAdvice: ReturnType<typeof evaluateTournamentAdvice>,
  fightAdvice: ReturnType<typeof evaluateBoutOffers>
) {
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

  const requiresRecovery = campaignFocus === 'REHABILITATION' || injuryStatus.requiresRecovery;
  const wantsBooking =
    !requiresRecovery &&
    (campaignFocus === 'PURSE_HUNTER' ||
      campaignFocus === 'VETERAN_TWILIGHT' ||
      campaignFocus === 'CROWN_BID' ||
      (campaignFocus === 'TOURNAMENT_PUSH' && tournamentAdvice.status === 'QUALIFYING'));
  const holdsForBooking = fightAdvice.action === 'NO_VIABLE_OFFERS' && wantsBooking;

  return { fatigueStatus, injuryStatus, holdsForBooking };
}

/** One-shot action payload the Apply-All commit feeds back into the store. */
function buildActionPayload(
  warrior: GameState['roster'][number],
  trainingAssignment: ReturnType<typeof buildTrainingAssignment>,
  fightAdvice: ReturnType<typeof evaluateBoutOffers>,
  tacticsAdvice: ReturnType<typeof evaluateTacticsAdvice>
): WarriorActionPayload {
  return {
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
      ...(tacticsAdvice.suggestedConditions?.length
        ? { conditions: tacticsAdvice.suggestedConditions }
        : {}),
    },
  };
}

/** Builds one warrior's advisor card from the shared evaluation context. */
export function buildWarriorCard(
  warrior: GameState['roster'][number],
  ctx: CardBuildContext
): WarriorAdvisorCard {
  const { state, contenderIndex } = ctx;
  const campaignFocus = evaluateCampaignFocus(warrior, state, contenderIndex);
  // What the council would recommend absent the player's pin — lets the UI
  // surface "Suggested: X" when the pin diverges from auto-detection.
  const suggestedCampaignFocus = evaluateCampaignFocus(
    { ...warrior, campaignFocus: undefined },
    state,
    contenderIndex
  );
  const tournamentAdvice = evaluateTournamentAdvice(warrior, state);
  const fightAdvice = evaluateBoutOffers(warrior, state, campaignFocus, tournamentAdvice, {
    contenderIndex,
  });
  const trainingAdvice = evaluateTrainingAdvice(warrior, state);
  const tacticsAdvice = evaluateTacticsAdvice(warrior, campaignFocus, {
    opponent: fightAdvice.opponent ?? undefined,
    state,
  });

  const { fatigueStatus, injuryStatus, holdsForBooking } = deriveBookingStatus(
    warrior,
    campaignFocus,
    tournamentAdvice,
    fightAdvice
  );

  const trainingAssignment = buildTrainingAssignment(
    warrior,
    fightAdvice,
    trainingAdvice,
    holdsForBooking
  );

  const actionPayload = buildActionPayload(warrior, trainingAssignment, fightAdvice, tacticsAdvice);

  const crownStanding = resolveCrownStanding(warrior.id, ctx);
  const headlineSummary = composeHeadline(fightAdvice, tournamentAdvice, trainingAdvice);

  return {
    warriorId: warrior.id,
    warriorName: warrior.name,
    style: warrior.style,
    campaignFocus,
    suggestedCampaignFocus,
    crownStanding,
    fatigueStatus,
    injuryStatus,
    fightAdvice,
    tournamentAdvice,
    trainingAdvice,
    tacticsAdvice,
    headlineSummary,
    actionPayload,
  };
}
