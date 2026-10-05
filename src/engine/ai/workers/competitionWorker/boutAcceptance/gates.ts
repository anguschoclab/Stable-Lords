import type { Warrior, RivalStableData, WeatherType } from '@/types/state.types';
import { offerWeatherDecline } from '@/engine/ai/weatherSuitability';

/** The rival's verdict on a bout offer — the two counters are each one-shot
 * renegotiations (purse or venue, never chained). */
export type BoutEvaluation = 'Accepted' | 'Declined' | 'Countered' | 'CounteredVenue';

/** Injury severity types that block bout acceptance. */
const BLOCKING_INJURY_SEVERITIES = ['Moderate', 'Severe', 'Critical', 'Permanent'] as const;
type BlockingSeverity = (typeof BLOCKING_INJURY_SEVERITIES)[number];

/** Hard gates that cannot be bought off by desperation: injury + weather. */
export function hardGates(
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

interface RiskRefusalArgs {
  intent: string;
  warrior: Warrior;
  opponent: Warrior | undefined;
  rival: RivalStableData;
  promoter: { personality?: string } | undefined;
  explain?: { reason?: string };
}

/** RECOVERY risk refusal + sadistic-promoter death-show check. */
export function riskRefusal(args: RiskRefusalArgs): BoutEvaluation | null {
  const { intent, warrior, opponent, rival, promoter, explain } = args;
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
export function survivabilityGates(
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
