/**
 * Stable Lords — Base Skills & Derived Stats Calculator
 *
 * Base Skills: ATT, PAR, DEF, INI, RIP, DEC
 * Derived: HP, Endurance, Damage, Encumbrance
 *
 * Skill generation uses canonical Terrablood breakpoint tables:
 *   terrablood.com/duel-ii-formerly-known-as-duelmasters/terrablood-skill-chart/
 *
 * Formula: base_skill = Σ(attribute_contributions) + style_penalty
 * Clamped to [1, 20].
 *
 * Breakpoint tables and style penalties extracted to skillBreakpoints.ts
 * for SRP separation of data from computation.
 */
import { type Attributes } from '@/types/shared.types';
import { FightingStyle, type BaseSkills, type DerivedStats } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { clamp } from '@/utils/math';
import {
  computeHP as canonicalHP,
  computeDamageClass,
  computeEncumbranceCapacity,
  computeEnduranceValue,
} from '@/data/terrabloodCharts';
import {
  AMBI_REVERSED_CHANCE,
  LUCKFACTOR_RANGE,
  STRIKER_ENDURANCE_POOL_BONUS,
} from '@/constants/combat';
import { STYLE_FAMILY } from '@/data/designDoctrine';
import {
  bp,
  szMod,
  ST_ATT,
  ST_PAR,
  WT_ATT,
  WT_DEF,
  WT_INI,
  WT_RIP,
  WT_DEC,
  WL_ATT,
  WL_PAR,
  WL_DEF,
  WL_DEC,
  WL_INI,
  SP_DEC,
  SP_DEF,
  SP_INI,
  SP_RIP,
  DF_ATT,
  DF_DEF,
  DF_INI,
  DF_PAR,
  DF_RIP,
  SZ_INI_MOD,
  SZ_PAR_MOD,
  SZ_DEF_MOD,
  STYLE_PENALTIES,
  STYLE_SKILL_FLOORS,
} from './skillBreakpoints';

// ─── Base Skill Computation ───────────────────────────────────────────────

/**
 * Compute base skills from attributes + fighting style.
 * Deterministic — no randomness.
 *
 * Uses canonical Terrablood breakpoint tables with per-attribute, per-skill
 * contribution values. SZ adjusts INI/PAR/DEF. Style penalty applied as flat
 * modifier. Result clamped to [style floor, 20] (see STYLE_SKILL_FLOORS).
 *
 * @param attrs - The warrior's base attributes
 * @param style - The warrior's fighting style
 * @returns A BaseSkills object containing ATT, PAR, DEF, INI, RIP, and DEC
 */
export function computeBaseSkills(
  attrs: Attributes,
  style: FightingStyle,
  handedness?: Handedness
): BaseSkills {
  const { ST, SZ, WT, WL, SP, DF } = attrs;
  const pen = STYLE_PENALTIES[style];
  const floor = STYLE_SKILL_FLOORS[style];

  // Canon: "ABs get double the Att skills in DF" and ambidextrous warriors
  // get +1 ATT (Terrablood skill chart notes).
  const dfAtt = bp(DF_ATT, DF) * (style === FightingStyle.AimedBlow ? 2 : 1);
  const ambiAtt = handedness === 'ambidextrous' ? 1 : 0;
  const ATT_raw =
    bp(ST_ATT, ST) + bp(WT_ATT, WT) + bp(WL_ATT, WL) + dfAtt + ambiAtt + pen[0];
  const PAR_raw = bp(ST_PAR, ST) + szMod(SZ_PAR_MOD, SZ) + bp(WL_PAR, WL) + bp(DF_PAR, DF) + pen[1];
  const DEF_raw =
    szMod(SZ_DEF_MOD, SZ) +
    bp(WT_DEF, WT) +
    bp(WL_DEF, WL) +
    bp(SP_DEF, SP) +
    bp(DF_DEF, DF) +
    pen[2];
  const INI_raw =
    szMod(SZ_INI_MOD, SZ) +
    bp(WT_INI, WT) +
    bp(WL_INI, WL) +
    bp(SP_INI, SP) +
    bp(DF_INI, DF) +
    pen[3];
  const RIP_raw = bp(WT_RIP, WT) + bp(SP_RIP, SP) + bp(DF_RIP, DF) + pen[4];
  const DEC_raw = bp(WT_DEC, WT) + bp(WL_DEC, WL) + bp(SP_DEC, SP) + pen[5];

  return {
    ATT: clamp(ATT_raw, floor[0], 20),
    PAR: clamp(PAR_raw, floor[1], 20),
    DEF: clamp(DEF_raw, floor[2], 20),
    INI: clamp(INI_raw, floor[3], 20),
    RIP: clamp(RIP_raw, floor[4], 20),
    DEC: clamp(DEC_raw, floor[5], 20),
  };
}

