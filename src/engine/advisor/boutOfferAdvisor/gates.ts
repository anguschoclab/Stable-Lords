import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer } from '@/types/state.types';
import type {
  CampaignFocus,
  WarriorFightAdvice,
  WarriorTournamentAdvice,
} from '../types';
import { boutOfferAbsoluteWeek, deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';

const BLOCKING_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical', 'Permanent']);

/** Hard gates that short-circuit offer evaluation (injury, rehab, taper, fatigue). */
export function hardGateResult(
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
export function listCandidateOffers(state: GameState, warrior: Warrior): BoutOffer[] {
  const currentAbsWeek = state.absoluteWeek ?? deriveAbsoluteWeek(state.year, state.week);
  const targetAbsWeek = currentAbsWeek + 1;
  return Object.values(state.boutOffers || {}).filter(
    (o) =>
      boutOfferAbsoluteWeek(o) === targetAbsWeek &&
      o.warriorIds.includes(warrior.id) &&
      (o.status === 'Proposed' || o.status === 'Signed')
  );
}
