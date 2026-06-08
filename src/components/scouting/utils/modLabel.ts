/**
 * Formats a modifier value with proper sign display.
 * @param val - The modifier value (can be undefined)
 * @returns Formatted string with sign (e.g., "+5", "-3", "0")
 */
export function modLabel(val: number | undefined): string {
  if (!val) return '0';
  return val > 0 ? `+${val}` : `${val}`;
}
