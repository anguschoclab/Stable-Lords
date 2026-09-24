/**
 * Training Advisor
 * Recommends optimal weekly training assignments: Med Bay recovery for injured/fatigued fighters,
 * style-synergistic attribute drills, seasonal bonuses, and burn/ceiling avoidance.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState } from '@/types/state.types';
import {
  FightingStyle,
  type Attributes,
  type BaseSkills,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_MAX,
} from '@/types/shared.types';
import type { WarriorTrainingAdvice } from './types';
import { assessBurnRisks } from '@/engine/training/burnAnalysis';
import { computeGainChance } from '@/engine/training';

const STYLE_PRIMARY_ATTRIBUTES: Record<FightingStyle, (keyof Attributes)[]> = {
  [FightingStyle.AimedBlow]: ['DF', 'WT', 'SP', 'CN'],
  [FightingStyle.BashingAttack]: ['ST', 'CN', 'WL', 'WT'],
  [FightingStyle.LungingAttack]: ['ST', 'SP', 'DF', 'CN'],
  [FightingStyle.ParryLunge]: ['DF', 'ST', 'SP', 'CN'],
  [FightingStyle.ParryRiposte]: ['DF', 'WT', 'SP', 'CN'],
  [FightingStyle.ParryStrike]: ['CN', 'ST', 'DF', 'WL'],
  [FightingStyle.SlashingAttack]: ['SP', 'DF', 'ST', 'CN'],
  [FightingStyle.StrikingAttack]: ['ST', 'WT', 'CN', 'SP'],
  [FightingStyle.TotalParry]: ['CN', 'DF', 'WL', 'WT'],
  [FightingStyle.WallOfSteel]: ['ST', 'SP', 'DF', 'CN'],
};

/**
 * Evaluate and recommend the optimal training assignment for a warrior.
 */
export function evaluateTrainingAdvice(
  warrior: Warrior,
  state: GameState
): WarriorTrainingAdvice {
  // 1. Hard Gate: Active Injuries -> Med Bay Recovery
  const hasActiveInjury = (warrior.injuries || []).some(
    (inj) => (inj.weeksRemaining ?? 1) > 0
  );
  if (hasActiveInjury) {
    const worst = warrior.injuries[0];
    return {
      mode: 'recovery',
      headline: 'Assign to Med Bay Recovery',
      reasoning: `Warrior carries active injury (${worst?.name ?? 'Injury'}). Active recovery reduces weeks remaining and eliminates training injury risk.`,
    };
  }

  // 2. Hard Gate: Fatigue -> Med Bay Recovery
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue >= 40) {
    return {
      mode: 'recovery',
      headline: 'Assign to Med Bay (Rest & Recuperation)',
      reasoning: `Fatigue level is elevated (${fatigue}%). Rest in the Med Bay clears fatigue and restores peak stamina for upcoming bouts.`,
    };
  }

  // 3. Potential Ceilings & Burn Risks
  const trainers = state.trainers ?? [];
  const burnWarnings = assessBurnRisks(warrior, trainers);
  const cappedAttrs = new Set<keyof Attributes>();
  let burnSummary: string | undefined;

  for (const w of burnWarnings) {
    if (w.severity === 'high' || w.reason.includes('ceiling')) {
      cappedAttrs.add(w.attribute);
    }
  }

  if (cappedAttrs.size > 0) {
    const cappedNames = Array.from(cappedAttrs).map((k) => ATTRIBUTE_LABELS[k]).join(', ');
    burnSummary = `Potential ceiling reached for: ${cappedNames}. Shifting focus to uncapped stats.`;
  }

  // 4. Candidate Trainable Attributes (SZ is untrainable)
  const trainableKeys = (ATTRIBUTE_KEYS.filter((k) => k !== 'SZ') as (keyof Attributes)[]).filter(
    (k) => !cappedAttrs.has(k) && warrior.attributes[k] < ATTRIBUTE_MAX
  );

  // 5. Select Best Synergistic Attribute
  const stylePrimaries = STYLE_PRIMARY_ATTRIBUTES[warrior.style] ?? ['ST', 'CN', 'WT'];

  // Seasonal affinity bonus
  let chosenAttr: keyof Attributes | undefined;
  if (state.season === 'Spring' && trainableKeys.includes('CN') && stylePrimaries.includes('CN')) {
    chosenAttr = 'CN';
  } else if (state.season === 'Summer' && trainableKeys.includes('ST') && stylePrimaries.includes('ST')) {
    chosenAttr = 'ST';
  }

  // Fallback to highest priority style primary
  if (!chosenAttr) {
    chosenAttr = stylePrimaries.find((attr) => trainableKeys.includes(attr));
  }

  // Fallback to any remaining trainable attribute
  if (!chosenAttr && trainableKeys.length > 0) {
    chosenAttr = trainableKeys[0];
  }

  // 6. If an attribute was found, return attribute training recommendation
  if (chosenAttr) {
    const gainChance = computeGainChance(warrior, chosenAttr, trainers);
    const label = ATTRIBUTE_LABELS[chosenAttr];
    return {
      mode: 'attribute',
      targetAttribute: chosenAttr,
      gainChance,
      headline: `Train ${label} (${Math.round(gainChance * 100)}% gain chance)`,
      reasoning: `${label} strongly synergizes with ${warrior.style} fighting style.${
        (state.season === 'Spring' && chosenAttr === 'CN') ||
        (state.season === 'Summer' && chosenAttr === 'ST')
          ? ` Accelerated by ${state.season} seasonal growth bonus.`
          : ''
      }`,
      burnWarning: burnSummary,
    };
  }

  // 7. If all trainable attributes are capped, fallback to Skill Drilling or Trait Training
  const drillKeys: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];
  const drilledSkill = drillKeys.find((s) => (warrior.skillDrills?.[s] ?? 0) < 3);

  if (drilledSkill) {
    return {
      mode: 'skillDrill',
      targetSkill: drilledSkill,
      headline: `Skill Drill: ${drilledSkill} (+1)`,
      reasoning: 'Primary physical attributes have reached potential ceiling. Skill drilling provides direct additive combat bonuses.',
      burnWarning: burnSummary,
    };
  }

  return {
    mode: 'trait',
    headline: 'Trait Development with Master Trainer',
    reasoning: 'Attributes and skill drills capped. Focus on advanced combat traits and specialized technique coaching.',
    burnWarning: burnSummary,
  };
}
