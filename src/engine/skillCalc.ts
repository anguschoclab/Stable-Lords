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
 */
import { type Attributes } from '@/types/shared.types';
import { FightingStyle, type BaseSkills, type DerivedStats } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  computeHP as canonicalHP,
  computeDamageClass,
  computeEncumbranceCapacity,
  computeEnduranceValue,
} from '@/data/terrabloodCharts';

// ─── Breakpoint Helper ────────────────────────────────────────────────────
// Each entry is [attribute_threshold, bonus_granted_at_or_above_that_value].
// Cumulative: sum all entries where attr >= threshold.
type BP = [number, number][];

function bp(breakpoints: BP, val: number): number {
  let total = 0;
  for (const [threshold, bonus] of breakpoints) {
    if (val >= threshold) total += bonus;
  }
  return total;
}

// ─── Canonical Attribute → Skill Breakpoint Tables ────────────────────────
// Source: Terrablood Skill Chart (terrablood.com) — last updated 2004-03-02

// Strength → ATT and PAR (identical)
const ST_ATT: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const ST_PAR = ST_ATT;

// Wit → ATT, DEF (identical pattern), INI (+4 spike at 11!), RIP, DEC
const WT_ATT: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WT_DEF = WT_ATT;
const WT_INI: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 4],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WT_RIP: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WT_DEC: BP = [
  [5, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];

// Will → ATT, PAR (identical), DEF (stops at 21), DEC
const WL_ATT: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
const WL_PAR = WL_ATT;
const WL_DEF: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
]; // no 22-25 bonus
const WL_DEC: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];

