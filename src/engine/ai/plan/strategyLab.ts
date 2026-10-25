/**
 * Strategy Lab — NPC experimentation over plan space.
 *
 * A real manager doesn't know the optimal OE/AL for a warrior; they try
 * things, watch results, and converge. This module gives AI stables the same
 * loop: a per-warrior ledger buckets every plan they run into the canon
 * Jorja rhythm bands (VL/L/M/H/VH), `recordPlanOutcome` scores each cell by
 * bout results, and `pickStrategyTarget` does a seeded ε-greedy choice —
 * mostly exploit the best-performing cell, sometimes probe an under-explored
 * one. Deterministic: choices are a pure hash of (warrior id, week), so
 * seeded worlds reproduce exactly.
 */
import type { StrategyMemory } from '@/types/warrior.types';

/** Canon effort bands (Jorja taxonomy): very-low 1-2, low 3-4, moderate 5-6, high 7-8, very-high 9-10. */
export type RhythmBand = 'VL' | 'L' | 'M' | 'H' | 'VH';
const BANDS: RhythmBand[] = ['VL', 'L', 'M', 'H', 'VH'];
/** Representative OE/AL inside each band (canon 1-2/3-4/5-6/7-8/9-10). */
const BAND_MID: Record<RhythmBand, number> = { VL: 2, L: 4, M: 6, H: 8, VH: 10 };

export const bandOf = (v: number): RhythmBand =>
  BANDS[Math.min(4, Math.max(0, Math.floor((v - 1) / 2)))] ?? 'VL';

export const cellKey = (oe: number, al: number): string =>
  `${bandOf(oe)}/${bandOf(al)}`;

/** Deep-clone a ledger so outcome recording never mutates the source warrior. */
export function cloneStrategyMemory(memory: StrategyMemory | undefined): StrategyMemory {
  const cells: StrategyMemory['cells'] = {};
  const src = memory?.cells ?? {};
  for (const k of Object.keys(src)) {
    const c = src[k];
    if (c) cells[k] = { w: c.w, l: c.l };
  }
  return { cells };
}

/** Record a bout outcome against the plan cell that produced it. */
export function recordPlanOutcome(
  memory: StrategyMemory,
  oe: number,
  al: number,
  won: boolean
): void {
  const key = cellKey(oe, al);
  const cell = (memory.cells[key] ??= { w: 0, l: 0 });
  if (won) cell.w++; else cell.l++;
}

/** Laplace-smoothed win rate — a 3-0 cell beats a 1-0 cell. */
const score = (c?: { w: number; l: number }): number =>
  ((c?.w ?? 0) + 1) / ((c?.w ?? 0) + (c?.l ?? 0) + 2);

const visits = (c?: { w: number; l: number }): number => (c?.w ?? 0) + (c?.l ?? 0);

/** Deterministic 0..1 hash of (id, week) — same seed, same choice. */
function hash(id: string, week: number, salt: number): number {
  let h = 2166136261 ^ salt;
  const s = `${id}:${week}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export interface StrategyTarget {
  oe: number;
  al: number;
  /** True when this pick is an exploration probe rather than exploitation. */
  exploring: boolean;
}

/**
 * ε-greedy strategy target for this warrior this week.
 * Explore rate ~25% while the ledger is young, decaying as cells fill —
 * veteran warriors settle onto what their record proved. Returns the
 * mid-band OE/AL of the chosen cell.
 */
export function pickStrategyTarget(
  memory: StrategyMemory | undefined,
  warriorId: string,
  week: number
): StrategyTarget | null {
  const cells = memory?.cells ?? {};
  const total = Object.values(cells).reduce((s, c) => s + visits(c), 0);
  if (total === 0) return null; // no data yet — run the base plan, learn first
  const exploreRate = Math.max(0.1, 0.35 - total * 0.01);
  const exploring = hash(warriorId, week, 1) < exploreRate;

  let bestKey: string | null = null;
  if (!exploring) {
    for (const [k, c] of Object.entries(cells)) {
      if (!bestKey || score(c) > score(cells[bestKey])) bestKey = k;
    }
  }
  if (!bestKey) {
    // Probe the least-visited cell, seeded so the same week picks the same cell.
    const all = BANDS.flatMap((o) => BANDS.map((a) => `${o}/${a}`));
    all.sort(
      (a, b) => visits(cells[a]) - visits(cells[b]) || a.localeCompare(b)
    );
    const idx = Math.floor(hash(warriorId, week, 2) * Math.min(4, all.length));
    bestKey = all[idx] ?? 'M/M';
  }
  if (!bestKey) return null;
  const [o, a] = bestKey.split('/') as [RhythmBand, RhythmBand];
  return { oe: BAND_MID[o], al: BAND_MID[a], exploring };
}
