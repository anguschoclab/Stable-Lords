import { clamp } from '@/utils/math';
/**
 * Stable Lords — Canonical Terrablood Charts
 * HP, Endurance, Damage, Encumbrance lookup tables from Terrablood's Duel II archives.
 *
 * Sources:
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/hit-point-chart/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-endurance-chart/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-damage-chart/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/encumbrance-chart/
 */

// ─── Hit Points ─────────────────────────────────────────────────────────────
// Formula: HP = CN*2 + SZmod + WLmod  (100% accuracy per Ben Weinstein, n=3650)

const SZ_MOD: Record<number, number> = {
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 5,
  12: 5,
  13: 6,
  14: 6,
  15: 7,
  16: 7,
  17: 8,
  18: 8,
  19: 9,
  20: 9,
  21: 10,
};

// Canon HP statement bands (same chart page):
//   Very frail 6-21 · Cannot take a lot 22-26 · Average 27-35
//   A lot 36-40 · Tremendous 41-53 · Seemingly unaffected 54+
const HP_RATING_BANDS: [number, string][] = [
  [21, 'Very frail'],
  [26, 'Cannot take a lot'],
  [35, 'Average'],
  [40, 'A lot'],
  [53, 'Tremendous'],
  [Infinity, 'Seemingly unaffected'],
];

/**
 * Canon punishment-capacity statement for a computed HP total.
 */
export function hpRating(hp: number): string {
  for (const [max, label] of HP_RATING_BANDS) {
    if (hp <= max) return label;
  }
  return 'Seemingly unaffected';
}

const WL_MOD_HP: Record<number, number> = {
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 2,
  12: 2,
  13: 2,
  14: 2,
  15: 3,
  16: 3,
  17: 4,
  18: 4,
  19: 5,
  20: 5,
  21: 6,
  22: 7,
  23: 8,
  24: 9,
  25: 10,
};

/**
 * Compute hp.
 */
export function computeHP(cn: number, sz: number, wl: number): number {
  const szMod = SZ_MOD[clamp(sz, 3, 21)] ?? 0;
  const wlMod = WL_MOD_HP[clamp(wl, 3, 25)] ?? 0;
  return cn * 2 + szMod + wlMod;
}

// ─── Damage ─────────────────────────────────────────────────────────────────
// Lookup by ST(3-25) × SZ(3-21). Mode values encoded.
// L=Little(1), N=Normal(2), G=Good(3), R=Great(4), T=Tremendous(5), A=Awesome(6), D=Devastating(7), S=Superhuman(8), U=Unearthly(9)

