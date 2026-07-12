import { updateEntityInList } from '@/utils/stateUtils';
import { filterActive } from '@/utils/roster';
import type {
  GameState,
  RivalStableData,
  SeasonalGrowth,
  TrainingAssignment,
} from '@/types/state.types';
import { TRAINING_COST } from '@/constants/economy';
import type { Attributes, Season } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import { checkBudget } from './budgetWorker';
import { computeWarriorStats } from '../../skillCalc';
import { logAgentAction } from '../agentCore';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { generateRecommendations } from '@/engine/equipmentOptimizer';
import { validateLoadout, checkWeaponRequirements } from '@/data/equipment';
import {
  processAttributeTraining,
  processRecovery,
  processSkillDrillTraining,
  rollForTrainingInjury,
  SKILL_DRILL_CAP,
  TOTAL_CAP,
} from '@/engine/training/trainingGains';
import { getHealingTrainerBonus } from '@/engine/training/coachLogic';
import { rollTraitTraining, TRAIT_CAP } from '@/engine/training/trainingGains/traitTraining';
import {
  traitCapacity,
  meritsTraitDevelopment,
  countFlaws,
  pickExposureFlaw,
} from '@/engine/training/trainingGains/traitCapacity';
import { policyFor } from '@/engine/ai/traitPolicy';
import type { Trainer } from '@/types/shared.types';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MAX,
  FightingStyle,
  type BaseSkills,
} from '@/types/shared.types';

/**
 * RosterWorker: Handles training and equipment.
 * Implements "Risk-Tiered Execution" for gear.
 */
export function processRoster(
  rival: RivalStableData,
  currentWeek: number,
  season?: Season,
  seed?: number,
  rng?: IRNGService
): RivalStableData {
  const rngService = rng || new SeededRNGService(seed ?? currentWeek * 7919 + 101);
  let updatedRival = { ...rival };
  let seasonalGrowth: SeasonalGrowth[] = updatedRival.seasonalGrowth ?? [];
  const activeRoster = filterActive(updatedRival.roster);
  const intent = updatedRival.strategy?.intent ?? 'CONSOLIDATION';

  // 0. Recovery — tick injuries for all active wounded warriors, applying any
  // healing trainer bonus exactly as the player path does in training.ts.
  const healingBonus = getHealingTrainerBonus(updatedRival.trainers ?? []);
  for (const wounded of activeRoster) {
    if ((wounded.injuries ?? []).length === 0) continue;
    const { updatedInjuries } = processRecovery(wounded, healingBonus);
    updatedRival.roster = updateEntityInList(updatedRival.roster, wounded.id, (w) => ({
      ...w,
      injuries: updatedInjuries,
    }));
  }

  // ⚡ Bolt Optimization: Using updateEntityInList instead of .map()
  // 💡 What: Replaced .map() traversal with a targeted index update.
  // 🎯 Why: Avoids O(N) allocations and redundant iterations when modifying a single element.
  // 📊 Impact: Significantly reduces GC pressure during hot loops updating game state arrays.

  // 1. Training (Low Risk)
  // ⚡ TSA: Prioritize Champion or high-fame units for training.
  // Injured warriors are excluded — they are already in the recovery path above
  // and training them would stack the injury penalty from trainingGains.ts.
  const trainingLimit = updatedRival.treasury > 500 ? 3 : 1;
  const { champions, nonChampions } = updatedRival.roster.reduce(
    (acc, w) => {
      if (w.status !== 'Active' || (w.injuries ?? []).length > 0) return acc;
      if (w.champion || w.isStarInvestment) acc.champions.push(w);
      else acc.nonChampions.push(w);
      return acc;
    },
    {
      champions: [] as typeof updatedRival.roster,
      nonChampions: [] as typeof updatedRival.roster,
    }
  );
  nonChampions.sort((a, b) => (b.fame || 0) - (a.fame || 0));
  const trainees = [...champions, ...nonChampions].slice(0, trainingLimit);

  for (const trainee of trainees) {
    const budgetReport = checkBudget(updatedRival, TRAINING_COST, 'ROSTER');

    if (budgetReport.isAffordable) {
      // With the `skillDrilling` feature flag on, roughly 1-in-4 AI training
      // weeks spend on skill drilling instead of attribute training — same
      // option surface the player has in the TrainingAssignment UI. Below the
      // cap a drill is comparatively cheap and the attribute pipeline handles
      // the rest of the time.
      const doDrill = rngService.next() < 0.25;
      if (doDrill) {
        updatedRival.roster = updateEntityInList(updatedRival.roster, trainee.id, (w) =>
          performAISkillDrill(w, updatedRival, rngService)
        );
        updatedRival.trainingAssignments = [
          ...(updatedRival.trainingAssignments || []),
          { warriorId: trainee.id, type: 'skillDrill' } as TrainingAssignment,
        ];
      } else {
        const {
          warrior,
          seasonalGrowth: nextGrowth,
          chosen,
        } = performAITraining(
          trainee,
          updatedRival,
          season,
          seasonalGrowth,
          rngService,
          healingBonus
        );
        seasonalGrowth = nextGrowth;
        updatedRival.roster = updateEntityInList(updatedRival.roster, warrior.id, () => warrior);
        if (chosen) {
          updatedRival.trainingAssignments = [
            ...(updatedRival.trainingAssignments || []),
            { warriorId: trainee.id, type: 'attribute', attribute: chosen } as TrainingAssignment,
          ];
        }
      }
    }
  }
  updatedRival.seasonalGrowth = seasonalGrowth;

  // 1b. Trait Development — per active warrior, with probability trainAppetite
  // (gated by treasury), resolve one rollTraitTraining against a synthetic
  // trainer at the policy ceiling. Produces both new traits and botched flaws,
  // feeding the liability-based culling in processAIRosterManagement.
  // Ensures AI stables can roll new traits (e.g. orphan_resilience, street_rat_cunning) during roster generation and recruitment. No manual wiring needed due to dynamic nature.
  const traitPolicy = policyFor(updatedRival.owner.personality);
  if ((updatedRival.treasury ?? 0) > 300) {
    const aiTrainer: Trainer = {
      id: 'ai',
      name: 'AI Coach',
      tier: traitPolicy.ceiling,
      focus: 'Mind',
      fame: 0,
      age: 40,
      contractWeeksLeft: 99,
    };
    updatedRival.roster = updatedRival.roster.map((w) => {
      if (w.status !== 'Active') return w;
      const traits = w.traits ?? [];
      if (traits.length >= TRAIT_CAP) return w; // hard cap reached, nothing more

      // (1) Merit gate + (2) aptitude capacity: only earned, capable warriors develop.
      const canDevelop = meritsTraitDevelopment(w) && traits.length < traitCapacity(w);
      if (canDevelop) {
        const devChance = Math.max(traitPolicy.trainAppetite, QUALIFIED_DEV_APPETITE);
        if (rngService.next() > devChance) return w;
        const roll = rollTraitTraining(w, aiTrainer, rngService);
        if (roll.outcome !== 'none' && roll.traitId) {
          return { ...w, traits: [...traits, roll.traitId] };
        }
        return w;
      }

      // Flaw exposure: warriors who are struggling (losing record) or already
      // carry a flaw risk picking up a further flaw — feeding multi-flaw churn.
      const struggling = (w.career?.losses ?? 0) > (w.career?.wins ?? 0);
      if ((struggling || countFlaws(w) >= 1) && rngService.next() < FLAW_EXPOSURE_CHANCE) {
        const flawId = pickExposureFlaw(w, rngService);
        if (flawId) return { ...w, traits: [...traits, flawId] };
      }
      return w;
    });
  }

  // 2. Equipment (High Risk)
  // Champions always get gear consideration regardless of intent (treasury gate only).
  // activeForGear is derived fresh (post-training) so gear candidates reflect current state.
  const activeForGear = filterActive(updatedRival.roster);
  const champWarrior = activeForGear.find((w) => w.champion);
  if (champWarrior && updatedRival.treasury > 800) {
    const gearCost = 150;
    const budgetReport = checkBudget(updatedRival, gearCost, 'ROSTER');
    if (budgetReport.isAffordable) {
      updatedRival.treasury -= gearCost;
      updatedRival.roster = updateEntityInList(updatedRival.roster, champWarrior.id, (w) =>
        applyGearUpgrade(w, rngService)
      );
      updatedRival = logAgentAction(
        updatedRival,
        'ROSTER',
        `Invested 150g in gear for champion ${champWarrior.name}.`,
        budgetReport.riskTier,
        currentWeek
      );
    }
  }
  if (intent === 'EXPANSION' || (intent === 'VENDETTA' && updatedRival.treasury > 1000)) {
    const gearCost = 150;
    const budgetReport = checkBudget(updatedRival, gearCost, 'ROSTER');

    if (budgetReport.isAffordable && activeForGear.length > 0) {
      // ⚡ TSA: Role-Based Gearing (Prioritize Champion or the 'Muddy' Basher for rain insurance)
      const gearCandidate =
        activeForGear.find((w) => w.champion) ??
        activeForGear.find((w) => w.style === FightingStyle.BashingAttack) ??
        rngService.pick(activeForGear);

      if (gearCandidate) {
        updatedRival.treasury -= gearCost;
        updatedRival.roster = updateEntityInList(updatedRival.roster, gearCandidate.id, (w) =>
          applyGearUpgrade(w, rngService)
        );
        updatedRival = logAgentAction(
          updatedRival,
          'ROSTER',
          `Invested 150g in gear for ${gearCandidate.name}.`,
          budgetReport.riskTier,
          currentWeek
        );
      }
    }
  }

  return updatedRival;
}

