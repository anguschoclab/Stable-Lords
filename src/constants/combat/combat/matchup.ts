import { FightingStyle } from '@/types/shared.types';
/**
 * Tolerance for matrix antisymmetry check
 * Pairs with |M[i][j] + M[j][i]| > tolerance leak absolute power into matchup layer
 */
export const MATRIX_ANTISYMMETRY_TOLERANCE = 1;

// ─── Style Matchup Matrix ──────────────────────────────────────────────────

/**
 * Style order for matrix indexing
 */
export const STYLE_ORDER = [
  FightingStyle.AimedBlow,
  FightingStyle.BashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.ParryLunge,
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];

/**
 * Canonical Style Advantage Matrix.
 * Values are flat skill bonuses (positive = advantage).
 *
 * Antisymmetric by construction — absolute power lives in STYLE_PENALTIES (skillCalc.ts).
 * Guarded by findAntisymmetryViolations.
 *
 * Tuned 2026-04 across two passes:
 *
 * Pass 1 (style W%): nerfed WS (+5→+1), buffed AB (+2→+4), softened PR (-4→-1).
 * Pass 2 (per-matchup W%, 4400-bout sample): BA emerged as new outlier at
 * 70.3%, AB still bottom at 26.5%. Per-matchup data showed:
 *  - BA dominated nearly all matchups (79-80% vs ST/TP/PS/PR)
 *  - AB lost 75-85% of fights vs BA/PS/PR despite matrix advantages, implying
 *    style-passive headwind (matrix can't fully compensate)
 *  - Symmetric mirror diagonal stays balanced; major asymmetry concentrated
 *    in BA's aggressive defaults
 *
 * Pass 2 changes:
 *  - BA: row sum +4 → +1 (dropped +1 vs PR/SL/ST). Matches the broad
 *    overperformance pattern across BA's most-played matchups.
 *  - AB: added +1 vs BA, +1 vs PR, +1 vs PS to counter the passive headwind.
 *    Row sum +4 → +7 (most aggressive in the matrix; accepted because passives
 *    drag AB down ~20pp from its raw matrix expectation).
 *  - PS: added +1 vs AB tempered to 0 (was already 0); kept other entries.
 *  - ST: added +1 vs WS to address ST's persistent low W% from passives.
 *  - TP: removed -1 vs AB to dampen the AB-eats-TP swing without flipping.
 *  - PL/PR/PS: minor symmetric softening to lift the bottom of the spread.
 *
 * Pass 3 (antisymmetrization): Extracted pure matchup component by setting
 * M'[i][j] = round((M[i][j] - M[j][i]) / 2). Absolute-power bias moved to
 * STYLE_PENALTIES. Matrix now pure rock-paper-scissors.
 *
 * Target: aggregate W% spread ≤ 20pp; per-matchup spread ≤ 30pp on samples ≥50.
 */
export const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [0, 1, 2, 1, 1, 1, 2, 2, 1, 3], // AB
  [-1, 0, 0, -1, -1, 0, -1, -1, -1, 0], // BA
  [-2, 0, 0, 0, 0, -1, -1, -1, 0, 0], // LU
  [-1, 1, 0, 0, 1, 1, 0, 0, 1, 1], // PL
  [-1, 1, 0, 0, 0, 0, 0, 1, 1, 1], // PR
  [-1, 0, 1, -1, 0, 0, 0, 2, 0, 2], // PS
  [-2, 1, 1, 0, 0, 0, 0, -1, 0, 1], // SL
  [-2, 1, 1, 0, -1, -2, 1, 0, 1, 2], // ST
  [-1, 1, 0, -1, 0, 0, 0, -1, 0, 0], // TP
  [-3, 1, 0, -1, 0, -1, -1, -1, 0, 0], // WS
];

// Style → matrix row/col index, built once at module init. The pairwise
// scoring hot loop calls getMatchupBonus millions of times per soak —
// STYLE_ORDER.indexOf there showed up as a real CPU line.
const STYLE_INDEX: ReadonlyMap<FightingStyle, number> = new Map(
  STYLE_ORDER.map((style, i) => [style, i])
);

/**
 * Get matchup bonus from the matrix
 * @param attStyle - Attacker style
 * @param defStyle - Defender style
 * @returns The matchup bonus value
 */
export function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_INDEX.get(attStyle) ?? -1;
  const di = STYLE_INDEX.get(defStyle) ?? -1;
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai]?.[di] ?? 0;
}

/**
 * Returns the matchup-matrix cells that violate near-antisymmetry, i.e. pairs
 * where M[i][j] + M[j][i] falls outside [-tolerance, +tolerance]. A pure
 * matchup matrix is antisymmetric (if A beats B by +x, B is -x vs A); a
 * nonzero pair-sum means absolute-power bias is smuggled into the matrix and
 * belongs in STYLE_PENALTIES instead.
 */
export function findAntisymmetryViolations(tolerance = MATRIX_ANTISYMMETRY_TOLERANCE): string[] {
  const out: string[] = [];
  for (let i = 0; i < STYLE_ORDER.length; i++) {
    for (let j = i + 1; j < STYLE_ORDER.length; j++) {
      const sum = (MATCHUP_MATRIX[i]?.[j] ?? 0) + (MATCHUP_MATRIX[j]?.[i] ?? 0);
      if (Math.abs(sum) > tolerance) {
        out.push(`${STYLE_ORDER[i]} vs ${STYLE_ORDER[j]}: sum=${sum}`);
      }
    }
  }
  return out;
}
