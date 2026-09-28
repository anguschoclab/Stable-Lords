/**
 * Stable Lords — Meta Drift display helpers.
 * UI-layer mapping from engine drift values to labels and palette classes.
 * Extracted from engine/analytics/metaDrift.ts (CSS classes do not belong in
 * the engine layer).
 */

/**
 * Maps a numerical drift value to a human-readable meta label.
 *
 * @param drift - The style's current meta drift (-10 to 10)
 * @returns A label describing the style's current standing (e.g., 'Dominant', 'Rising')
 */
export function getMetaLabel(drift: number): string {
  if (drift >= 5) return 'Dominant';
  if (drift >= 2) return 'Rising';
  if (drift <= -5) return 'Declining';
  if (drift <= -2) return 'Struggling';
  return 'Stable';
}

/**
 * Returns a CSS color class based on the style's meta drift.
 *
 * @param drift - The style's current meta drift (-10 to 10)
 * @returns A string containing Tailwind CSS color classes
 */
export function getMetaColor(drift: number): string {
  if (drift >= 5) return 'text-arena-treasury';
  if (drift >= 2) return 'text-arena-pop';
  if (drift <= -5) return 'text-destructive';
  if (drift <= -2) return 'text-arena-fame';
  return 'text-muted-foreground';
}
