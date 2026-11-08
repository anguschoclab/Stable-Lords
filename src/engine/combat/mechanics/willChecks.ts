/**
 * Will checks (canon — Arena 93): when a fighter is exhausted and hurt, they
 * roll against willpower to stay on their feet. Will (WL) is the core stat;
 * the plan's killDesire leans it — a fighter who wants the kill digs deeper.
 */

const WILL_CHECK_BASE = 0.3;
const WILL_CHECK_WL_COEFF = 0.03;
const WILL_CHECK_KD_COEFF = 0.05;
const WILL_CHECK_WL_PIVOT = 10;
const WILL_CHECK_KD_PIVOT = 5;

/**
 * Pass probability for a will check given will and killDesire.
 * Pure — same inputs, same chance. Clamped to [0, 1].
 * @param wl - Fighter's will attribute.
 * @param killDesire - Active plan killDesire (1-10).
 */
export function willCheckChance(wl: number, killDesire: number): number {
  const chance =
    WILL_CHECK_BASE +
    (wl - WILL_CHECK_WL_PIVOT) * WILL_CHECK_WL_COEFF +
    (killDesire - WILL_CHECK_KD_PIVOT) * WILL_CHECK_KD_COEFF;
  return Math.max(0, Math.min(1, chance));
}

/**
 * Roll one will check — true means the fighter holds on.
 * @param wl - Fighter's will attribute.
 * @param killDesire - Active plan killDesire (1-10).
 * @param rng - Roll function (0..1).
 */
export function rollWillCheck(wl: number, killDesire: number, rng: () => number): boolean {
  return rng() < willCheckChance(wl, killDesire);
}
