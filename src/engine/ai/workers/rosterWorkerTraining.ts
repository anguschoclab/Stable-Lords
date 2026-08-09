/**
 * AI roster training logic — attribute training, skill drilling, trait development.
 * Extracted from rosterWorker.ts for SRP separation.
 */
import type {
  GameState,
  RivalStableData,
  SeasonalGrowth,
  OwnerPersonality,
} from '@/types/state.types';
import type { Attributes, Season, BaseSkills } from '@/types/shared.types';
import { FightingStyle, ATTRIBUTE_KEYS, ATTRIBUTE_MAX } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { computeWarriorStats } from '../../skillCalc';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  processAttributeTraining,
  processSkillDrillTraining,
  rollForTrainingInjury,
  SKILL_DRILL_CAP,
  TOTAL_CAP,
} from '@/engine/training/trainingGains';
import {
  traitCapacity,
  meritsTraitDevelopment,
  countFlaws,
  pickExposureFlaw,
} from '@/engine/training/trainingGains/traitCapacity';
import { rollTraitTraining, TRAIT_CAP } from '@/engine/training/trainingGains/traitTraining';
import { policyFor } from '@/engine/ai/traitPolicy';
import type { Trainer } from '@/types/shared.types';

/**
 * AI training runs at ~80% player effectiveness per the Training Mechanics spec.
 * The 80% lever is a **pre-gate** on whether the week attempts training at all;
 * once we decide to attempt, the full shared pipeline runs so potential caps,
 * `TOTAL_CAP`, `SEASONAL_CAP_PER_ATTR`, diminishing returns, trainer bonuses,
 * and injury rolls all fire exactly the same way they do for the player.
 *
 * Net gain rate = 0.8 × `computeGainChance(...)` (modulo pipeline gates),
 * which matches the spec's multiplicative-effectiveness intent.
 */
const AI_TRAINING_EFFECTIVENESS = 0.8;

/** Weekly chance that a struggling or already-flawed warrior picks up a (further)
 *  flaw even when not developing positively — keeps multi-flaw churn alive. Knob. */
export const FLAW_EXPOSURE_CHANCE = 0.02;

/** Per-week development chance for a *qualified* warrior (merit + under capacity).
 *  Merit + aptitude already keep most of the world blank, so the small qualified
 *  pool should develop *richly* — climbing to capacity and reaching their class
 *  Signature — rather than thinly. Floors the personality trainAppetite. Knob. */
export const QUALIFIED_DEV_APPETITE = 0.5;

/**
 * Select which attribute the AI should train this week.
 * Uses seasonal priority (Spring→CN, Summer→ST), falling back to the lowest trainable stat.
 * Never selects SZ (untrainable). Returns undefined if no trainable stat is available.
 */
export function selectTrainingFocus(
  w: Warrior,
  season: Season | undefined
): keyof Attributes | undefined {
  const trainableKeys = ATTRIBUTE_KEYS.filter((k) => k !== 'SZ') as (keyof Attributes)[];

  let chosen: keyof Attributes | undefined;
  if (season === 'Spring') chosen = 'CN';
  else if (season === 'Summer') chosen = 'ST';

  if (!chosen || w.attributes[chosen] >= ATTRIBUTE_MAX) {
    const initialKey = trainableKeys[0];
    if (initialKey) {
      chosen = trainableKeys.reduce(
        (min, k) => (w.attributes[k] < w.attributes[min] ? k : min),
        initialKey
      );
    }
  }

  return chosen;
}

/**
 * Execute a single training attempt: state adapter + processAttributeTraining + injury roll + stat recompute.
 */
function executeTrainingAttempt(
  w: Warrior,
  chosen: keyof Attributes,
  stable: RivalStableData,
  season: Season | undefined,
  seasonalGrowth: SeasonalGrowth[],
  rng: IRNGService,
  healingBonus: number
): { warrior: Warrior; seasonalGrowth: SeasonalGrowth[] } {
  const stateAdapter = {
    season: season ?? 'Spring',
    trainers: stable.trainers ?? [],
  } as unknown as GameState;

  const attemptResult = processAttributeTraining(w, chosen, stateAdapter, seasonalGrowth, rng);
  let warrior = attemptResult.updatedWarrior ?? w;
  const nextSeasonalGrowth = attemptResult.updatedSeasonalGrowth ?? seasonalGrowth;

  const injuryRoll = rollForTrainingInjury(warrior, healingBonus, rng);
  if (injuryRoll.injury) {
    warrior = { ...warrior, injuries: [...(warrior.injuries ?? []), injuryRoll.injury] };
  }

  if (warrior !== w) {
    const { baseSkills, derivedStats } = computeWarriorStats(warrior.attributes, warrior.style);
    warrior = { ...warrior, baseSkills, derivedStats };
  }

  return { warrior, seasonalGrowth: nextSeasonalGrowth };
}

