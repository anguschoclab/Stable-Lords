/**
 * Bout Offer Advisor
 * Evaluates candidate bout offers for each warrior, scoring style matchup edge,
 * lethality hazards (career kills), promoter reputation, and weather suitability.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer } from '@/types/state.types';
import type {
  CampaignFocus,
  StableEvalContext,
  WarriorFightAdvice,
  WarriorTournamentAdvice,
  CombatDangerLevel,
} from './types';
import { boutOfferAbsoluteWeek, deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { getMatchupBonus } from '@/constants/combat/combat';
import { acceptanceWeatherBlock } from '@/engine/ai/weatherSuitability';
import { TRAINING_COST } from '@/constants/economy';
import { deriveHeadToHead, getOpponentIntel, summarizeIntel } from './intelAdvisor';
import { getScoutCost } from '@/engine/scouting/scouting';

/** True when the warrior holds the live crown at the given arena. */
function warriorOwnsArenaCrown(state: GameState, arenaId: string, warriorId: string): boolean {
  return state.arenaChampions?.[arenaId]?.champion?.warriorId === warriorId;
}

const BLOCKING_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical', 'Permanent']);

interface ScoredOffer {
  offer: BoutOffer;
  opponent: Warrior | null;
  styleEdge: number;
  score: number;
  dangerLevel: CombatDangerLevel;
  warnings: string[];
  reasons: string[];
}

/**
 * Evaluate all candidate bout offers and produce actionable fight directives for a warrior.
/** Hard gates that short-circuit offer evaluation (injury, rehab, taper, fatigue). */
function hardGateResult(
  warrior: Warrior,
  campaignFocus: CampaignFocus,
  tourneyAdvice?: WarriorTournamentAdvice
): WarriorFightAdvice | null {
  // 1. Hard Gate: Injuries
  const blockingInjury = (warrior.injuries || []).find(
    (inj) => BLOCKING_SEVERITIES.has(inj.severity) && (inj.weeksRemaining ?? 1) > 0
  );
  if (blockingInjury) {
    return {
      action: 'BLOCKED_BY_INJURY',
      dangerLevel: 'LETHAL',
      headline: `Combat Blocked: Carrying ${blockingInjury.severity} Injury (${blockingInjury.name})`,
      reasoning: [
        `Warrior has ${blockingInjury.weeksRemaining} week(s) of recovery remaining.`,
        'Entering the arena while injured dramatically increases the lethality threshold and risk of death.',
      ],
      warnings: [`Active ${blockingInjury.severity} injury: ${blockingInjury.name}`],
    };
  }

  // 1b. Hard Gate: Rehabilitation Focus
  if (campaignFocus === 'REHABILITATION') {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: 'SAFE',
      headline: 'Rehabilitation Active: No Arena Bouts Scheduled',
      reasoning: [
        'Warrior is designated for rehabilitation and should rest or receive Med Bay treatment.',
      ],
      warnings: [],
    };
  }

  // 2. Hard Gate: Tournament Contender Taper Rest
  if (tourneyAdvice?.status === 'CONTENDER_REST') {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: 'SAFE',
      headline: `Rest Contender for ${tourneyAdvice.tierName ?? 'Tournament'}`,
      reasoning: [
        'Seasonal tournament bracket commences in 1–2 weeks.',
        'Resting prevents late-season fatigue and eliminates accidental training/combat injuries before the opening round.',
      ],
      warnings: [],
    };
  }

  // 3. Hard Gate: Critical Fatigue
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue >= 50) {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: 'HAZARDOUS',
      headline: `Rest Required: Critical Fatigue (${fatigue}%)`,
      reasoning: [
        'Warrior is severely fatigued.',
        'High fatigue drains combat endurance in early exchanges, opening finish/kill windows for opponents.',
      ],
      warnings: ['Warrior is exhausted and must rest or enter the Med Bay.'],
    };
  }
  return null;
}

/** Bout offers targeting the warrior for the upcoming simulation week. */
function listCandidateOffers(state: GameState, warrior: Warrior): BoutOffer[] {
  const currentAbsWeek = state.absoluteWeek ?? deriveAbsoluteWeek(state.year, state.week);
  const targetAbsWeek = currentAbsWeek + 1;
  return Object.values(state.boutOffers || {}).filter(
    (o) =>
      boutOfferAbsoluteWeek(o) === targetAbsWeek &&
      o.warriorIds.includes(warrior.id) &&
      (o.status === 'Proposed' || o.status === 'Signed')
  );
}

/** Per-offer scoring context shared across the map pass. */
interface OfferScoreContext {
  state: GameState;
  warrior: Warrior;
  campaignFocus: CampaignFocus;
  ctx?: StableEvalContext;
  evalTreasury: number | undefined;
  treasuryDesperate: boolean;
  pursePriority: boolean;
}

