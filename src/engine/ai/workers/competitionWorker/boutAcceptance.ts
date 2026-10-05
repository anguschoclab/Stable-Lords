import type {
  Warrior,
  RivalStableData,
  WeatherType,
  BoutOffer,
  GameState,
} from '@/types/state.types';
import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';
import { acceptanceWeatherBlock, offerWeatherDecline } from '@/engine/ai/weatherSuitability';
import { ARENA_TITLE } from '@/constants/arena';
import {
  COUNTERED_PURSE_CONDITION,
  COUNTERED_VENUE_CONDITION,
} from '@/engine/bout/mutations/contractMutations';
import { contenderRankAtArena } from '@/engine/championship/arenaChampionship';
import { computePlayerThreatLevel, type PlayerThreatLevel } from '@/engine/ai/agentCore';
import type { Promoter } from '@/types/state/championship';
import { buildFightForecast } from '@/engine/narrative/fightForecast';
import { fightingCondition } from '@/engine/warrior/condition';
import { competenceQuality } from '@/engine/ai/competence';

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

/** Injury severity types that block bout acceptance. */
const BLOCKING_INJURY_SEVERITIES = ['Moderate', 'Severe', 'Critical', 'Permanent'] as const;
type BlockingSeverity = (typeof BLOCKING_INJURY_SEVERITIES)[number];

/** The rival's verdict on a bout offer — the two counters are each one-shot
 * renegotiations (purse or venue, never chained). */
export type BoutEvaluation = 'Accepted' | 'Declined' | 'Countered' | 'CounteredVenue';

/** Minimum venue bouts before a warrior's record there counts as evidence. */
const VENUE_SAMPLE_BOUTS = 3;
/** Losing-rate ceiling for "bad venue" aversion. */
const BAD_VENUE_WIN_RATE = 0.4;
/** Win-rate floor for the arena a warrior counters toward. */
const GOOD_VENUE_WIN_RATE = 0.6;

/**
 * The arena a warrior would counter a Proposed offer toward, or undefined.
 * Two motives, checked in order:
 *  - CROWN_BID ladder pull — the warrior campaigns for a crown and is ranked
 *    at the target arena, so off-ladder bouts get dragged onto the ladder.
 *  - Bad-venue aversion — a losing record at the offered arena (≥3 bouts,
 *    <40% wins) with a clearly better venue on the books.
 * Title offers and already-countered offers never yield a target.
 */