// Speed → DEC, DEF, INI, RIP
const SP_DEC: BP = [
  [4, 1],
  [6, 1],
  [8, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [18, 1],
  [20, 1],
];
const SP_DEF: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
];
const SP_INI: BP = [
  [4, 1],
  [6, 1],
  [9, 1],
  [12, 1],
  [18, 1],
];
const SP_RIP: BP = [
  [4, 1],
  [6, 1],
  [7, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [21, 1],
];

// Deftness → ATT, DEF, INI, PAR, RIP
const DF_ATT: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];
const DF_DEF: BP = [
  [5, 1],
  [13, 1],
  [15, 1],
  [21, 1],
];
const DF_INI: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];
const DF_PAR: BP = [
  [5, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [17, 1],
];
const DF_RIP: BP = [
  [6, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [16, 1],
  [18, 1],
  [20, 1],
];

// ─── Size Modifier (lookup table, not breakpoints) ────────────────────────
// SZ affects INI (large = faster), PAR and DEF (large = harder to parry/dodge)
// Source: Terrablood Skill Chart SZ table
const SZ_INI_MOD: Record<number, number> = {
  3: -2,
  4: -2,
  5: -1,
  6: -1,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 1,
  16: 1,
  17: 2,
  18: 2,
  19: 2,
  20: 2,
  21: 4,
};
const SZ_PAR_MOD: Record<number, number> = {
  3: 2,
  4: 2,
  5: 1,
  6: 1,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: -1,
  16: -1,
  17: -2,
  18: -2,
  19: -2,
  20: -2,
  21: -4,
};
const SZ_DEF_MOD = SZ_PAR_MOD; // Identical

function szMod(table: Record<number, number>, sz: number): number {
  return table[Math.max(3, Math.min(21, sz))] ?? 0;
}

// ─── Style Penalty Table ──────────────────────────────────────────────────
// Flat adjustments applied to attribute-derived skill totals.
//
// Originally from Terrablood Skill Chart, but REBALANCED (2026-04) because
// the original values assumed a uniform 70-point attribute spread.  Our
// archetype-based stat generation creates wildly different breakpoint yields
// per archetype (agile archetypes hit the WT=11/SP=11 spikes, brutal ones
// don't), producing a 4:1 skill-budget gap.  These adjusted penalties
// compress the effective skill budget to a ~22-30 range while preserving
// each style's relative identity.
//
// Format: [ATT, PAR, DEF, INI, RIP, DEC]
const STYLE_PENALTIES: Record<FightingStyle, [number, number, number, number, number, number]> = {
  //                                           ATT  PAR  DEF  INI  RIP  DEC
  // ── Cunning archetype (WT/DF/WL → high raw skills, needs steep penalty) ──
  [FightingStyle.AimedBlow]: /*AB*/ [-15, -7, -11, -8, -6, +1], // deepened: -40 → -45 to bring 59.9% toward 50%
  [FightingStyle.ParryRiposte]: /*PR*/ [-12, -6, -13, -6, -1, -1], // lightened: -49 → -39 to lift 29.0% toward 40%
  [FightingStyle.ParryStrike]: /*PS*/ [-10, -5, -10, -7, -3, 0], // lightened: -44 → -35 to lift 29.7% toward 40%
  [FightingStyle.ParryLunge]: /*PL*/ [-9, -5, -11, -5, -5, 0], // lightened: -45 → -35 to lift 40.4% toward 50%

  // ── Agile archetype (SP/DF/WT → massive breakpoint yields, heaviest penalty) ──
  [FightingStyle.LungingAttack]: /*LU*/ [-6, -8, -9, -3, -3, 0], // lightened further: -40 → -29 to lift 38.3% toward 40%
  [FightingStyle.SlashingAttack]: /*SL*/ [-12, -14, -15, -4, -7, -2], // unchanged: 48.0% is near target

  // ── Brutal archetype (ST/CN/SZ → low breakpoint yields, lightest penalty) ──
  [FightingStyle.BashingAttack]: /*BA*/ [-8, -10, -14, -2, -4, 0], // deepened further: -29 → -38 to bring 62.5% toward 60%
  [FightingStyle.StrikingAttack]: /*ST*/ [-9, -7, -10, -3, -3, +1], // unchanged: 52.4% is within target

  // ── Tank archetype (CN/WL/SZ → endurance/HP, needs skill floor to compete) ──
  [FightingStyle.TotalParry]: /*TP*/ [-15, -1, -12, -6, -4, -2], // deepened further: -32 → -40 to bring 56.5% toward 60%
  [FightingStyle.WallOfSteel]: /*WS*/ [-8, -6, -13, -2, -4, -2], // deepened further: -26 → -35 to bring 59.9% toward 60%
};

// ─── Base Skill Computation ───────────────────────────────────────────────

/**
 * Compute base skills from attributes + fighting style.
 * Deterministic — no randomness.
 *
 * Uses canonical Terrablood breakpoint tables with per-attribute, per-skill
 * contribution values. SZ adjusts INI/PAR/DEF. Style penalty applied as flat
 * modifier. Result clamped to [1, 20].
 *
 * @param attrs - The warrior's base attributes
 * @param style - The warrior's fighting style
 * @returns A BaseSkills object containing ATT, PAR, DEF, INI, RIP, and DEC
 */
export function computeBaseSkills(attrs: Attributes, style: FightingStyle): BaseSkills {
  const { ST, SZ, WT, WL, SP, DF } = attrs;
  const pen = STYLE_PENALTIES[style];

  const ATT_raw = bp(ST_ATT, ST) + bp(WT_ATT, WT) + bp(WL_ATT, WL) + bp(DF_ATT, DF) + pen[0];
  const PAR_raw = bp(ST_PAR, ST) + szMod(SZ_PAR_MOD, SZ) + bp(WL_PAR, WL) + bp(DF_PAR, DF) + pen[1];
  const DEF_raw =
    szMod(SZ_DEF_MOD, SZ) +
    bp(WT_DEF, WT) +
    bp(WL_DEF, WL) +
    bp(SP_DEF, SP) +
    bp(DF_DEF, DF) +
    pen[2];
  const INI_raw = szMod(SZ_INI_MOD, SZ) + bp(WT_INI, WT) + bp(SP_INI, SP) + bp(DF_INI, DF) + pen[3];
  const RIP_raw = bp(WT_RIP, WT) + bp(SP_RIP, SP) + bp(DF_RIP, DF) + pen[4];
  const DEC_raw = bp(WT_DEC, WT) + bp(WL_DEC, WL) + bp(SP_DEC, SP) + pen[5];

  return {
    ATT: Math.max(1, Math.min(20, ATT_raw)),
    PAR: Math.max(1, Math.min(20, PAR_raw)),
    DEF: Math.max(1, Math.min(20, DEF_raw)),
    INI: Math.max(1, Math.min(20, INI_raw)),
    RIP: Math.max(1, Math.min(20, RIP_raw)),
    DEC: Math.max(1, Math.min(20, DEC_raw)),
  };
}

// ─── Luckfactor (Canonical ±4 per skill) ────────────────────────────────
// Canon: each of the 6 skill categories gets a hidden random ±4 "luckfactor" at
// creation, so two warriors with identical stats+style differ. The OVERVIEW shows
// luck-free skills (computeBaseSkills); combat applies the stored luckfactor.

/**
 * Roll a per-warrior luckfactor: a hidden ±4 modifier for each of the 6 skills.
 * Generated once at creation and stored on the warrior.
 *
 * @param rng - Seeded RNG service for deterministic generation.
 * @returns A BaseSkills object of deltas, each in [-4, +4].
 */
export function rollLuckfactor(rng: IRNGService): BaseSkills {
  const d = () => rng.roll(-4, 4); // roll is inclusive on both ends → -4..4
  return { ATT: d(), PAR: d(), DEF: d(), INI: d(), RIP: d(), DEC: d() };
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
export function computeEncumbrance(attrs: Attributes): number {
  return computeEncumbranceCapacity(attrs.ST, attrs.CN);
}

// Re-export chart labels for UI
export {
  getDamageRating,
  getHPRating,
  computeEncumbranceClass,
  computeEnduranceTier,
  ENDURANCE_LABELS,
  type DamageRating,
  type HPRating,
  type EnduranceTier,
  type EncumbranceClass,
} from '@/data/terrabloodCharts'; /**
 * Damage_labels.
 */

/**
 * Damage_labels.
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
  return {
    baseSkills: computeBaseSkills(attrs, style),
    derivedStats: computeDerivedStats(attrs),
  };
}
