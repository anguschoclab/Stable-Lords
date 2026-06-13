/**
 * Fatigue Utilities
 * Standardized thresholds: fresh ≤30, elevated 31–60, exhausted >60.
 */

/** Warriors at or below this value are considered fresh. */
export const FATIGUE_FRESH = 30;

/** Warriors above this value are considered exhausted and should not fight. */
export const FATIGUE_ELEVATED = 60;

/** Returns the fatigue band for a given fatigue value. */
export function getFatigueBand(fatigue: number): 'fresh' | 'elevated' | 'exhausted' {
  if (fatigue <= FATIGUE_FRESH) return 'fresh';
  if (fatigue <= FATIGUE_ELEVATED) return 'elevated';
  return 'exhausted';
}

/** Whether the warrior is past the fresh threshold (i.e., 31+). */
export function isFatigued(fatigue: number): boolean {
  return fatigue > FATIGUE_FRESH;
}

/** Whether the warrior is past the elevated threshold (i.e., 61+). */
export function isExhausted(fatigue: number): boolean {
  return fatigue > FATIGUE_ELEVATED;
}