/** SeasonalGrowth is shared across a stable's roster, so we thread it through the loop. */
export function performAITraining(
  w: Warrior,
  stable: RivalStableData,
  season: Season | undefined,
  seasonalGrowth: SeasonalGrowth[],
  rng: IRNGService,
  healingBonus: number = 0
): { warrior: Warrior; seasonalGrowth: SeasonalGrowth[]; chosen?: keyof Attributes } {
  if (rng.next() >= AI_TRAINING_EFFECTIVENESS) return { warrior: w, seasonalGrowth };

  const total = ATTRIBUTE_KEYS.reduce((sum, k) => sum + w.attributes[k], 0);
  if (total >= TOTAL_CAP) return { warrior: w, seasonalGrowth };

  const chosen = selectTrainingFocus(w, season);
  if (!chosen) return { warrior: w, seasonalGrowth };

  const { warrior, seasonalGrowth: nextGrowth } = executeTrainingAttempt(
    w,
    chosen,
    stable,
    season,
    seasonalGrowth,
    rng,
    healingBonus
  );

  return { warrior, seasonalGrowth: nextGrowth, chosen };
}

/**
 * Style → primary drilled skill. Mirrors the player's implicit affinity when
 * they pick a drill focus in the Training UI — a BashingAttack fighter drills
 * ATT, a TotalParry fighter drills PAR, etc. Kept as a small lookup rather
 * than style-passive-derived so future style rebalances don't silently
 * reroute AI drill priorities.
 */
const STYLE_PRIMARY_DRILL: Record<FightingStyle, keyof BaseSkills> = {
  [FightingStyle.AimedBlow]: 'DEC',
  [FightingStyle.BashingAttack]: 'ATT',
  [FightingStyle.LungingAttack]: 'ATT',
  [FightingStyle.ParryLunge]: 'PAR',
  [FightingStyle.ParryRiposte]: 'RIP',
  [FightingStyle.ParryStrike]: 'PAR',
  [FightingStyle.SlashingAttack]: 'ATT',
  [FightingStyle.StrikingAttack]: 'ATT',
  [FightingStyle.TotalParry]: 'PAR',
  [FightingStyle.WallOfSteel]: 'DEF',
};

const DRILLABLE_SKILLS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

/**
 * Skill drilling for AI warriors — routes through the shared
 * `processSkillDrillTraining` pipeline so cap (`SKILL_DRILL_CAP=3`),
 * chance formula, and trainer-focus bonus are all evaluated identically
 * to the player path.
 *
 * Focus policy: prefer the style's primary skill if still below the drill
 * cap; otherwise pick the lowest-drilled skill overall so a capped warrior
 * still benefits from the week's training slot rather than no-op-ing.
 */
export function performAISkillDrill(
  w: Warrior,
  stable: RivalStableData,
  rng: IRNGService
): Warrior {
  const primary = STYLE_PRIMARY_DRILL[w.style as FightingStyle];
  const drills = w.skillDrills ?? {};
  let skill: keyof BaseSkills | undefined;
  if (primary && (drills[primary] ?? 0) < SKILL_DRILL_CAP) {
    skill = primary;
  } else {
    // Fall back to the least-drilled still-below-cap skill; ties broken by
    // declaration order in DRILLABLE_SKILLS.
    let bestCount = SKILL_DRILL_CAP;
    for (const s of DRILLABLE_SKILLS) {
      const c = drills[s] ?? 0;
      if (c < bestCount) {
        bestCount = c;
        skill = s;
      }
    }
  }
  if (!skill) return w; // All skills at cap — nothing to drill.

  const stateAdapter = { trainers: stable.trainers ?? [] } as unknown as GameState;
  const { updatedWarrior } = processSkillDrillTraining(w, skill, stateAdapter, rng);
  return updatedWarrior ?? w;
}

/**
 * Trait development pass for AI stables — per active warrior, with probability
 * trainAppetite (gated by treasury), resolve one rollTraitTraining against a
 * synthetic trainer at the policy ceiling.
 */
export function processTraitDevelopment(
  roster: Warrior[],
  treasury: number,
  ownerPersonality: OwnerPersonality | undefined,
  rng: IRNGService
): Warrior[] {
  const traitPolicy = policyFor(ownerPersonality);
  if (treasury <= 300) return roster;

  const aiTrainer: Trainer = {
    id: 'ai',
    name: 'AI Coach',
    tier: traitPolicy.ceiling,
    focus: 'Mind',
    fame: 0,
    age: 40,
    contractWeeksLeft: 99,
  };

  return roster.map((w) => {
    if (w.status !== 'Active') return w;
    const traits = w.traits ?? [];
    if (traits.length >= TRAIT_CAP) return w;

    const canDevelop = meritsTraitDevelopment(w) && traits.length < traitCapacity(w);
    if (canDevelop) {
      const devChance = Math.max(traitPolicy.trainAppetite, QUALIFIED_DEV_APPETITE);
      if (rng.next() > devChance) return w;
      const roll = rollTraitTraining(w, aiTrainer, rng);
      if (roll.outcome !== 'none' && roll.traitId) {
        return { ...w, traits: [...traits, roll.traitId] };
      }
      return w;
    }

    const struggling = (w.career?.losses ?? 0) > (w.career?.wins ?? 0);
    if ((struggling || countFlaws(w) >= 1) && rng.next() < FLAW_EXPOSURE_CHANCE) {
      const flawId = pickExposureFlaw(w, rng);
      if (flawId) return { ...w, traits: [...traits, flawId] };
    }
    return w;
  });
}
