import { STYLE_DISPLAY_NAMES } from '@/types/game';

/**
 * Gets the display name for a fighting style.
 * @param style - The fighting style name
 * @returns The formatted display name
 */
export function getStyleDisplayName(style: string): string {
  return STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] || style;
}

/**
 * Calculates the percentage of a style count relative to roster size.
 * @param count - The number of warriors with this style
 * @param rosterSize - Total roster size
 * @returns Percentage (0-100)
 */
export function calculateStylePercentage(count: number, rosterSize: number): number {
  return rosterSize > 0 ? (count / rosterSize) * 100 : 0;
}

/**
 * Sorts style entries by count in descending order.
 * @param styleCounts - Record of style counts
 * @returns Sorted array of [style, count] tuples
 */
export function sortStylesByCount(styleCounts: Record<string, number>): [string, number][] {
  return Object.entries(styleCounts).sort(([, a], [, b]) => b - a);
}

/**
 * Determines the dominant style from style counts.
 * @param styleCounts - Record of style counts
 * @returns The dominant style name or null if no styles
 */
export function getDominantStyle(styleCounts: Record<string, number>): string | null {
  const sorted = sortStylesByCount(styleCounts);
  return sorted.length > 0 && sorted[0] ? sorted[0][0] : null;
}