/**
 * Apply an equipment upgrade — validated through the same loadout + weapon-
 * requirement gates the player hits via `StableEquipment.tsx`. Walks the
 * optimizer recommendations in profile-priority order, skipping any that fail
 * `validateLoadout` (catches two-handed + shield) or `checkWeaponRequirements`
 * (ST/SZ/WT/DF gates). If every recommendation fails, the warrior is returned
 * untouched — no attribute nudge, no invalid gear applied.
 *
 * Historical note: the previous implementation didn't write `warrior.equipment`
 * at all — it just incremented attributes based on the top recommendation's
 * weight profile. That made the function a misnamed attribute nudger *and*
 * skipped every validation gate. We now do the job on the tin and honor the
 * shared validator.
 */
function applyGearUpgrade(w: Warrior, _rng: IRNGService): Warrior {
  const recommendations = generateRecommendations(w.style, w.derivedStats?.encumbrance ?? 0);
  const attrs = {
    ST: w.attributes.ST,
    SZ: w.attributes.SZ,
    WT: w.attributes.WT,
    DF: w.attributes.DF,
  };

  for (const rec of recommendations) {
    const loadoutIssues = validateLoadout(rec.loadout);
    if (loadoutIssues.length > 0) continue;
    const wepReq = checkWeaponRequirements(rec.loadout.weapon, attrs);
    if (!wepReq.met) continue;
    // Validated loadout wins — apply to the warrior.
    return { ...w, equipment: { ...rec.loadout } };
  }
  return w;
}

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
function performAITraining(
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
    w, chosen, stable, season, seasonalGrowth, rng, healingBonus
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
function performAISkillDrill(w: Warrior, stable: RivalStableData, rng: IRNGService): Warrior {
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