/**
 * Danger escalation pass — lethality, weather hazard, style counter,
 * sadistic promoter, rematch caution. Returns the danger level plus the
 * warnings/reasons it produced.
 */
function collectDangerSignals(input: {
  opponent: Warrior | null;
  styleEdge: number;
  weatherReason: string | null;
  weather: GameState['weather'];
  promoterPersonality: string | undefined;
  h2h: ReturnType<typeof deriveHeadToHead> | null;
}): { dangerLevel: CombatDangerLevel; warnings: string[]; reasons: string[] } {
  const { opponent, styleEdge, weatherReason, weather, promoterPersonality, h2h } = input;
  const warnings: string[] = [];
  const reasons: string[] = [];
  let dangerLevel: CombatDangerLevel = 'SAFE';

  // Lethality
  const kills = opponent?.career?.kills ?? 0;
  if (kills > 0) {
    dangerLevel = 'LETHAL';
    warnings.push(`Opponent ${opponent?.name} has ${kills} arena kill(s)! High risk of permadeath.`);
  }

  // Weather
  if (weatherReason) {
    if (dangerLevel !== 'LETHAL') dangerLevel = 'HAZARDOUS';
    warnings.push(`Weather hazard (${weather}): ${weatherReason}`);
  }

  // Style Matchup
  if (styleEdge >= 2) {
    reasons.push(`Hard style counter (+${styleEdge} advantage vs ${opponent?.style})`);
  } else if (styleEdge === 1) {
    reasons.push(`Favorable style matchup (+1 advantage)`);
  } else if (styleEdge === -1) {
    if (dangerLevel === 'SAFE') dangerLevel = 'MODERATE';
    warnings.push(`Unfavorable style matchup (-1 disadvantage vs ${opponent?.style})`);
  } else if (styleEdge <= -2) {
    if (dangerLevel !== 'LETHAL') dangerLevel = 'HAZARDOUS';
    warnings.push(
      `Severe style counter against you (${styleEdge} disadvantage vs ${opponent?.style})`
    );
  }

  // Promoter
  if (promoterPersonality === 'Sadistic') {
    if (dangerLevel === 'SAFE') dangerLevel = 'MODERATE';
    warnings.push('Sadistic promoter: Elevated combat lethality and underdog bias.');
  }

  // Rematch caution (recent head-to-head record)
  if (h2h && h2h.meetings >= 2 && h2h.losses > h2h.wins) {
    if (dangerLevel === 'SAFE') dangerLevel = 'MODERATE';
    warnings.push(
      `Rematch caution: ${h2h.wins}-${h2h.losses} career record vs ${opponent?.name}.`
    );
  }

  return { dangerLevel, warnings, reasons };
}

/** Qualitative assessment of one offer — warnings, reasons, danger, flags. */
function assessOffer(offer: BoutOffer, s: OfferScoreContext) {
  const { state, warrior, campaignFocus, ctx, evalTreasury, treasuryDesperate } = s;
  const opponentId = offer.warriorIds.find((id) => id !== warrior.id);
  const opponent = opponentId ? findWarriorById(state, opponentId) ?? null : null;
  const styleEdge = opponent ? getMatchupBonus(warrior.style, opponent.style) : 0;
  const weatherReason = acceptanceWeatherBlock(warrior, state.weather ?? 'Clear');
  const promoter = state.promoters?.[offer.promoterId];

  const warnings: string[] = [];
  const reasons: string[] = [];

  // Scout intel & head-to-head history for this specific opponent
  const intel = opponentId
    ? getOpponentIntel(state, opponentId, { tokens: ctx?.insightTokens })
    : [];
  for (const line of summarizeIntel(intel)) {
    reasons.push(`Scout intel: ${line}`);
  }
  const h2h = opponent ? deriveHeadToHead(state, warrior.id, opponent.id) : null;
  const rematchLosing = !!h2h && h2h.meetings >= 2 && h2h.losses > h2h.wins;

  const danger = collectDangerSignals({
    opponent,
    styleEdge,
    weatherReason,
    weather: state.weather,
    promoterPersonality: promoter?.personality,
    h2h,
  });
  warnings.push(...danger.warnings);
  reasons.push(...danger.reasons);
  const dangerLevel = danger.dangerLevel;
  const kills = opponent?.career?.kills ?? 0;

  const { isTitleBout, onLadderHere } = appendOfferReasons(offer, s, opponent, intel, reasons);

  return {
    opponent,
    styleEdge,
    weatherReason,
    promoter,
    kills,
    rematchLosing,
    isTitleBout,
    onLadderHere,
    dangerLevel,
    warnings,
    reasons,
  };
}

/**
 * Append title-bout, crown-bid, purse, and blind-bout reasons (in that order).
 * Returns the derived flags the caller needs.
 */
