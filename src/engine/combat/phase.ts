/**
 * Canonical phase resolution — single source of truth for combat phase mapping.
 * All other modules must use these functions instead of defining their own.
 */

export type PhaseKey = 'opening' | 'mid' | 'late';

/**
 * Maps an exchange index to a combat phase using equal thirds.
 * This is the authoritative phase rule used by the simulation loop.
 *
 * @param exchange - 0-based exchange index
 * @param maxExchanges - total exchanges in the bout (e.g. 30)
 * @returns 'opening' | 'mid' | 'late'
 */
export function getPhaseByExchange(exchange: number, maxExchanges: number): PhaseKey {
  if (maxExchanges <= 0) return 'opening';
  if (exchange < 0) return 'opening';
  const p = Math.floor((exchange / maxExchanges) * 3);
  if (p <= 0) return 'opening';
  if (p === 1) return 'mid';
  return 'late';
}

/**
 * Maps a 1-based minute to a combat phase by converting to an exchange index
 * and delegating to getPhaseByExchange. This ensures the stamina preview and
 * any other minute-based UI aligns with the engine's exchange-based thirds.
 *
 * @param minute - 1-based minute (1, 2, …)
 * @param maxExchanges - total exchanges in the bout (e.g. 30)
 * @param exchangesPerMinute - exchanges per minute (e.g. 3)
 * @returns 'opening' | 'mid' | 'late'
 */
export function getPhaseByMinute(
  minute: number,
  maxExchanges: number,
  exchangesPerMinute: number
): PhaseKey {
  if (maxExchanges <= 0 || exchangesPerMinute <= 0) return 'opening';
  if (minute <= 0) return 'opening';
  // Use the midpoint exchange of the minute so phase boundaries align
  // with the engine's exchange-based thirds (e.g. minute 4 → exchange 10 → 'mid')
  const exchange = (minute - 1) * exchangesPerMinute + Math.floor(exchangesPerMinute / 2);
  return getPhaseByExchange(exchange, maxExchanges);
}