export function venueCounterTarget(
  offer: BoutOffer,
  warrior: Warrior,
  rival: RivalStableData,
  state?: GameState
): string | undefined {
  if (!offer.arenaId || offer.titleArenaId) return undefined;
  const conds = offer.conditions ?? [];
  if (conds.includes(COUNTERED_VENUE_CONDITION) || conds.includes(COUNTERED_PURSE_CONDITION)) {
    return undefined;
  }

  const ladder = warrior.campaignFocus === 'CROWN_BID' ? rival.strategy?.targetArenaId : undefined;
  if (
    ladder &&
    ladder !== offer.arenaId &&
    state &&
    contenderRankAtArena(state, ladder, warrior.id) != null
  ) {
    return ladder;
  }

  const here = warrior.career?.byArena?.[offer.arenaId];
  if (!here) return undefined;
  const hereBouts = here.wins + here.losses;
  if (hereBouts < VENUE_SAMPLE_BOUTS || here.wins / hereBouts >= BAD_VENUE_WIN_RATE) {
    return undefined;
  }
  let bestArena: string | undefined;
  let bestRate = 0;
  for (const [arenaId, rec] of Object.entries(warrior.career?.byArena ?? {})) {
    if (arenaId === offer.arenaId) continue;
    const bouts = rec.wins + rec.losses;
    if (bouts < VENUE_SAMPLE_BOUTS) continue;
    const rate = rec.wins / bouts;
    if (rate > bestRate) {
      bestRate = rate;
      bestArena = arenaId;
    }
  }
  return bestRate >= GOOD_VENUE_WIN_RATE ? bestArena : undefined;
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
/** Hard gates that cannot be bought off by desperation: injury + weather. */
function hardGates(
  warrior: Warrior,
  weather: WeatherType,
  explain?: { reason?: string }
): BoutEvaluation | null {
  // Injury Gate — blocking injuries decline at any treasury
  const hasBlockingInjury = (warrior.injuries || []).some((injury) =>
    (BLOCKING_INJURY_SEVERITIES as readonly string[]).includes(injury.severity as BlockingSeverity)
  );
  if (hasBlockingInjury) {
    if (explain) explain.reason = 'blocking-injury';
    return 'Declined';
  }

  // Weather Skepticism — consolidated gate (G16)
  if (offerWeatherDecline(warrior, weather)) {
    if (explain) explain.reason = 'weather-risk';
    return 'Declined';
  }
  return null;
}

interface ResolveTitleBoutArgs {
  offer: BoutOffer;
  rival: RivalStableData;
  warrior: Warrior;
  opponent: Warrior | undefined;
  state: GameState | undefined;
  observedDanger: boolean;
  explain?: { reason?: string };
}

/**
 * Title-bout resolution — the Arena Commission doesn't negotiate: a crown
 * shot outweighs any purse, so counter/fame-floor logic is skipped. Runs
 * BEFORE the RECOVERY refusal so reign obligations are decided by title
 * economics (strip risk, defense health floors) rather than ordinary bout
 * risk aversion — the unified gate fixes the old double-gate where a
 * RECOVERY champion could quietly refuse defenses into a strip.
 */
function resolveTitleBout(args: ResolveTitleBoutArgs): BoutEvaluation {
  const { offer, rival, warrior, opponent, state } = args;
  const { observedDanger, explain } = args;
  const arenaId = offer.titleArenaId as string;
  const personality = rival.owner.personality;
  const title = state?.arenaChampions?.[arenaId];
  const isChampion = title?.champion?.warriorId === warrior.id;

  if (isChampion && title) {
    // Declining counts toward stripping — when the next refusal would cost
    // the crown, the champion fights hurt rather than abdicate by accident.
    const wouldStrip = title.refusals + 1 >= ARENA_TITLE.REFUSALS_TO_STRIP;
    if (!wouldStrip && personality !== 'Aggressive') {
      const hp = fightingCondition(warrior);
      const fatigue = warrior.fatigue ?? 0;
      if (hp < 45 || fatigue >= 85) {
        if (explain) explain.reason = 'title-defense-health';
        return 'Declined';
      }
      if ((opponent?.career?.kills ?? 0) >= 3 && hp < 70) {
        if (explain) explain.reason = 'title-defense-threat';
        return 'Declined';
      }
    }
    if (explain) explain.reason = 'crown-defense';
    return 'Accepted';
  }

  // Challenger side — a declined shot costs only the challenger cooldown,
  // so a known killer champion is a legitimate pass for calculating stables.
  if (
    opponent &&
    personality !== 'Aggressive' &&
    (opponent.career?.kills ?? 0) >= 3 &&
    (warrior.career?.kills ?? 0) === 0
  ) {
    if (explain) explain.reason = 'killer-champion';
    return 'Declined';
  }
  if (opponent && (personality === 'Methodical' || personality === 'Pragmatic')) {
    const edge = buildFightForecast(warrior, opponent).styleMatchup.edge;
    if (edge <= (observedDanger ? -1 : -2)) {
      if (explain) explain.reason = 'title-shot-mismatch';
      return 'Declined';
    }
  }
  if (explain) explain.reason = 'title-shot';
  return 'Accepted';
}

/** RECOVERY risk refusal + sadistic-promoter death-show check. */
function riskRefusal(
  intent: string,
  warrior: Warrior,
  opponent: Warrior | undefined,
  rival: RivalStableData,
  promoter: { personality?: string } | undefined,
  explain?: { reason?: string }
): BoutEvaluation | null {
  // RECOVERY risk refusal — killers and severe mismatches are never accepted,
  // even when the treasury is empty.
  if (intent === 'RECOVERY' && opponent) {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      if (explain) explain.reason = 'recovery-mismatch';
      return 'Declined';
    }
  }

  // Promoter awareness — rivals read the promoter's reputation like the
  // advisor does. A Sadistic promoter booking a killer is a death-show:
  // cautious personalities pass regardless of purse. Aggressive and Showman
  // stables don't flinch — blood sells.
  const personalityPre = rival.owner.personality;
  if (
    promoter?.personality === 'Sadistic' &&
    opponent &&
    (opponent.career?.kills ?? 0) > 0 &&
    (warrior.career?.kills ?? 0) === 0 &&
    personalityPre !== 'Aggressive' &&
    personalityPre !== 'Showman'
  ) {
    if (explain) explain.reason = 'sadistic-promoter';
    return 'Declined';
  }
  return null;
}

