/**
 * Resolve the favored side letter ('A' | 'D') to a display name.
 */
export function favoredName(
  favored: 'A' | 'D' | null,
  nameA: string,
  nameD: string
): string | null {
  if (favored === 'A') return nameA;
  if (favored === 'D') return nameD;
  return null;
}
