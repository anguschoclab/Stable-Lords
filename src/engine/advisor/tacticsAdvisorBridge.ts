/**
 * Tactics & Loadout Advisor Bridge
 * Recommends optimal offensive and defensive tactics, fatigue-adjusted pacing (OE/AL),
 * life-preserving surrender thresholds (YIELD), and equipment encumbrance audits.
 */
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { CampaignFocus, WarriorTacticsAdvice } from './types';
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';
import { defaultStylePreset } from '@/engine/bout/stylePresets';

const AGILE_STYLES = new Set([
  FightingStyle.SlashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.AimedBlow,
]);

/**
 * Evaluate and recommend optimal battle plan tactics and loadout audit for a warrior.
 */
export function evaluateTacticsAdvice(
  warrior: Warrior,
  campaignFocus: CampaignFocus
): WarriorTacticsAdvice {
  const bestOffensiveTactic = getBestOffensiveTactic(warrior.style);
  const bestDefensiveTactic = getBestDefensiveTactic(warrior.style);

  const defaultPlan = defaultStylePreset(warrior.style).plan;
  let suggestedOE = defaultPlan.OE;
  let suggestedAL = defaultPlan.AL;

  // 1. Fatigue Moderation: Exhausted fighters must lower tempo to prevent stamina collapse
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue >= 30) {
    suggestedOE = Math.min(suggestedOE, 5);
    suggestedAL = Math.min(suggestedAL, 5);
  }

  // 2. Surrender / Fallback Threshold: Cautious preservation for wounded or aging veterans
  let fallbackCondition: 'FLEE' | 'TURTLE' | 'BERZERK' | 'YIELD' | 'None' =
    defaultPlan.fallbackCondition ?? 'TURTLE';

  if (campaignFocus === 'REHABILITATION' || campaignFocus === 'VETERAN_TWILIGHT') {
    fallbackCondition = 'YIELD';
  }

  // 3. Equipment & Loadout Audit
  const gearNotes: string[] = [
    `Optimal synergy: ${bestOffensiveTactic} offense paired with ${bestDefensiveTactic} defense.`,
  ];

  const eq = warrior.equipment;
  if (eq) {
    const armorId = (eq.armor as unknown as string) || '';
    const helmId = (eq.helm as unknown as string) || '';

    if (AGILE_STYLES.has(warrior.style)) {
      const isHeavyPlate =
        armorId.toLowerCase().includes('plate') || helmId.toLowerCase().includes('full_helm');
      if (isHeavyPlate) {
        gearNotes.push(
          'Encumbrance warning: Heavy plate armor imposes severe mobility and defense penalties on agile styles. Consider chainmail or leather.'
        );
      }
    }
  }

  return {
    bestOffensiveTactic,
    bestDefensiveTactic,
    suggestedOE,
    suggestedAL,
    fallbackCondition,
    gearNotes,
  };
}