// Encoded as mode damage class (1-9) indexed by [ST-3][SZ-3], clamped
// Simplified from the full chart — mode values only (ignoring ± variance)
const DMG_TABLE: number[][] = [
  // SZ: 3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21
  /*ST3*/ [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
  /*ST4*/ [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
  /*ST5*/ [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  /*ST6*/ [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  /*ST7*/ [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  /*ST8*/ [1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5],
  /*ST9*/ [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5],
  /*ST10*/ [1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5],
  /*ST11*/ [1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5],
  /*ST12*/ [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5],
  /*ST13*/ [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  /*ST14*/ [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 6],
  /*ST15*/ [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
  /*ST16*/ [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6],
  /*ST17*/ [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6],
  /*ST18*/ [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6],
  /*ST19*/ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
  /*ST20*/ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6],
  /*ST21*/ [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7],
  /*ST22*/ [4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 8],
  /*ST23*/ [4, 4, 4, 4, 6, 5, 5, 5, 5, 5, 6, 6, 7, 7, 7, 7, 7, 9, 9],
  /*ST24*/ [4, 4, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 9],
  /*ST25*/ [5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9],
];

/**
 * Compute damage class.
 */
export function computeDamageClass(st: number, sz: number): number {
  const stIdx = clamp(st - 3, 0, 22);
  const szIdx = clamp(sz - 3, 0, 18);
  return DMG_TABLE[stIdx]?.[szIdx] ?? 2;
}

// ─── Encumbrance ────────────────────────────────────────────────────────────
// Lookup by ST(3-25) × CN(3-25). Returns class A-F.
// A=very little(~9), B=cannot carry a lot(~18), C=normal(~27), D=good(~36), E=tremendous(~45), F=limitless(~54)

/**
 * Encumbrance class type.
 */
type EncumbranceClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// Each class ≈ 6 weight points of gear capacity
// Canonical: average warrior (ST12/CN12) = class C = 18 points
// Max loadout weight: 2H(8) + Plate(14) + FullHelm(4) = 26 → only class E(30)/F(36) can carry it
/**
 * Encumbrance_capacity.
 */
const ENCUMBRANCE_CAPACITY: Record<EncumbranceClass, number> = {
  A: 6,
  B: 12,
  C: 18,
  D: 24,
  E: 30,
  F: 36,
};

/**
 * Encumbrance_labels.
 */
export const ENCUMBRANCE_LABELS: Record<EncumbranceClass, string> = {
  A: 'Very Little Weight',
  B: 'Cannot Carry a Lot',
  C: 'Normal',
  D: 'Good Amount',
  E: 'Tremendous Amount',
  F: 'Limitless',
};

// Encoded from the canonical chart: row=ST(3-25), col=CN(3-25), value=class index (0=A..5=F)
const ENC_TABLE: number[][] = [
  //CN:3 4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
  /*ST3*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST4*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST5*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST6*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST7*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST8*/ [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  /*ST9*/ [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  /*ST10*/ [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  /*ST11*/ [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  /*ST12*/ [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  /*ST13*/ [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  /*ST14*/ [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  /*ST15*/ [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  /*ST16*/ [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST17*/ [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST18*/ [1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST19*/ [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  /*ST20*/ [2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
  /*ST21*/ [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST22*/ [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST23*/ [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST24*/ [2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  /*ST25*/ [3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
];

const ENC_CLASSES: EncumbranceClass[] = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Compute encumbrance class.
 */
export function computeEncumbranceClass(st: number, cn: number): EncumbranceClass {
  const stIdx = clamp(st - 3, 0, 22);
  const cnIdx = clamp(cn - 3, 0, 22);
  const classIdx = ENC_TABLE[stIdx]?.[cnIdx] ?? 2;
  return ENC_CLASSES[classIdx] ?? 'C';
}

/**
 * Compute encumbrance capacity.
 */
export function computeEncumbranceCapacity(st: number, cn: number): number {
  return ENCUMBRANCE_CAPACITY[computeEncumbranceClass(st, cn)];
}

// ─── Endurance ──────────────────────────────────────────────────────────────
// Lookup by (ST+CN) vs WL. Returns tier letter.
// L=Very Little, P=Poor, N=Normal, G=Good, R=Great, T=Tremendous, A=Awesome, U=Limitless

/**
 * Endurance tier type.
 */
type EnduranceTier = 'L' | 'P' | 'N' | 'G' | 'R' | 'T' | 'A' | 'U';

// Numerical endurance value per tier (for combat calculations)
const ENDURANCE_VALUES: Record<EnduranceTier, number> = {
  L: 12,
  P: 18,
  N: 25,
  G: 33,
  R: 42,
  T: 52,
  A: 65,
  U: 80,
};

// Canonical (ST+CN) × WL lookup — Terrablood warrior endurance chart
// (postulated version, updated 2024-05-19). Rows: ST+CN 6-50; each row is a
// 23-char string indexed by WL-3 (WL 3-25). '0' = no data: falls back to the
// nearest defined tier left in the row, then up the column.
const ENDURANCE_TABLE: Record<number, string> = {
  6: 'LLLLLLLLLLLLLLLLLLL0000',
  7: 'LLLLLLLLLLLLLLLLLLL0000',
  8: 'LLLLLLLLLLLLLLLL0000000',
  9: 'LLLLLLLLLLLLLLLL0P00000',
  10: 'LLLLLLLLLLLLLLPPPPP0000',
  11: 'LLLLLLLLLLLLLLPPPPP0000',
  12: 'LLLLLLLLLLLLPPPPPPP0000',
  13: 'LLLLLLLLLLPPPPPPPPP0000',
  14: 'LLLLLLLPPPPPPPPPPPN0000',
  15: 'LLLLLLLPPPPPPPPPPNN0000',
  16: 'LLLLLLPPPPPPPPPPPNN0000',
  17: 'LLLLLLPPPPPPPPPNNNN0000',
  18: 'LLLLLLPPPPPPPPNNNNN0000',
  19: 'LLLLLLPPPPPPPPNNNNNGGGG',
  20: 'LLLLLLPPPPPPNNNNNNGG000',
  21: 'LLLLLPPPPPPPNNNNNNGNN00',
  22: 'LLLLLPPPPPPNNNNNGGGGRR0',
  23: 'LLLLLPPPPPNNNNNGGGGGRRT',
  24: 'LLLLLPPPPPNNNNNGGGGRRRT',
  25: 'LLLLLPPPPNNNNGGGGGGRRRT',
  26: 'LLLLPPPPPNNNNGGGGGRRRRT',
  27: 'LLLLPPPPPNNNNGGGGGRRRRT',
  28: 'LLLLPPPPPNNNGGGGRRRRRRT',
  29: 'LLPPPPPPNNNNGGGRRRRRRRT',
  30: 'LLPPPPPPNNNNGGGRRRRRRRT',
  31: 'LLLPPPPPNNGGGGGRRRRRRRT',
  32: 'LLLPPNNNNGGGGGRRRRRTTTA',
  33: 'LLLPPNNNNGGGGGRRRRTTAAA',
  34: 'LLLPPNNNNGGGGGRRRRTTAAA',
  35: 'LLLPPNNNNGGGRRRRRRTTAAA',
  36: 'LLLPPNNGGGGRRRRTTTTAAAA',
  37: 'LLPNNNNGGGGRRRRTTTTAAAA',
  38: 'LL0NNNN0000RRRTTTTAAAAA',
  39: 'LL0NNN00000RRRTTTTAAAAA',
  40: 'LL00N000000RRTTT0AAAAAA',
  41: 'LL00000000000TT00AAAAAA',
  42: 'LL00000000000TT000AAAAA',
  43: '000000000000000000AAAAA',
  44: '000000000000000000AAAAA',
  45: '000000000000000000AAAAA',
  46: '000000000000000000AAAAA',
  47: '000000000000000000AAAAA',
  48: '000000000000000000AAAAA',
  49: '000000000000000000AAAAA',
  50: '000000000000000000AAAAA',
};

const END_TIER_CHARS = new Set(['L', 'P', 'N', 'G', 'R', 'T', 'A', 'U']);

/**
 * Compute endurance tier from canonical chart.
 * Canon is a measured (ST+CN) × WL lookup — not a formula. No-data ('0')
 * cells fall back to the nearest defined tier left in the row, then up the
 * column. The chart tops out at 'A' (Awesome); 'U' remains for future data.
 */
export function computeEnduranceTier(st: number, cn: number, wl: number): EnduranceTier {
  const row = clamp(st + cn, 6, 50);
  const col = clamp(wl - 3, 0, 22);
  const line = ENDURANCE_TABLE[row] ?? ENDURANCE_TABLE[50] ?? '';
  const direct = line[col];
  if (direct && END_TIER_CHARS.has(direct)) return direct as EnduranceTier;
  // Fallback: nearest defined tier left in the row …
  for (let c = col - 1; c >= 0; c--) {
    const t = line[c];
    if (t && END_TIER_CHARS.has(t)) return t as EnduranceTier;
  }
  // … else nearest defined tier up the column.
  for (let r = row - 1; r >= 6; r--) {
    const t = ENDURANCE_TABLE[r]?.[col];
    if (t && END_TIER_CHARS.has(t)) return t as EnduranceTier;
  }
  return 'L';
}

/**
 * Compute endurance value.
 */
export function computeEnduranceValue(st: number, cn: number, wl: number): number {
  return ENDURANCE_VALUES[computeEnduranceTier(st, cn, wl)];
}

// ─── Activity Ratings ───────────────────────────────────────────────────────
// Based on INI base + RIP base (old style chart from Terrablood)
// https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-activity-ratings/

/**
 * Activity rating type.
 */
type ActivityRating =
  | 'Very Slow & Inactive'
  | 'Very Slow'
  | 'Very Inactive'
  | 'Relatively Slow & Inactive'
  | 'Relatively Slow'
  | 'Relatively Inactive'
  | 'Normal'
  | 'Quick & Active'
  | 'Quick'
  | 'Active'
  | 'Very Quick & Active'
  | 'Very Quick'
  | 'Very Active'
  | 'Incredibly Quick & Active'
  | 'Incredibly Quick'
  | 'Extremely Active'
  | 'Sensationally Quick & Active'
  | 'Sensationally Quick'
  | 'Sensationally Active';

/**
 * Compute activity rating.
 */
export function computeActivityRating(iniBase: number, ripBase: number): ActivityRating {
  const total = iniBase + ripBase;

  if (total >= 30) {
    if (iniBase >= ripBase + 5) return 'Sensationally Quick';
    if (ripBase >= iniBase + 5) return 'Sensationally Active';
    return 'Sensationally Quick & Active';
  }
  if (total >= 24) {
    if (iniBase >= ripBase + 5) return 'Incredibly Quick';
    if (ripBase >= iniBase + 5) return 'Extremely Active';
    return 'Incredibly Quick & Active';
  }
  if (total >= 20) {
    if (iniBase >= ripBase + 5) return 'Very Quick';
    if (ripBase >= iniBase + 5) return 'Very Active';
    return 'Very Quick & Active';
  }
  if (total >= 16) {
    if (iniBase >= ripBase + 5) return 'Quick';
    if (ripBase >= iniBase + 5) return 'Active';
    return 'Quick & Active';
  }
  if (total >= 12) return 'Normal';
  if (total >= 8) {
    if (iniBase >= ripBase + 3) return 'Relatively Slow';
    if (ripBase >= iniBase + 3) return 'Relatively Inactive';
    return 'Relatively Slow & Inactive';
  }
  if (iniBase >= ripBase + 3) return 'Very Slow';
  if (ripBase >= iniBase + 3) return 'Very Inactive';
  return 'Very Slow & Inactive';
}

// ─── Coordination ───────────────────────────────────────────────────────────
// https://terrablood.com/duel-ii-formerly-known-as-duelmasters/coordination-statements/

/**
 * Coordination rating type.
 */
export type CoordinationRating =
  | 'Clumsy'
  | 'Slightly Uncoordinated'
  | 'Normal'
  | 'Highly Coordinated'
  | 'Very Highly Coordinated'
  | 'Marvel of Fighting Coordination';

/**
 * Compute coordination.
 */
export function computeCoordination(sp: number, df: number): CoordinationRating {
  const total = sp + df;
  if (total >= 40) return 'Marvel of Fighting Coordination';
  if (total >= 32) return 'Very Highly Coordinated';
  if (total >= 28) return 'Highly Coordinated';
  if (total >= 21) return 'Normal';
  // Canon (SJJ): 6–16 is Clumsy, 17–20 is Slightly Uncoordinated —
  // V22's `>= 16` boundary let a canon-Clumsy 16 pass as Slightly.
  if (total >= 17) return 'Slightly Uncoordinated';
  return 'Clumsy';
}
