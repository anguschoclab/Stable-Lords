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
// Canon: PAR diverges from ATT at 22+ — chart shows +0 for ST→PAR at 22-25.
export const ST_PAR: BP = [
  [5, 1],
  [7, 1],
  [15, 1],
  [17, 1],
  [21, 2],
];

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
// Canon: WL contributes to INI only at the extreme tail (22-25).
export const WL_INI: BP = [
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];

// Speed → DEC, DEF, INI, RIP
// Canon: DEC gains at every even value 4-20, plus the 22-25 odd tail.
export const SP_DEC: BP = [
  [4, 1],
  [6, 1],
  [8, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [16, 1],
  [18, 1],
  [20, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
// Canon: DEF gains at odd values only (5,7,15,17,21×2, 22-25).
export const SP_DEF: BP = [
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
// Canon: INI gains at odd 9/15/21×2(+22-25) and even 6/12/18 — nothing below 6.
export const SP_INI: BP = [
  [6, 1],
  [9, 1],
  [12, 1],
  [15, 1],
  [18, 1],
  [21, 2],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
];
// Canon: RIP gains at odd values 5-17 (+2 at 11 and 21, +1 each 22-25).
export const SP_RIP: BP = [
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
// Canon: DF→DEF follows the same odd-value pattern as DF→ATT/DF→PAR.
export const DF_DEF = DF_ATT;
export const DF_INI: BP = [
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
// Canon: DF→PAR follows the ATT/DEF pattern (yields 8 at DF17).
export const DF_PAR = DF_ATT;
// Canon: DF→RIP gains at every even value 4-20, plus the 22-25 tail.
export const DF_RIP: BP = [
  [4, 1],
  [6, 1],
  [8, 1],
  [10, 1],
  [12, 1],
  [14, 1],
  [16, 1],
  [18, 1],
  [20, 1],
  [22, 1],
  [23, 1],
  [24, 1],
  [25, 1],
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
  [FightingStyle.AimedBlow]: /*AB*/ [-21, -8, -11, -9, -6, +1], // V22: canon AB doubles DF→ATT (+7 at DF15); global +DEF/+PAR buff left AB at 60.1% despite ATT -19 — deepened ATT -19→-23 to pull AB→WS under 80
  [FightingStyle.ParryRiposte]: /*PR*/ [-12, -5, -13, -6, -1, -1], // re-ratchet: PAR -6→-5 (-39→-38) to offset low-KD riposte gate + SL edge (39.6% → 44.0% flat); V23: a -6 test nudge blew the SL→PR/WS→PR cells past 80% — reverted
  [FightingStyle.ParryStrike]: /*PS*/ [-9, -7, -12, -5, -7, 0], // V22: PAR -5→-7, DEF -10→-12, RIP -3→-7 — canon DF tables pushed fixture defense past SL's attrition window; PS keeps parry identity over riposte; ATT -10→-9 for TP→PS cell
  [FightingStyle.ParryLunge]: /*PL*/ [-9, -5, -11, -5, -5, 0], // lightened: -45 → -35 to lift 40.4% toward 50%

  // ── Agile archetype (SP/DF/WT → massive breakpoint yields, heaviest penalty) ──
  [FightingStyle.LungingAttack]: /*LU*/ [-6, -8, -11, -3, -3, 0], // V22: global +DEF buff inflated LU's wall-vs-ram cell (aged LU beat prime BA 60%); deepened DEF -9→-11
  [FightingStyle.SlashingAttack]: /*SL*/ [-7, -10, -11, -2, -7, -2], // V22: ATT -10→-7, PAR -14→-10, DEF -15→-11, INI -4→-2 — canon-chart DEF/PAR inflation left SL at 17.5% vs PS (bleed needs swings → tempo); prior lighten -12→-10 for bottom-of-surface

  // ── Brutal archetype (ST/CN/SZ → low breakpoint yields, lightest penalty) ──
  [FightingStyle.BashingAttack]: /*BA*/ [-8, -11, -14, -2, -5, 0], // re-ratchet: deepened ATT -8→-9, PAR -10→-11, DEF -14→-15→-14 for ST→BA cell; BA was 64.8% pre-existing
  [FightingStyle.StrikingAttack]: /*ST*/ [-10, -9, -12, -7, -4, +1], // V22: canon DEF/PAR yields + DEC_INI lean (strikers carry high DEC) — ATT -12→-10 back after dodge-riposte gave high-AL defenders a counter channel (ST sank to 46.8)

  // ── Tank archetype (CN/WL/SZ → endurance/HP, needs skill floor to compete) ──
  [FightingStyle.TotalParry]: /*TP*/ [-15, -2, -15, -6, -4, -2], // V22: global +5 DEF/+2 PAR canon tables buffed the wall most (59.1%); deepened PAR -1→-2, DEF -12→-15 for the TP→PS cell; V23: a -3/-16 test deepen blew the WS→TP cell to 88% — reverted; snap dominance is emergent (drill flywheel), not fixture-mechanical
  [FightingStyle.WallOfSteel]: /*WS*/ [-6, -5, -10, 0, -3, -2], // re-ratchet: DEF -13→-10, INI -2→+1; ATT -8→-7 + PAR -6→-5 + RIP -4→-3 for the AB→WS cell after ATT_CRIT_COEFF buffed aimed blows
};

// ─── Style Skill Floors ───────────────────────────────────────────────────
// The lowest value each base skill can take for a style, whatever the
// attributes: what the style's training drills in regardless of raw talent.
//
// Why this exists: STYLE_PENALTIES are calibrated on the 105-point balance
// fixture, where attribute breakpoints yield 14–18 raw points per skill. Real
// warriors are 70–90 points, so their raw sums sit BELOW most penalties and a
// uniform floor of 1 erased every difference between styles — and left
// penalty changes with no effect on the deployed population. A per-style
// floor is the lever that acts on real warriors and leaves the fixture (whose
// skills are far above any floor) untouched.
//
// Keep floors on a style's SIGNATURE skills only, and below the value the
// fixture produces for that skill — a floor the fixture reaches stops being
// population-only and must be re-ratcheted like a penalty.
//
// Format: [ATT, PAR, DEF, INI, RIP, DEC]
export const STYLE_SKILL_FLOORS: Record<
  FightingStyle,
  [number, number, number, number, number, number]
> = {
  [FightingStyle.AimedBlow]: /*AB*/ [1, 1, 1, 1, 1, 1],
  [FightingStyle.ParryRiposte]: /*PR*/ [1, 1, 1, 1, 1, 1],
  [FightingStyle.ParryStrike]: /*PS*/ [1, 1, 1, 1, 1, 1],
  [FightingStyle.ParryLunge]: /*PL*/ [1, 1, 1, 1, 1, 1],
  // Lunging: the first-strike is drilled tempo — attack speed and accuracy come
  // from the drill, not from raw speed. Lifts world-only weakness (42.0%).
  [FightingStyle.LungingAttack]: /*LU*/ [10, 1, 1, 10, 1, 1],
  // Slashing: the flurry's initiative is drilled. Leaves the fixture (INI 13)
  // untouched; lifts world-only weakness (43.6%).
  // V23 snap lift: side-gated disarms + freed parries clipped bleed tempo —
  // floor ATT 1→9, PAR 1→3, DEF 1→7 on top of the drilled INI.
  [FightingStyle.SlashingAttack]: /*SL*/ [9, 3, 7, 11, 1, 1],
  // Brutal: the style is built on getting the blow in first and landing it.
  // V23 snap lift: parry-freedom post-V23 left world bashers exposed —
  // floor ATT 6→14, PAR 1→4, DEF 1→8 (fixture stays above, untouched).
  [FightingStyle.BashingAttack]: /*BA*/ [14, 4, 8, 9, 1, 1],
  [FightingStyle.StrikingAttack]: /*ST*/ [6, 1, 1, 9, 1, 1],
  [FightingStyle.TotalParry]: /*TP*/ [1, 1, 1, 1, 1, 1],
  // Wall of Steel: the whirling arc is attack, guard and tempo at once — it
  // comes from the drill, not from wit or deftness.
  [FightingStyle.WallOfSteel]: /*WS*/ [11, 3, 1, 16, 1, 1],
};

// ─── Canon Reference Tables (V22) ─────────────────────────────────────────
// The original Terrablood STYLE MODIFICATIONS chart, preserved as canon data
// for reference/spec comparison — the live tuned values stay in
// STYLE_PENALTIES above. Format: [ATT, PAR, DEF, INI, RIP, DEC].
export const CANON_STYLE_PENALTIES: Record<
  FightingStyle,
  [number, number, number, number, number, number]
> = {
  [FightingStyle.AimedBlow]: [-17, -8, -12, -9, -7, 1],
  [FightingStyle.BashingAttack]: [-8, -8, -13, -3, -4, 1],
  [FightingStyle.LungingAttack]: [-6, -8, -10, -2, -4, 0],
  [FightingStyle.ParryLunge]: [-8, -6, -12, -4, -4, -1],
  [FightingStyle.ParryRiposte]: [-12, -6, -14, -5, 0, -1],
  [FightingStyle.ParryStrike]: [-12, -6, -12, -7, -4, -1],
  [FightingStyle.SlashingAttack]: [-8, -10, -12, 0, -4, 0],
  [FightingStyle.StrikingAttack]: [-12, -9, -12, -5, -4, 1],
  [FightingStyle.TotalParry]: [-14, -2, -12, -7, -4, -2],
  [FightingStyle.WallOfSteel]: [-8, -4, -12, -1, -4, -1],
};

// Canon wit-statement floors (Noblish Island HIGH WIT STATEMENTS chart):
// at WT 15+ a statement only appears when the skill reaches this base value.
export const STATEMENT_MIN_SKILLS = {
  INI: 10,
  RIP: 10,
  ATT: 7,
  PAR: 6,
  DEF: 3,
  DEC: 9,
} as const;
