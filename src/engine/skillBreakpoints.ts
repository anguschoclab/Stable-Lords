/**
 * Skill Breakpoint Tables & Style Penalties — data only.
 * Extracted from skillCalc.ts for SRP separation of data from computation.
 *
 * Source: Terrablood Skill Chart (terrablood.com) — last updated 2004-03-02
 */
import { FightingStyle } from '@/types/shared.types';
import { clamp } from '@/utils/math';

// ─── Breakpoint Helper ────────────────────────────────────────────────────
// Each entry is [attribute_threshold, bonus_granted_at_or_above_that_value].
// Cumulative: sum all entries where attr >= threshold.
/**
 *
 */
export type BP = [number, number][];

/**
 *
 */
export function bp(breakpoints: BP, val: number): number {
  let total = 0;
  for (const [threshold, bonus] of breakpoints) {
    if (val >= threshold) total += bonus;
  }
  return total;
}

// ─── Canonical Attribute → Skill Breakpoint Tables ────────────────────────

// Strength → ATT and PAR (identical)
export const ST_ATT: BP = [
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
export const ST_PAR = ST_ATT;

// Wit → ATT, DEF (identical pattern), INI (+4 spike at 11!), RIP, DEC
export const WT_ATT: BP = [
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
export const WT_DEF = WT_ATT;
export const WT_INI: BP = [
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
export const WT_RIP: BP = [
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
export const WT_DEC: BP = [
  [5, 1],
  [17, 1],
  [21, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];

// Will → ATT, PAR (identical), DEF (stops at 21), DEC
export const WL_ATT: BP = [
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
export const WL_PAR = WL_ATT;
export const WL_DEF: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
]; // no 22-25 bonus
export const WL_DEC: BP = [
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
export const SP_DEC: BP = [
  [4, 1],
  [6, 1],
  [8, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [18, 1],
  [20, 1],
];
export const SP_DEF: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
];
export const SP_INI: BP = [
  [4, 1],
  [6, 1],
  [9, 1],
  [12, 1],
  [18, 1],
];
export const SP_RIP: BP = [
  [4, 1],
  [6, 1],
  [7, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [21, 1],
];

// Deftness → ATT, DEF, INI, PAR, RIP
export const DF_ATT: BP = [
  [5, 1],
  [7, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];
export const DF_DEF: BP = [
  [5, 1],
  [13, 1],
  [15, 1],
  [21, 1],
];
export const DF_INI: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];
export const DF_PAR: BP = [
  [5, 1],
  [9, 1],
  [11, 2],
  [13, 1],
  [17, 1],
];
export const DF_RIP: BP = [
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
export const SZ_INI_MOD: Record<number, number> = {
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
export const SZ_PAR_MOD: Record<number, number> = {
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
export const SZ_DEF_MOD = SZ_PAR_MOD; // Identical

/**
 *
 */
export function szMod(table: Record<number, number>, sz: number): number {
  return table[clamp(sz, 3, 21)] ?? 0;
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
export const STYLE_PENALTIES: Record<
  FightingStyle,
  [number, number, number, number, number, number]
> = {
  //                                           ATT  PAR  DEF  INI  RIP  DEC
  // ── Cunning archetype (WT/DF/WL → high raw skills, needs steep penalty) ──
  [FightingStyle.AimedBlow]: /*AB*/ [-15, -7, -11, -7, -6, +1], // re-ratchet: lightened INI -8→-7 to lift 39.9% into 40%+ band
  [FightingStyle.ParryRiposte]: /*PR*/ [-12, -6, -13, -6, -1, -1], // lightened: -49 → -39 to lift 29.0% toward 40%
  [FightingStyle.ParryStrike]: /*PS*/ [-10, -5, -10, -5, -3, 0], // re-ratchet: lightened INI -7→-5 to offset encumbrance INI penalty from equipment changes
  [FightingStyle.ParryLunge]: /*PL*/ [-9, -5, -11, -5, -5, 0], // lightened: -45 → -35 to lift 40.4% toward 50%

  // ── Agile archetype (SP/DF/WT → massive breakpoint yields, heaviest penalty) ──
  [FightingStyle.LungingAttack]: /*LU*/ [-6, -8, -9, -3, -3, 0], // lightened further: -40 → -29 to lift 38.3% toward 40%
  [FightingStyle.SlashingAttack]: /*SL*/ [-12, -14, -15, -4, -7, -2], // unchanged: 48.0% is near target

  // ── Brutal archetype (ST/CN/SZ → low breakpoint yields, lightest penalty) ──
  [FightingStyle.BashingAttack]: /*BA*/ [-9, -11, -15, -2, -5, 0], // re-ratchet: deepened ATT -8→-9, PAR -10→-11, DEF -14→-15, RIP -4→-5; BA was 64.8% pre-existing, now 61.6%
  [FightingStyle.StrikingAttack]: /*ST*/ [-9, -7, -10, -3, -3, +1], // unchanged: 52.4% is within target

  // ── Tank archetype (CN/WL/SZ → endurance/HP, needs skill floor to compete) ──
  [FightingStyle.TotalParry]: /*TP*/ [-15, -1, -12, -6, -4, -2], // deepened further: -32 → -40 to bring 56.5% toward 60%
  [FightingStyle.WallOfSteel]: /*WS*/ [-8, -6, -10, 0, -4, -2], // re-ratchet: lightened DEF -13→-10, INI -2→0 to offset encumbrance penalties from equipment changes
};