// ─── Luckfactor (Canonical ±4 per skill, all styles) ──────────────────────
// Canon: each of the 6 skill categories gets a hidden random "luckfactor" at
// creation, so two warriors with identical stats+style differ. V23: the PS
// ±6 range was removed (luckfactor parity) — piker variance now rolls the
// shared LUCKFACTOR_RANGE like every other style. The OVERVIEW shows
// luck-free skills (computeBaseSkills); combat applies the stored luckfactor.

/**
 * Roll a per-warrior luckfactor: a hidden ±LUCKFACTOR_RANGE modifier for
 * each of the 6 skills (±PS_LUCKFACTOR_RANGE for Parry-Strike). Generated
 * once at creation and stored on the warrior. Every style consumes the same
 * six RNG draws at the same range — V23 knack parity (user-locked): pikers
 * no longer get a widened ±6 range; LUCKFACTOR_RANGE is the single knob.
 *
 * @param rng - Seeded RNG service for deterministic generation.
 * @param style - Kept for call-site compatibility; no longer affects the roll.
 * @returns A BaseSkills object of deltas.
 */
export function rollLuckfactor(rng: IRNGService, style?: FightingStyle): BaseSkills {
  void style;
  const range = LUCKFACTOR_RANGE;
  const d = () => rng.roll(-range, range); // roll is inclusive on both ends
  return { ATT: d(), PAR: d(), DEF: d(), INI: d(), RIP: d(), DEC: d() };
}

/**
 * Roll a per-warrior bloodlust: a hidden −1..+1 factor rolled once at
 * creation alongside luckfactor. Canon (Assur's Guide to Killing): "Some
 * warriors appear to have a higher blood lust than others." Applied to the
 * vitals roll in combat; never shown on the overview.
 *
 * @param rng - Seeded RNG service for deterministic generation.
 * @returns The stored bloodlust value in [-1, +1).
 */
export function rollBloodlust(rng: IRNGService): number {
  return rng.next() * 2 - 1;
}

// ─── Handedness (Canon ~85% right / ~7.5% left / ~7.5% ambidextrous) ───────
// Ambidextrous warriors get +1 ATT (Terrablood chart note) and eased
// dual-wield deftness requirements (dualWieldReqAmbi in equipment data).

/**
 * Handedness type. 'ambi-reversed' is the rare canon variant whose primary
 * side is the left hand — still ambidextrous for the +1 ATT and eased
 * dual-wield requirements.
 */
export type Handedness = 'right' | 'left' | 'ambidextrous' | 'ambi-reversed';

/**
 * Roll a warrior's handedness once at creation — stored on the warrior so
 * intros and equipment checks are deterministic across bouts.
 *
 * @param rng - Seeded RNG service for deterministic generation.
 * @param style - Fighting style (defensive styles produce more
 *   lefties/ambis — canon, Sir Jessie Jest). Optional: absent → flat
 *   baseline distribution.
 * @returns The warrior's handedness.
 */
// Canon (Sir Jessie Jest, Arena 93): handedness is style-conditioned —
// defensive styles produce more lefties and ambidextrous fighters (PR ~43%
// ambi). Offensive styles hold the flat ~85/7.5/7.5 baseline. The table is
// per style family; absent style keeps the baseline for tests/legacy calls.
const HANDEDNESS_BY_FAMILY: Record<
  'offensive' | 'defensive' | 'mixed',
  { right: number; leftOfRest: number }
> = {
  offensive: { right: 0.85, leftOfRest: 0.5 },
  mixed: { right: 0.75, leftOfRest: 0.5 },
  // Right 50%; of the rest ~80% ambi → ~40% ambidextrous overall (PR ~43%
  // with the reversed variant counted in).
  defensive: { right: 0.5, leftOfRest: 0.2 },
};

export function rollHandedness(rng: IRNGService, style?: FightingStyle): Handedness {
  const row = style
    ? HANDEDNESS_BY_FAMILY[STYLE_FAMILY[style]]
    : { right: 0.85, leftOfRest: 0.5 };
  if (rng.next() < row.right) return 'right';
  if (rng.next() < row.leftOfRest) return 'left';
  // Rare canon variant: the ambidextrous fighter carries primary in the
  // LEFT hand (Pagan: "reversed" ambis exist; AMBI_REVERSED_CHANCE gate).
  if (rng.next() < AMBI_REVERSED_CHANCE) return 'ambi-reversed';
  return 'ambidextrous';
}

