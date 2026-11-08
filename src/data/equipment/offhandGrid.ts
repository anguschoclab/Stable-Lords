/**
 * Assur's Weapon Requirement Chart (Arena 93, Noblish Island) — off-hand
 * deftness grid. When a warrior wields a weapon in each hand, the required
 * deftness is read off this table: cross-reference the deftness requirement
 * of the MAIN-hand weapon (rows) against the deftness requirement of the
 * OFF-hand item (columns).
 *
 * Example from the article: Medium Shield (MH, DF req 5) + Large Shield
 * (OH, DF req 7) → 9 deftness to use them together.
 *
 * Off-hand items otherwise relax requirements: no WT requirement, no SZ
 * requirement, same ST requirement as the main hand.
 */
export const OFFHAND_DF_REQS = [3, 5, 7, 9, 11, 15] as const;

const GRID_ROWS: number[][] = [
  // OH: 3   5   7   9  11  15
  [4, 6, 8, 10, 12, 16], // MH 3
  [5, 7, 9, 11, 13, 17], // MH 5
  [6, 8, 10, 12, 14, 18], // MH 7
  [7, 9, 11, 13, 15, 19], // MH 9
  [8, 10, 12, 14, 16, 20], // MH 11
  [10, 12, 14, 16, 18, 22], // MH 15
];

/**
 * Required deftness to wield `mhDfReq`-requirement main hand together with
 * `ohDfReq`-requirement off hand. Requirements not on the chart snap to the
 * next higher column/row (canon table is quantized at 3/5/7/9/11/15).
 */
export function offhandDualDfReq(mhDfReq: number, ohDfReq: number): number {
  const snap = (v: number) => OFFHAND_DF_REQS.find((r) => v <= r) ?? 15;
  const row = OFFHAND_DF_REQS.indexOf(snap(mhDfReq) as never);
  const col = OFFHAND_DF_REQS.indexOf(snap(ohDfReq) as never);
  return GRID_ROWS[row]?.[col] ?? 22;
}
