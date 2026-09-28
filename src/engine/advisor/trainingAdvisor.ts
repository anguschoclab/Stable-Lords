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
import type { Trainer, TrainerTier } from '@/types/shared.types';
import { assessBurnRisks } from '@/engine/training/burnAnalysis';
import { computeGainChance } from '@/engine/training';
import { FOCUS_ATTR_MAP } from '@/engine/training/coachLogic';
import { TRAINER_WEEKLY_SALARY } from '@/engine/trainers/trainers';

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

const TIER_RANK: Record<TrainerTier, number> = { Novice: 1, Seasoned: 2, Master: 3 };

interface TrainerPick {
  trainer: Trainer;
  /** True when the top choice was skipped because the treasury can't cover its salary. */
  downgraded: boolean;
}

/**
 * Recommend a stable trainer for the advice mode. Recovery prefers Healing
 * focus; trait training prefers style affinity then specialty; attribute and
 * skill drills match the trainer focus to the target attribute via the
 * canonical FOCUS_ATTR_MAP. Expired contracts are skipped; trainers whose
 * weekly salary exceeds the treasury are passed over for cheaper tiers.
 */
function selectTrainerForAdvice(
  warrior: Warrior,
  trainers: Trainer[] | undefined,
  mode: WarriorTrainingAdvice['mode'],
  targetAttribute: keyof Attributes | undefined,
  treasury: number | undefined
): TrainerPick | undefined {
  const active = (trainers ?? []).filter((t) => t.contractWeeksLeft > 0);
  if (active.length === 0) return undefined;

  const affordable =
    treasury === undefined
      ? active
      : active.filter((t) => TRAINER_WEEKLY_SALARY[t.tier] <= treasury);
  // When the treasury is known and no contracted trainer is affordable, make
  // no coaching recommendation rather than steering the stable into deficit.
  if (affordable.length === 0) return undefined;
  const downgraded = affordable.length < active.length;
  const pool = affordable;

  const affinity = (t: Trainer): number => {
    if (mode === 'recovery') return t.focus === 'Healing' ? 10 : 0;
    if (mode === 'trait') {
      return (t.styleBonusStyle === warrior.style ? 10 : 0) + (t.specialty ? 2 : 0);
    }
    if (targetAttribute) {
      return (FOCUS_ATTR_MAP[t.focus] ?? []).includes(targetAttribute) ? 10 : 0;
    }
    return 0;
  };

  const best = pool
    .slice()
    .sort((a, b) => affinity(b) - affinity(a) || TIER_RANK[b.tier] - TIER_RANK[a.tier])[0];
  if (!best) return undefined;

  return { trainer: best, downgraded };
}

/** Pick the training target: seasonal affinity first, then style primaries. */
function chooseTrainableAttr(
  trainableKeys: (keyof Attributes)[],
  stylePrimaries: (keyof Attributes)[],
  season: GameState['season']
): keyof Attributes | undefined {
  // Seasonal affinity bonus
  if (season === 'Spring' && trainableKeys.includes('CN') && stylePrimaries.includes('CN')) {
    return 'CN';
  }
  if (season === 'Summer' && trainableKeys.includes('ST') && stylePrimaries.includes('ST')) {
    return 'ST';
  }

  // Fallback to highest priority style primary
  const primary = stylePrimaries.find((attr) => trainableKeys.includes(attr));
  if (primary) return primary;

  // Fallback to any remaining trainable attribute
  return trainableKeys[0];
}

/** Med Bay recommendation with an affordable coach pick attached. */
function recoveryAdvice(
  warrior: Warrior,
  state: GameState,
  headline: string,
  reasoningBase: string
): WarriorTrainingAdvice {
  const pick = selectTrainerForAdvice(warrior, state.trainers, 'recovery', undefined, state.treasury);
  return {
    mode: 'recovery',
    targetTrainerId: pick?.trainer.id,
    headline,
    reasoning: `${reasoningBase}${pick ? ` Recommended coach: ${pick.trainer.name}.` : ''}${
      pick?.downgraded ? ' Treasury covers only lower-tier coaching this week.' : ''
    }`,
  };
}

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
    return recoveryAdvice(
      warrior,
      state,
      'Assign to Med Bay Recovery',
      `Warrior carries active injury (${worst?.name ?? 'Injury'}). Active recovery reduces weeks remaining and eliminates training injury risk.`
    );
  }

  // 2. Hard Gate: Fatigue -> Med Bay Recovery
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue >= 40) {
    return recoveryAdvice(
      warrior,
      state,
      'Assign to Med Bay (Rest & Recuperation)',
      `Fatigue level is elevated (${fatigue}%). Rest in the Med Bay clears fatigue and restores peak stamina for upcoming bouts.`
    );
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
  const chosenAttr = chooseTrainableAttr(trainableKeys, stylePrimaries, state.season);

  // 6. If an attribute was found, return attribute training recommendation
  if (chosenAttr) {
    return attributeAdvice(warrior, state, trainers, chosenAttr, burnSummary);
  }

  // 7. If all trainable attributes are capped, fallback to Skill Drilling or Trait Training
  return cappedFallbackAdvice(warrior, state, trainers, burnSummary);
}

