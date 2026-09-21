/**
 * Extract warrior display names from a FightSummary title.
 * Title format: "${nameA} vs ${nameB}" or "${nameA} vs ${nameB} (${tournament})".
 * Splits on the first " vs " so a defender name containing " vs " survives intact.
 * Returns 'Unknown' for any name that cannot be parsed.
 */
export function getNamesFromTitle(title: string): { a: string; d: string } {
  const base = title.split(' (')[0] ?? '';
  const idx = base.indexOf(' vs ');
  if (idx === -1) {
    return { a: base || 'Unknown', d: 'Unknown' };
  }
  return { a: base.slice(0, idx) || 'Unknown', d: base.slice(idx + 4) || 'Unknown' };
}