/** Health/fatigue guards scaled by bout desperation. */
function survivabilityGates(
  warrior: Warrior,
  rival: RivalStableData,
  isDesperateForBout: boolean,
  currentHP: number,
  explain?: { reason?: string }
): BoutEvaluation | null {
  // Health Guard
  const hpThreshold = isDesperateForBout ? 50 : 70;
  if (currentHP < hpThreshold && rival.owner.personality !== 'Aggressive') {
    if (explain) explain.reason = 'health-guard';
    return 'Declined';
  }

  // Fatigue Gate
  const fatigueThreshold = isDesperateForBout ? 90 : 70;
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue > fatigueThreshold && rival.owner.personality !== 'Aggressive') {
    if (explain) explain.reason = 'fatigue-guard';
    return 'Declined';
  }
  return null;
}

interface MatchupSkepticismArgs {
  warrior: Warrior;
  opponent: Warrior | undefined;
  personality: RivalStableData['owner']['personality'];
  playerThreat: PlayerThreatLevel;
  observedDanger: boolean;
  owner?: Pick<RivalStableData['owner'], 'competence'>;
}

/**
 * Matchup skepticism — calculating stables decline a strongly unfavorable
 * style matchup when they can afford to (same forecast the player sees).
 * Witnessed high-OE tells tighten the tolerance one notch.
 */
function matchupSkepticism(args: MatchupSkepticismArgs): BoutEvaluation | null {
  const { warrior, opponent, personality, playerThreat, observedDanger } = args;
  const { owner } = args;
  if (opponent && (personality === 'Methodical' || personality === 'Pragmatic')) {
    const edge = buildFightForecast(warrior, opponent).styleMatchup.edge;
    // Methodical camps refuse to feed a dominant player on a coin flip —
    // anything short of a clear edge is a pass. Competence loosens the floor:
    // a Novice stable books matchups a Master would duck (Stage B).
    const skepticismFloor =
      (personality === 'Methodical' && playerThreat === 'Dominant' ? 0 : observedDanger ? -1 : -2) -
      (owner?.competence == null ? 0 : Math.floor((1 - competenceQuality(owner)) * 3));
    if (edge <= skepticismFloor) {
      return 'Declined';
    }
  }
  return null;
}

interface PurseCounterArgs {
  offer: BoutOffer;
  warrior: Warrior;
  rival: RivalStableData;
  promoter: { personality?: string } | undefined;
  playerThreat: PlayerThreatLevel;
  alreadyCountered: boolean;
}

/**
 * Purse counter — famous warriors hold out for a purse worthy of their name.
 * One round only; an offer already tagged COUNTERED_* is final.
 */