/**
 * Attribute-training recommendation for a chosen trainable attribute:
 * gain chance, style synergy text, seasonal bonus note, coach pick.
 */
function attributeAdvice(
  warrior: Warrior,
  state: GameState,
  trainers: Trainer[],
  chosenAttr: keyof Attributes,
  burnSummary: string | undefined
): WarriorTrainingAdvice {
  const gainChance = computeGainChance(warrior, chosenAttr, trainers);
  const label = ATTRIBUTE_LABELS[chosenAttr];
  const pick = selectTrainerForAdvice(warrior, trainers, 'attribute', chosenAttr, state.treasury);
  return {
    mode: 'attribute',
    targetAttribute: chosenAttr,
    targetTrainerId: pick?.trainer.id,
    gainChance,
    headline: `Train ${label} (${Math.round(gainChance * 100)}% gain chance)`,
    reasoning: `${label} strongly synergizes with ${warrior.style} fighting style.${
      (state.season === 'Spring' && chosenAttr === 'CN') ||
      (state.season === 'Summer' && chosenAttr === 'ST')
        ? ` Accelerated by ${state.season} seasonal growth bonus.`
        : ''
    }${pick ? ` Recommended coach: ${pick.trainer.name}.` : ''}${
      pick?.downgraded ? ' Treasury covers only lower-tier coaching this week.' : ''
    }`,
    burnWarning: burnSummary,
  };
}

/**
 * Fallback recommendation once every trainable attribute is capped: skill
 * drilling while a drill slot remains, otherwise trait development.
 */
function cappedFallbackAdvice(
  warrior: Warrior,
  state: GameState,
  trainers: Trainer[],
  burnSummary: string | undefined
): WarriorTrainingAdvice {
  const drillKeys: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];
  const drilledSkill = drillKeys.find((s) => (warrior.skillDrills?.[s] ?? 0) < 3);

  if (drilledSkill) {
    const pick = selectTrainerForAdvice(warrior, trainers, 'skillDrill', undefined, state.treasury);
    return {
      mode: 'skillDrill',
      targetSkill: drilledSkill,
      targetTrainerId: pick?.trainer.id,
      headline: `Skill Drill: ${drilledSkill} (+1)`,
      reasoning: `Primary physical attributes have reached potential ceiling. Skill drilling provides direct additive combat bonuses.${
        pick ? ` Recommended coach: ${pick.trainer.name}.` : ''
      }${pick?.downgraded ? ' Treasury covers only lower-tier coaching this week.' : ''}`,
      burnWarning: burnSummary,
    };
  }

  const pick = selectTrainerForAdvice(warrior, trainers, 'trait', undefined, state.treasury);
  const anyActiveTrainer = (trainers ?? []).some((t) => t.contractWeeksLeft > 0);
  const traitDeferred =
    !pick && anyActiveTrainer && state.treasury !== undefined;
  return {
    mode: 'trait',
    targetTrainerId: pick?.trainer.id,
    headline: traitDeferred
      ? 'Defer Trait Development — Treasury Insufficient'
      : 'Trait Development with Master Trainer',
    reasoning: `Attributes and skill drills capped. Focus on advanced combat traits and specialized technique coaching.${
      pick ? ` Recommended coach: ${pick.trainer.name}.` : ''
    }${pick?.downgraded ? ' Treasury covers only lower-tier coaching this week.' : ''}${
      traitDeferred
        ? ' Treasury cannot cover any contracted trainer salary — defer trait training or hire cheaper coaching.'
        : ''
    }`,
    burnWarning: burnSummary,
  };
}
