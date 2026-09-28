/**
 * Stable Lords — strategy score display helpers.
 * UI-layer mapping from engine strategy scores to palette classes.
 * Extracted from engine/strategy/strategyAnalysis.ts (CSS classes do not
 * belong in the engine layer).
 */

/**
 * Returns the CSS class for a strategy score based on its value.
 *
 * @param score - The numerical strategy score (0-100)
 * @returns A string containing Tailwind CSS classes
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]';
  if (score >= 70) return 'text-primary';
  if (score >= 50) return 'text-arena-pop';
  return 'text-destructive';
}
