/**
 * Shared formatting helpers.
 * Centralises repeated display patterns (e.g., toLocaleString, currency).
 */

/** Formats a number with locale-aware grouping (e.g. 1,234). */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** Formats a gold amount with the 'g' suffix (e.g. 1,234g). */
export function formatGold(n: number): string {
  return `${n.toLocaleString()}g`;
}

/** Formats a ratio as a percentage string (e.g. 0.85 → "85%"). */
export function formatPercent(n: number, decimals = 0): string {
  return `${(n * 100).toFixed(decimals)}%`;
}
