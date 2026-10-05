import type { Warrior, RivalStableData, BoutOffer, GameState } from '@/types/state.types';
import {
  COUNTERED_PURSE_CONDITION,
  COUNTERED_VENUE_CONDITION,
} from '@/engine/bout/mutations/contractMutations';
import type { Promoter } from '@/types/state/championship';
import type { PlayerThreatLevel } from '@/engine/ai/agentCore';
import { buildFightForecast } from '@/engine/narrative/fightForecast';
import { competenceQuality } from '@/engine/ai/competence';
import type { BoutEvaluation } from './gates';
import { venueCounterTarget } from './venueCounter';

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

interface PersonalityDefaultsArgs {
  personality: RivalStableData['owner']['personality'];
  hype: number;
  purse: number;
  currentHP: number;
  explain?: { reason?: string };
}

/** Personality default verdicts — marquee/spectacle/purse accepts, Methodical health pass. */
function personalityDefaults(args: PersonalityDefaultsArgs): BoutEvaluation {
  const { personality, hype, purse, currentHP, explain } = args;
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
export function evaluateNegotiationStage(args: EvaluateNegotiationStageArgs): BoutEvaluation {
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
    warrior,
    opponent,
    personality,
    playerThreat,
    observedDanger,
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
  const counted = purseCounter({
    offer,
    warrior,
    rival,
    promoter,
    playerThreat,
    alreadyCountered: alreadyVenueOrPurseCountered,
  });
  if (counted) {
    if (explain) explain.reason = 'purse-counter';
    return counted;
  }

  return personalityDefaults({ personality, hype, purse, currentHP, explain });
}