function purseCounter(args: PurseCounterArgs): BoutEvaluation | null {
  const { offer, warrior, rival, promoter, playerThreat } = args;
  const { alreadyCountered } = args;
  if (
    !alreadyCountered &&
    rival.owner.personality !== 'Aggressive' &&
    warrior.campaignFocus !== 'PURSE_HUNTER'
  ) {
    // Greedy promoters lowball — their fame floor sits closer to asking price.
    // A dominant player's stable can afford to pay up — squeeze harder.
    const squeeze = promoter?.personality === 'Greedy' || playerThreat === 'Dominant';
    const purseFloor = (warrior.fame ?? 0) - (squeeze ? 20 : 50);
    if (purseFloor > 0 && offer.purse < purseFloor) {
      return 'Countered';
    }
  }
  return null;
}

/**
 * Observed-danger flag (opponent stable witnessed brawling high-OE) and the
 * player-threat level for player-bound offers.
 */
function buildThreatContext(
  rival: RivalStableData,
  opponent: Warrior | undefined,
  state: GameState | undefined
): { observedDanger: boolean; playerThreat: PlayerThreatLevel } {
  // Observed danger: witnessed-tells dossiers that saw the opponent's stable
  // brawl high-OE tighten the style-matchup tolerance for calculating owners.
  const oppStableInfo = opponent ? state?.warriorToStableMap?.get(opponent.id) : undefined;
  const oppTells = oppStableInfo?.stableId
    ? rival.agentMemory?.opponentDossiers?.[oppStableInfo.stableId]?.observedTells
    : undefined;
  const observedDanger = !!oppTells && oppTells.samples >= 2 && oppTells.oe >= 0.7;

  // Player-bound offers: when the player's stable dominates the realm
  // rankings, rival owners adjust — calculating camps refuse to feed the
  // dominant stable, Showmen chase the upset, and everyone negotiates harder
  // because the dominant stable can afford it.
  const playerBound =
    !!opponent &&
    !!state &&
    (oppStableInfo?.isPlayer ?? (state.roster ?? []).some((w) => w.id === opponent.id));
  const playerThreat: PlayerThreatLevel =
    playerBound && state ? computePlayerThreatLevel(state) : 'Neutral';

  return { observedDanger, playerThreat };
}

interface EvaluateNegotiationStageArgs {
  offer: BoutOffer;
  rival: RivalStableData;
  warrior: Warrior;
  opponent: Warrior | undefined;
  state: GameState | undefined;
  promoter: Promoter | undefined;
  isTournamentHungry: boolean;
  currentHP: number;
  playerThreat: PlayerThreatLevel;
  observedDanger: boolean;
  explain?: { reason?: string };
}

/**
 * Negotiation stage — runs after every gate has passed: matchup skepticism,
 * venue/purse counters, campaign-role accepts, and personality defaults.
 */
