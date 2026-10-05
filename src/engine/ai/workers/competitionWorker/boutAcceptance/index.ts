import type {
  Warrior,
  RivalStableData,
  WeatherType,
  BoutOffer,
  GameState,
} from '@/types/state.types';
import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';
import { acceptanceWeatherBlock } from '@/engine/ai/weatherSuitability';
import { fightingCondition } from '@/engine/warrior/condition';
import { hardGates, riskRefusal, survivabilityGates, type BoutEvaluation } from './gates';
import { resolveTitleBout } from './titleBout';
import { buildThreatContext } from './threat';
import { evaluateNegotiationStage } from './negotiation';

export type { BoutEvaluation } from './gates';
export { venueCounterTarget } from './venueCounter';

/**
 * Pre-evaluation sanity gate. Title bouts bypass the soft refusal gates
 * (RECOVERY risk aversion, fame gaps) — a crown obligation can't be ducked
 * through a path that never sees `titleArenaId`; refusal economics live in
 * evaluateBoutOffer's reign-management branch where the strip count is
 * visible. Weather hazards still block — a blizzard postpones anyone.
 */
export function verifyBoutAcceptance(
  rival: RivalStableData,
  warrior: Warrior,
  opponent: Warrior,
  weather: WeatherType = 'Clear',
  opts?: { isTitleBout?: boolean }
): { accepted: boolean; reason?: string } {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';
  const isTitleBout = opts?.isTitleBout === true;

  // Weather Skepticism — consolidated gate (G16)
  const weatherReason = acceptanceWeatherBlock(warrior, weather);
  if (weatherReason !== null) {
    return { accepted: false, reason: weatherReason };
  }

  // Skeptical Check: RECOVERY agents refuse fights with "Killers"
  if (!isTitleBout && intent === 'RECOVERY') {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      return { accepted: false, reason: 'Too risky for recovery phase.' };
    }
  }

  // Skeptical Check: SURVIVAL agents only take bouts they are favored to
  // win — the purse upside matters, but a loss buys nothing and a death
  // ends a stable that cannot afford to replace the body.
  if (!isTitleBout && intent === 'SURVIVAL') {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0)) {
      return { accepted: false, reason: 'Survival — only bouts we are favored to win.' };
    }
  }

  // Skeptical Check: AGGRESSIVE agents accept most things (unless weather is lethal)
  if (rival.owner.personality === 'Aggressive') {
    if (weather === 'Sweltering' && warrior.attributes.CN < 8) {
      return {
        accepted: false,
        reason: 'Aggressive but not suicidal; heat is too dangerous for this unit.',
      };
    }
    return { accepted: true };
  }

  // Default: Accept unless it's a massive fame gap
  if (!isTitleBout && (opponent.fame || 0) > (warrior.fame || 0) + 300) {
    return { accepted: false, reason: 'Opponent outclasses us significantly.' };
  }

  return { accepted: true };
}

/**
 * Evaluate a bout offer for a rival-owned warrior.
 * Hard safety refusals (blocking injuries, weather, RECOVERY risk) run BEFORE
 * the desperation gate — an empty treasury never overrides them (G14).
 * Marginal purses may be 'Countered' once per offer.
 *
 * `explain` is an optional out-param: the reason bucket for every verdict
 * is written into `explain.reason` so the offer processor can persist it
 * onto the offer for UI transparency (Stage E — all offers, not just title).
 */
export interface EvaluateBoutOfferArgs {
  offer: BoutOffer;
  rival: RivalStableData;
  warrior: Warrior;
  currentWeek: number;
  weather?: WeatherType;
  opponent?: Warrior;
  state?: GameState;
  explain?: { reason?: string };
}

/**
 * Evaluates a bout offer for a rival stable: hard gates, title-bout
 * resolution, risk refusals, desperation acceptance, survivability gates,
 * then the negotiation stage (skepticism/venue/purse/personality).
 */
export function evaluateBoutOffer(args: EvaluateBoutOfferArgs): BoutEvaluation {
  const { offer, rival, warrior, currentWeek, weather = 'Clear' } = args;
  const { opponent, state, explain } = args;
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';
  const { observedDanger, playerThreat } = buildThreatContext(rival, opponent, state);

  // ── Hard gates (cannot be bought off by desperation) ──
  const gate = hardGates(warrior, weather, explain);
  if (gate) return gate;

  if (offer.titleArenaId) {
    return resolveTitleBout({
      offer: offer,
      rival: rival,
      warrior: warrior,
      opponent: opponent,
      state: state,
      observedDanger: observedDanger,
      explain: explain,
    });
  }

  const promoter = offer.promoterId ? state?.promoters?.[offer.promoterId] : undefined;
  const refused = riskRefusal({ intent, warrior, opponent, rival, promoter, explain });
  if (refused) return refused;

  // ── Desperation Gate: critically low treasury accepts anything survivable ──
  if (rival.treasury < 500) {
    if (explain) explain.reason = 'desperate-for-purse';
    return 'Accepted';
  }

  // Tournament Hunger — seasonals only (weeks 10/20/30/42); the champions-only
  // Grand Championship at week 52 doesn't create ordinary bout pressure.
  const weeksUntilTournament = weeksUntilNextSeasonalTournament(currentWeek);
  const isTournamentHungry = weeksUntilTournament <= 4;

  // Inactivity Pressure
  const lastBoutWeek = warrior.lastBoutWeek;
  const weeksSinceBout = lastBoutWeek != null ? currentWeek - lastBoutWeek : 10;
  const isDesperateForBout = weeksSinceBout > 4 || isTournamentHungry;

  const currentHP = fightingCondition(warrior);
  const survivable = survivabilityGates(warrior, rival, isDesperateForBout, currentHP, explain);
  if (survivable) return survivable;

  return evaluateNegotiationStage({
    offer: offer,
    rival: rival,
    warrior: warrior,
    opponent: opponent,
    state: state,
    promoter: promoter,
    isTournamentHungry: isTournamentHungry,
    currentHP: currentHP,
    playerThreat: playerThreat,
    observedDanger: observedDanger,
    explain: explain,
  });
}
