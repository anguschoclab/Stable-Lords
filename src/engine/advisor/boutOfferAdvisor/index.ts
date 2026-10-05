/**
 * Bout Offer Advisor
 * Evaluates candidate bout offers for each warrior, scoring style matchup edge,
 * lethality hazards (career kills), promoter reputation, and weather suitability.
 */
import type { Warrior } from '@/types/warrior.types';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import type { GameState } from '@/types/state.types';
import type {
  CampaignFocus,
  StableEvalContext,
  WarriorFightAdvice,
  WarriorTournamentAdvice,
} from '../types';
import { TRAINING_COST } from '@/constants/economy';
import { hardGateResult, listCandidateOffers } from './gates';
import { scoreOffer, type OfferScoreContext, type ScoredOffer } from './scoring';

/**
 * Evaluate all candidate bout offers and produce actionable fight directives for a warrior.
 */
export function evaluateBoutOffers(
  warrior: Warrior,
  state: GameState,
  campaignFocus: CampaignFocus,
  tourneyAdvice?: WarriorTournamentAdvice,
  ctx?: StableEvalContext
): WarriorFightAdvice {
  const gate = hardGateResult(warrior, campaignFocus, tourneyAdvice);
  if (gate) return gate;

  const candidateOffers = listCandidateOffers(state, warrior);
  if (candidateOffers.length === 0) {
    return {
      action: 'NO_VIABLE_OFFERS',
      dangerLevel: 'SAFE',
      headline: `No Bout Offers for ${warriorDisplayName(warrior)} This Week`,
      reasoning: ['Promoters have not submitted contracts for this warrior for the upcoming week.'],
      warnings: [],
    };
  }

  // Purse priority: when the treasury cannot cover this week's projected
  // training payroll, or the warrior's campaign is explicitly purse-driven,
  // purses weigh heavier (purse/5, cap 60) and the council flags the motive.
  const evalTreasury = ctx?.treasury ?? state.treasury;
  const projectedWeeklyCost =
    Math.max(1, ctx?.rosterSize ?? state.roster?.length ?? 1) * TRAINING_COST;
  const treasuryDesperate = evalTreasury !== undefined && evalTreasury < projectedWeeklyCost;
  const pursePriority = treasuryDesperate || campaignFocus === 'PURSE_HUNTER';

  const s: OfferScoreContext = {
    state,
    warrior,
    campaignFocus,
    ctx,
    evalTreasury,
    treasuryDesperate,
    pursePriority,
  };
  const scored: ScoredOffer[] = candidateOffers.map((offer) => scoreOffer(offer, s));

  // Sort by desirability
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) {
    throw new Error('Scored offers unexpectedly empty despite non-empty candidates');
  }

  // If even the best match is lethal or severely hazardous with negative score, advise resting
  if (best.score < 40 && (best.dangerLevel === 'LETHAL' || best.dangerLevel === 'HAZARDOUS')) {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: best.dangerLevel,
      headline: `Rest Advised: All Available Matches Hazardous`,
      reasoning: [
        'Available bout contracts pit warrior against lethal opponents or severe style disadvantages.',
        'Declining offers preserves warrior life and legacy.',
      ],
      warnings: best.warnings,
    };
  }

  return acceptOfferAdvice(best, warrior);
}

/**
 * ACCEPT_OFFER payload for the winning offer. An offer already signed
 * player-side (council execution or autopilot) is a commitment, not a
 * pending decision — the headline says so honestly.
 */
function acceptOfferAdvice(best: ScoredOffer, warrior: Warrior): WarriorFightAdvice {
  const alreadySigned =
    best.offer.status === 'Signed' || best.offer.responses?.[warrior.id] === 'Accepted';
  const isTitleBout = !!best.offer.titleArenaId;
  const opp = best.opponent ? warriorDisplayName(best.opponent) : 'Opponent';
  const headline = isTitleBout
    ? `Title Bout vs ${opp} (+${best.offer.purse}G)`
    : alreadySigned
      ? `Signed Bout vs ${opp} (+${best.offer.purse}G)`
      : best.dangerLevel === 'SAFE'
        ? `Favorable Bout vs ${opp} (+${best.offer.purse}G)`
        : `Accept Bout vs ${opp} (+${best.offer.purse}G)`;

  return {
    action: 'ACCEPT_OFFER',
    recommendedOfferId: best.offer.id,
    recommendedOffer: best.offer,
    opponent: best.opponent,
    matchupEdge: best.styleEdge,
    dangerLevel: best.dangerLevel,
    headline,
    reasoning: best.reasons,
    warnings: best.warnings,
  };
}