function evaluateNegotiationStage(args: EvaluateNegotiationStageArgs): BoutEvaluation {
  const { offer, rival, warrior, opponent, state } = args;
  const { promoter, isTournamentHungry, currentHP, playerThreat, observedDanger, explain } = args;
  // Personality Logic
  const personality = rival.owner.personality;
  const hype = offer.hype;
  const purse = offer.purse;

  if (isTournamentHungry) {
    if (explain) explain.reason = 'tournament-hunger';
    return 'Accepted';
  }

  const skeptical = matchupSkepticism({
    warrior: warrior,
    opponent: opponent,
    personality: personality,
    playerThreat: playerThreat,
    observedDanger: observedDanger,
    owner: rival.owner,
  });
  if (skeptical) {
    if (explain) explain.reason = 'matchup-skepticism';
    return skeptical;
  }

  // Venue counter — the arena itself is the sticking point. A CROWN_BID
  // contender drags the bout onto their ladder arena; any warrior with a
  // losing record at the offered venue counters toward their best stage.
  // Runs before the CROWN_BID blanket accept and the purse counter: venue is
  // a harder constraint than either, and a single negotiation round total
  // (either counter tag makes the offer take-it-or-leave-it).
  const alreadyVenueOrPurseCountered =
    (offer.conditions?.includes(COUNTERED_VENUE_CONDITION) ?? false) ||
    (offer.conditions?.includes(COUNTERED_PURSE_CONDITION) ?? false);
  if (!alreadyVenueOrPurseCountered && personality !== 'Aggressive') {
    if (venueCounterTarget(offer, warrior, rival, state)) {
      if (explain) explain.reason = 'venue-counter';
      return 'CounteredVenue';
    }
  }

  // Dominant-player upset chase: a Showman takes the fight raw — beating
  // the realm's top stable IS the spectacle, no purse negotiation needed.
  // Runs after the venue counter (a Showman still won't fight on a bad stage).
  if (playerThreat === 'Dominant' && personality === 'Showman') {
    if (explain) explain.reason = 'upset-spectacle';
    return 'Accepted';
  }

  // Campaign roles — shared advisor semantics: a CROWN_BID contender takes
  // venue bouts where they hold a record (the ladder standing is the real
  // payout); a PURSE_HUNTER takes volume and never holds out for a marquee.
  if (warrior.campaignFocus === 'CROWN_BID' && offer.arenaId) {
    const venue = warrior.career?.byArena?.[offer.arenaId];
    if ((venue?.wins ?? 0) + (venue?.losses ?? 0) > 0) {
      if (explain) explain.reason = 'crown-ladder';
      return 'Accepted';
    }
  }

  // Counter logic: famous warriors hold out for a purse worthy of their name.
  const counted = purseCounter(
    { offer: offer, warrior: warrior, rival: rival, promoter: promoter, playerThreat: playerThreat, alreadyCountered: alreadyVenueOrPurseCountered }
  );
  if (counted) {
    if (explain) explain.reason = 'purse-counter';
    return counted;
  }

  if (personality === 'Aggressive' && (hype > 110 || purse > 300)) {
    if (explain) explain.reason = 'marquee-draw';
    return 'Accepted';
  }
  if (personality === 'Methodical' && currentHP < 85) {
    if (explain) explain.reason = 'methodical-health';
    return 'Declined';
  }
  if (personality === 'Showman' && hype > 120) {
    if (explain) explain.reason = 'spectacle-draw';
    return 'Accepted';
  }
  if (personality === 'Pragmatic' && purse > 250) {
    if (explain) explain.reason = 'purse-fit';
    return 'Accepted';
  }

  // Default
  if (explain) explain.reason = 'open-date';
  return 'Accepted';
}

/**
 *
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

  // Injury Gate — blocking injuries decline at any treasury
  const hasBlockingInjury = (warrior.injuries || []).some((injury) =>
    (BLOCKING_INJURY_SEVERITIES as readonly string[]).includes(injury.severity as BlockingSeverity)
  );
  if (hasBlockingInjury) {
    if (explain) explain.reason = 'blocking-injury';
    return 'Declined';
  }

  // Weather Skepticism — consolidated gate (G16)
  if (offerWeatherDecline(warrior, weather)) {
    if (explain) explain.reason = 'weather-risk';
    return 'Declined';
  }

  const gate = hardGates(warrior, weather, explain);
  if (gate) return gate;

  if (offer.titleArenaId) {
    return resolveTitleBout({ offer: offer, rival: rival, warrior: warrior, opponent: opponent, state: state, observedDanger: observedDanger, explain: explain });
  }

  const promoter = offer.promoterId ? state?.promoters?.[offer.promoterId] : undefined;
  const refused = riskRefusal(intent, warrior, opponent, rival, promoter, explain);
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

  return evaluateNegotiationStage(
    { offer: offer, rival: rival, warrior: warrior, opponent: opponent, state: state, promoter: promoter, isTournamentHungry: isTournamentHungry, currentHP: currentHP, playerThreat: playerThreat, observedDanger: observedDanger, explain: explain }
  );
}
