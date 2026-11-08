/**
 * Per-fight skill learning — the Arena-93 doctrine that warriors improve
 * primarily by learning skills in the arena, not just by training stats.
 *
 * Canon (Pagan, "Priority Skill Learning", Noblish Island):
 *  - Each bout, a fighter learns 0–6 skills.
 *  - The learn pool is weighted by BOTH combatants' style priorities —
 *    you learn what the fight teaches.
 *  - Wit gates learning: bright fighters pick up more per bout.
 *  - Every warrior has a hidden favorite learn (third affinity, alongside
 *    favorite weapon and favorite rhythm) that is always on, discovered
 *    or not — discovery only *reveals* it.
 *
 * The favorite learn is derived, not stored: a stable FNV-1a hash of the
 * warrior id picks the affinity — deterministic, needs no creation-time
 * draw, and works identically on legacy warriors.
 */
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { BaseSkills } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { hashStr, resolveRng } from '@/utils/random';
import { STYLE_LEARN_WEIGHTS } from '@/data/learnPriorities';
import { effectiveLearnCap } from './skillBurn';
import {
  LEARN_ATTEMPTS,
  LEARN_WT_FACTOR,
  LEARN_FAVORITE_WEIGHT,
  LEARN_CAREER_CAP,
  LEARN_SUSPECT_MIN,
} from '@/constants/combat/combat/learn';

/** Declaration-ordered skill keys — the iteration contract for the learn
 *  pool. `rollWeighted` walks Object.entries insertion order, so the pool is
 *  always built in this order, never by spreading two records. */
export const LEARN_SKILL_KEYS: readonly (keyof BaseSkills)[] = [
  'ATT',
  'PAR',
  'DEF',
  'INI',
  'RIP',
  'DEC',
];

/**
 * The warrior's hidden favorite learn — the third affinity. Derived from a
 * stable hash of the warrior id so it is always defined, always the same,
 * and costs no creation-time RNG draw.
 */
export function favoriteLearnOf(warrior: Pick<Warrior, 'id'>): keyof BaseSkills {
  return LEARN_SKILL_KEYS[hashStr(String(warrior.id)) % LEARN_SKILL_KEYS.length] as keyof BaseSkills;
}

/**
 * The learn pool: the learner's own style priorities plus the opponent's,
 * with LEARN_FAVORITE_WEIGHT on the favorite learn. Built in LEARN_SKILL_KEYS
 * order so the weighted roll consumes deterministically.
 */
export function learnPoolWeights(
  learnerStyle: FightingStyle | undefined,
  opponentStyle: FightingStyle | undefined,
  favoriteLearn?: keyof BaseSkills
): Record<keyof BaseSkills, number> {
  // Missing/unknown styles contribute zero weight — defensive for callers
  // handing over partial warriors (test mocks, degenerate data).
  const own = learnerStyle ? STYLE_LEARN_WEIGHTS[learnerStyle] : undefined;
  const opp = opponentStyle ? STYLE_LEARN_WEIGHTS[opponentStyle] : undefined;
  const weights = {} as Record<keyof BaseSkills, number>;
  for (const skill of LEARN_SKILL_KEYS) {
    weights[skill] =
      (own?.[skill] ?? 0) +
      (opp?.[skill] ?? 0) +
      (skill === favoriteLearn ? LEARN_FAVORITE_WEIGHT : 0);
  }
  return weights;
}

/** Total skills the warrior has learned over their career. */
export function learnsTotal(warrior: Pick<Warrior, 'learnedSkills'>): number {
  return Object.values(warrior.learnedSkills ?? {}).reduce((s, v) => s + (v ?? 0), 0);
}

export interface BoutLearnResult {
  /** Skills gained in this bout (per-skill deltas). */
  gained: Partial<Record<keyof BaseSkills, number>>;
  /** The full accumulated learn ledger after this bout — route wholesale. */
  learnedSkills: Partial<Record<keyof BaseSkills, number>>;
}

/**
 * Roll one bout's skill learns for a warrior.
 *
 * LEARN_ATTEMPTS Bernoulli trials at WT × LEARN_WT_FACTOR; each success draws
 * from the priority pool. Skills at LEARN_PER_SKILL_CAP drop out of the pool
 * (the arena stops teaching what is mastered); the career ledger stops at
 * LEARN_CAREER_CAP.
 *
 * The cap check runs before the attempt draw, so a capped-out warrior
 * consumes no further stream — the consumption shape only changes while
 * learning is actually possible.
 *
 * @param warrior - Learner (needs id, style, attributes.WT, learnedSkills, career)
 * @param opponentStyle - Whose style taught the lesson this bout
 * @param rng - Bout RNG; falls back to a per-warrior-per-bout seeded stream
 */
export function rollBoutLearns(
  warrior: Pick<Warrior, 'id' | 'style' | 'attributes' | 'learnedSkills' | 'burnedSkills' | 'career'>,
  opponentStyle: FightingStyle | undefined,
  rng?: IRNGService
): BoutLearnResult {
  const careerBouts = (warrior.career?.wins ?? 0) + (warrior.career?.losses ?? 0);
  const rngService = resolveRng(rng, hashStr(`learn|${warrior.id}|${careerBouts}`));

  const favorite = favoriteLearnOf(warrior);
  const learnedSkills: Partial<Record<keyof BaseSkills, number>> = {
    ...(warrior.learnedSkills ?? {}),
  };
  const gained: Partial<Record<keyof BaseSkills, number>> = {};
  let total = learnsTotal(warrior);

  const wt = warrior.attributes?.WT ?? 10;
  const learnChance = wt * LEARN_WT_FACTOR;

  for (let i = 0; i < LEARN_ATTEMPTS && total < LEARN_CAREER_CAP; i++) {
    if (rngService.next() >= learnChance) continue;
    // The pool rebuilds in LEARN_SKILL_KEYS order minus capped skills —
    // a mastered skill simply isn't offered by the arena anymore. Burned
    // slots shrink the cap (V23/D2): a fully-burned skill drops out of
    // the pool entirely — the arena can't teach capacity already spent.
    const full = learnPoolWeights(warrior.style, opponentStyle, favorite);
    const weights: Partial<Record<keyof BaseSkills, number>> = {};
    for (const skill of LEARN_SKILL_KEYS) {
      if ((learnedSkills[skill] ?? 0) < effectiveLearnCap(warrior, skill) && (full[skill] ?? 0) > 0) {
        weights[skill] = full[skill];
      }
    }
    if (Object.keys(weights).length === 0) break;
    const skill = rngService.rollWeighted(weights);
    learnedSkills[skill] = (learnedSkills[skill] ?? 0) + 1;
    gained[skill] = (gained[skill] ?? 0) + 1;
    total++;
  }

  return { gained, learnedSkills };
}

/**
 * Pagan's deduction method for the third affinity: the skill whose learn
 * ledger has grown fastest reads as the suspected favorite learn. Ties break
 * by declaration order — same contract as suspectedFavoriteWeapon's chart.
 */
export function suspectedFavoriteLearn(
  warrior: Pick<Warrior, 'learnedSkills'>
): keyof BaseSkills | undefined {
  let best: keyof BaseSkills | undefined;
  let bestCount = 0;
  for (const skill of LEARN_SKILL_KEYS) {
    const count = warrior.learnedSkills?.[skill] ?? 0;
    if (count >= LEARN_SUSPECT_MIN && count > bestCount) {
      best = skill;
      bestCount = count;
    }
  }
  return best;
}