/**
 * Apply the canon ambidextrous +1 ATT to stored base skills (clamped ≤20).
 * Called at creation after `rollHandedness` so the warrior's overview shows
 * the bonus; no-op for right/left or absent skills.
 */
export function applyHandednessAttack(skills: BaseSkills, handedness?: Handedness): void {
  if (
    (handedness === 'ambidextrous' || handedness === 'ambi-reversed') &&
    skills.ATT !== undefined
  ) {
    skills.ATT = Math.min(20, skills.ATT + 1);
  }
}

/**
 * Apply a stored luckfactor to base skills (combat-time). Each skill floored at 1.
 *
 * @param skills - Luck-free base skills (from computeBaseSkills).
 * @param luck - Optional stored luckfactor deltas. Absent → skills unchanged.
 * @returns Luck-adjusted skills for combat.
 */
export function applyLuckfactor(skills: BaseSkills, luck?: Partial<BaseSkills>): BaseSkills {
  if (!luck) return skills;
  return {
    ATT: Math.max(1, skills.ATT + (luck.ATT ?? 0)),
    PAR: Math.max(1, skills.PAR + (luck.PAR ?? 0)),
    DEF: Math.max(1, skills.DEF + (luck.DEF ?? 0)),
    INI: Math.max(1, skills.INI + (luck.INI ?? 0)),
    RIP: Math.max(1, skills.RIP + (luck.RIP ?? 0)),
    DEC: Math.max(1, skills.DEC + (luck.DEC ?? 0)),
  };
}

// ─── Derived Stats (Canonical Terrablood Charts) ────────────────────────

/**
 * HP = CN*2 + SZmod + WLmod (100% accuracy, n=3650)
 *
 * @param attrs - The warrior's base attributes
 * @returns Computed Hit Points
 */
export function computeHP(attrs: Attributes): number {
  return canonicalHP(attrs.CN, attrs.SZ, attrs.WL);
}

/**
 * Endurance from canonical (ST+CN) × WL chart.
 *
 * @param attrs - The warrior's base attributes
 * @returns Computed Endurance value
 */
export function computeEndurance(attrs: Attributes): number {
  return computeEnduranceValue(attrs.ST, attrs.CN, attrs.WL);
}

/**
 * Damage class from canonical ST × SZ chart (returns 1-9 scale).
 *
 * @param attrs - The warrior's base attributes
 * @returns Damage class index (1-9)
 */
export function computeDamage(attrs: Attributes): number {
  return computeDamageClass(attrs.ST, attrs.SZ);
}

/**
 * Encumbrance capacity from canonical ST × CN chart.
 *
 * @param attrs - The warrior's base attributes
 * @returns Encumbrance capacity value
 */
function computeEncumbrance(attrs: Attributes): number {
  return computeEncumbranceCapacity(attrs.ST, attrs.CN);
}

/**
 * Damage labels for each damage class index (0-9).
 */
export const DAMAGE_LABELS = [
  '',
  'Little',
  'Normal',
  'Good',
  'Great',
  'Tremendous',
  'Awesome',
  'Devastating',
  'Superhuman',
  'Unearthly',
];

/**
 * Convenience function to compute all derived stats at once.
 *
 * @param attrs - The warrior's base attributes
 * @returns A DerivedStats object
 */
export function computeDerivedStats(attrs: Attributes): DerivedStats {
  return {
    hp: computeHP(attrs),
    endurance: computeEndurance(attrs),
    damage: computeDamage(attrs),
    encumbrance: computeEncumbrance(attrs),
  };
}

/**
 * Full computation: base skills + derived stats.
 *
 * @param attrs - The warrior's base attributes
 * @param style - The warrior's fighting style
 * @returns An object containing baseSkills and derivedStats
 */
export function computeWarriorStats(attrs: Attributes, style: FightingStyle) {
  const derivedStats = computeDerivedStats(attrs);
  if (style === FightingStyle.StrikingAttack) {
    derivedStats.endurance = Math.round(derivedStats.endurance * STRIKER_ENDURANCE_POOL_BONUS);
  }
  return {
    baseSkills: computeBaseSkills(attrs, style),
    derivedStats,
  };
}
