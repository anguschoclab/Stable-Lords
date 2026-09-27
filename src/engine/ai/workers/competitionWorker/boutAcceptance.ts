import type {
  Warrior,
  RivalStableData,
  WeatherType,
  BoutOffer,
  GameState,
} from '@/types/state.types';
import { weeksUntilNextSeasonalTournament } from '@/engine/core/absoluteWeek';
import {
  acceptanceWeatherBlock,
  offerWeatherDecline,
} from '@/engine/ai/weatherSuitability';
import { ARENA_TITLE } from '@/constants/arena';
import { COUNTERED_PURSE_CONDITION } from '@/engine/bout/mutations/contractMutations';
import { buildFightForecast } from '@/engine/narrative/fightForecast';

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

/** The rival's verdict on a bout offer — 'Countered' is a one-shot purse renegotiation. */
export type BoutEvaluation = 'Accepted' | 'Declined' | 'Countered';

/**
 * Evaluate a bout offer for a rival-owned warrior.
 * Hard safety refusals (blocking injuries, weather, RECOVERY risk) run BEFORE
 * the desperation gate — an empty treasury never overrides them (G14).
 * Marginal purses may be 'Countered' once per offer.
 */
export function evaluateBoutOffer(
  offer: BoutOffer,
  rival: RivalStableData,
  warrior: Warrior,
  currentWeek: number,
  weather: WeatherType = 'Clear',
  opponent?: Warrior,
  state?: GameState
): BoutEvaluation {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';

  // ── Hard gates (cannot be bought off by desperation) ──

  // Injury Gate — blocking injuries decline at any treasury
  const hasBlockingInjury = (warrior.injuries || []).some((injury) =>
    (BLOCKING_INJURY_SEVERITIES as readonly string[]).includes(injury.severity as BlockingSeverity)
  );
  if (hasBlockingInjury) {
    return 'Declined';
  }

  // Weather Skepticism — consolidated gate (G16)
  if (offerWeatherDecline(warrior, weather)) {
    return 'Declined';
  }

  // ── Title bouts ──
  // The Arena Commission doesn't negotiate: a crown shot outweighs any purse,
  // so the counter/fame-floor logic below is skipped entirely. This branch
  // runs BEFORE the RECOVERY refusal so reign obligations are decided by
  // title economics (strip risk, defense health floors) rather than ordinary
  // bout risk aversion — the unified gate fixes the old double-gate where a
  // RECOVERY champion could quietly refuse defenses into a strip.
  if (offer.titleArenaId) {
    const personality = rival.owner.personality;
    const title = state?.arenaChampions?.[offer.titleArenaId];
    const isChampion = title?.champion?.warriorId === warrior.id;

    if (isChampion && title) {
      // Declining counts toward stripping — when the next refusal would cost
      // the crown, the champion fights hurt rather than abdicate by accident.
      const wouldStrip = title.refusals + 1 >= ARENA_TITLE.REFUSALS_TO_STRIP;
      if (!wouldStrip && personality !== 'Aggressive') {
        const hp = warrior.derivedStats?.hp ?? 100;
        const fatigue = warrior.fatigue ?? 0;
        if (hp < 45 || fatigue >= 85) return 'Declined';
        if ((opponent?.career?.kills ?? 0) >= 3 && hp < 70) return 'Declined';
      }
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
      return 'Declined';
    }
    if (opponent && (personality === 'Methodical' || personality === 'Pragmatic')) {
      const edge = buildFightForecast(warrior, opponent).styleMatchup.edge;
      if (edge <= -2) return 'Declined';
    }
    return 'Accepted';
  }

  // RECOVERY risk refusal — killers and severe mismatches are never accepted,
  // even when the treasury is empty.
  if (intent === 'RECOVERY' && opponent) {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      return 'Declined';
    }
  }

  // ── Desperation Gate: critically low treasury accepts anything survivable ──
  if (rival.treasury < 500) {
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

  // Health Guard
  const hpThreshold = isDesperateForBout ? 50 : 70;
  const currentHP = warrior.derivedStats?.hp ?? 100;
  if (currentHP < hpThreshold && rival.owner.personality !== 'Aggressive') {
    return 'Declined';
  }

  // Fatigue Gate
  const fatigueThreshold = isDesperateForBout ? 90 : 70;
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue > fatigueThreshold && rival.owner.personality !== 'Aggressive') {
    return 'Declined';
  }

  // Personality Logic
  const personality = rival.owner.personality;
  const hype = offer.hype;
  const purse = offer.purse;

  if (isTournamentHungry) {
    return 'Accepted';
  }

  // Matchup Skepticism — calculating stables decline a strongly unfavorable
  // style matchup when they can afford to (same forecast the player sees).
  if (opponent && (personality === 'Methodical' || personality === 'Pragmatic')) {
    const edge = buildFightForecast(warrior, opponent).styleMatchup.edge;
    if (edge <= -2) {
      return 'Declined';
    }
  }

  // Counter logic: famous warriors hold out for a purse worthy of their name.
  // The fame floor precedes the personality accepts — a Pragmatic does not
  // take 300g for a name worth 2000 just because it clears the generic bar.
  // One round only — an offer already tagged COUNTERED_PURSE is final.
  const alreadyCountered = offer.conditions?.includes(COUNTERED_PURSE_CONDITION) ?? false;
  if (!alreadyCountered && personality !== 'Aggressive') {
    const purseFloor = (warrior.fame ?? 0) - 50;
    if (purseFloor > 0 && offer.purse < purseFloor) {
      return 'Countered';
    }
  }

  if (personality === 'Aggressive' && (hype > 110 || purse > 300)) return 'Accepted';
  if (personality === 'Methodical' && currentHP < 85) {
    return 'Declined';
  }
  if (personality === 'Showman' && hype > 120) return 'Accepted';
  if (personality === 'Pragmatic' && purse > 250) return 'Accepted';

  // Default
  return 'Accepted';
}
