import type { GameState } from '@/types/state.types';
import type { WarriorAdvisorCard, CouncilDirective } from '../types';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { getOpponentIntel } from '../intelAdvisor';
import { getScoutCost } from '@/engine/scouting/scouting';
/** Stable-wide KPI counters, computed in a single pass over the cards. */
export function computeCardKpis(cards: WarriorAdvisorCard[]): {
  combatReadyCount: number;
  rehabCount: number;
  tournamentContenderCount: number;
  projectedPurseGold: number;
} {
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
  return { combatReadyCount, rehabCount, tournamentContenderCount, projectedPurseGold };
}

/** Synthesize high-priority stable directives from KPIs and card signals. */
export function buildStableDirectives(
  state: GameState,
  cards: WarriorAdvisorCard[],
  kpis: ReturnType<typeof computeCardKpis>,
  unassignedTrainingCount: number,
  projectedTrainingCost: number,
  treasury: number
): string[] {
  const { combatReadyCount, rehabCount } = kpis;
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
  const crownBids = cards.filter((c) => c.campaignFocus === 'CROWN_BID');
  if (crownBids.length > 0) {
    stableDirectives.push(
      `👑 ${crownBids.length} warrior${crownBids.length > 1 ? 's are' : ' is'} ranked arena contender${crownBids.length > 1 ? 's' : ''} — venue bouts build the title challenge.`
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
  return stableDirectives;
}

/**
 * Pre-advance checklist: council recommendations not yet reflected in live
 * state — unsigned bout offers, missing training assignments, and diverged
 * tactics plans for warriors fighting next week.
 */
export function collectUnresolvedDirectives(
  state: GameState,
  cards: WarriorAdvisorCard[],
  activeWarriors: GameState['roster'],
  playerWarriorIds: Set<string>,
  assignedWarriorIds: Set<string>,
  upcomingAbsWeek: number
): CouncilDirective[] {
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
      // A suggested condition counts as unapplied only when no authored
      // condition already covers the same trigger type.
      const uncoveredSuggestion = (patch.conditions ?? []).some(
        (c) => !(plan?.conditions ?? []).some((p) => p.trigger.type === c.trigger.type)
      );
      const diverged =
        !plan ||
        plan.OE !== patch.OE ||
        plan.AL !== patch.AL ||
        plan.offensiveTactic !== patch.offensiveTactic ||
        plan.defensiveTactic !== patch.defensiveTactic ||
        plan.fallbackCondition !== patch.fallbackCondition ||
        uncoveredSuggestion;
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
  return unresolvedDirectives;
}