function appendOfferReasons(
  offer: BoutOffer,
  s: OfferScoreContext,
  opponent: Warrior | null,
  intel: ReturnType<typeof getOpponentIntel>,
  reasons: string[]
): { isTitleBout: boolean; onLadderHere: boolean } {
  const { state, warrior, campaignFocus, ctx, evalTreasury, treasuryDesperate } = s;

  // Title Bout — the crown is at stake. Headline + large score bump: this
  // is not an ordinary purse decision.
  const isTitleBout = !!offer.titleArenaId;
  if (isTitleBout) {
    reasons.push(
      warriorOwnsArenaCrown(state, offer.titleArenaId as string, warrior.id)
        ? 'TITLE DEFENSE — your arena crown is on the line. Refusal can cost the title.'
        : 'TITLE BOUT — victory claims the arena crown.'
    );
  }

  // Crown bid — a venue bout on a ladder where the warrior is ranked is a
  // step toward the title challenge, worth more than the purse alone.
  const onLadderHere =
    campaignFocus === 'CROWN_BID' &&
    !!offer.arenaId &&
    (ctx?.contenderIndex?.get(offer.arenaId)?.includes(warrior.id) ?? false);
  if (onLadderHere) {
    reasons.push(
      `Crown bid: a ${offer.arenaId} bout builds your contender standing for the title.`
    );
  }

  // Purse Incentive
  reasons.push(`Purse: ${offer.purse} gold`);
  if (treasuryDesperate) {
    reasons.push('Treasury pressure: prioritizing purse income over matchup purity.');
  } else if (campaignFocus === 'PURSE_HUNTER') {
    reasons.push('Purse-hunter campaign: weighting purse income over matchup purity.');
  }

  // Blind bout: no dossier on the opponent — flag the scouting opportunity
  // when a Basic report is affordable.
  const scoutCost = getScoutCost('Basic');
  if (opponent && intel.length === 0 && evalTreasury !== undefined && evalTreasury >= scoutCost) {
    reasons.push(
      `No scout dossier on ${opponent.name} — commission a Basic scout report (${scoutCost}G) before signing.`
    );
  }

  return { isTitleBout, onLadderHere };
}

/** Scores one candidate offer: matchup, lethality, weather, promoter, purse. */
function scoreOffer(offer: BoutOffer, s: OfferScoreContext): ScoredOffer {
  const { pursePriority } = s;
  const a = assessOffer(offer, s);

  // Numerical Composite Score
  let score = 50;
  score += a.styleEdge * 20;
  if (a.isTitleBout) score += 60;
  if (a.onLadderHere) score += 20;
  score += pursePriority ? Math.min(60, offer.purse / 5) : Math.min(30, offer.purse / 10);
  if (a.kills > 0) score -= 60;
  if (a.weatherReason) score -= 35;
  if (a.styleEdge <= -2) score -= 40;
  if (a.promoter?.personality === 'Sadistic') score -= 15;
  if (a.rematchLosing) score -= 10;

  return {
    offer,
    opponent: a.opponent,
    styleEdge: a.styleEdge,
    score,
    dangerLevel: a.dangerLevel,
    warnings: a.warnings,
    reasons: a.reasons,
  };
}

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
      headline: `No Bout Offers for ${warrior.name} This Week`,
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
  const treasuryDesperate =
    evalTreasury !== undefined && evalTreasury < projectedWeeklyCost;
  const pursePriority = treasuryDesperate || campaignFocus === 'PURSE_HUNTER';

  const s: OfferScoreContext = {
    state, warrior, campaignFocus, ctx, evalTreasury, treasuryDesperate, pursePriority,
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

  // An offer already signed player-side (council execution or autopilot) is a
  // commitment, not a pending decision — the headline says so honestly.
  const alreadySigned =
    best.offer.status === 'Signed' || best.offer.responses?.[warrior.id] === 'Accepted';

  const isTitleBout = !!best.offer.titleArenaId;

  return {
    action: 'ACCEPT_OFFER',
    recommendedOfferId: best.offer.id,
    recommendedOffer: best.offer,
    opponent: best.opponent,
    matchupEdge: best.styleEdge,
    dangerLevel: best.dangerLevel,
    headline: isTitleBout
      ? `Title Bout vs ${best.opponent?.name ?? 'Opponent'} (+${best.offer.purse}G)`
      : alreadySigned
        ? `Signed Bout vs ${best.opponent?.name ?? 'Opponent'} (+${best.offer.purse}G)`
        : best.dangerLevel === 'SAFE'
          ? `Favorable Bout vs ${best.opponent?.name ?? 'Opponent'} (+${best.offer.purse}G)`
          : `Accept Bout vs ${best.opponent?.name ?? 'Opponent'} (+${best.offer.purse}G)`,
    reasoning: best.reasons,
    warnings: best.warnings,
  };
}
