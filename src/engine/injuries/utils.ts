import type { Warrior, InjuryData } from '@/types/warrior.types';

/** Whether a warrior currently has any injuries. */
export function hasInjuries(w: Pick<Warrior, 'injuries'>): boolean {
  return Array.isArray(w.injuries) && w.injuries.length > 0;
}

/** Total number of active injuries on a warrior. */
export function countInjuries(w: Pick<Warrior, 'injuries'>): number {
  return w.injuries?.length ?? 0;
}

/** Count injuries by severity level. */
export function getInjurySeverityCounts(w: Pick<Warrior, 'injuries'>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const inj of w.injuries ?? []) {
    const severity = (inj as InjuryData).severity ?? 'Unknown';
    counts[severity] = (counts[severity] ?? 0) + 1;
  }
  return counts;
}

/** Whether a warrior has at least one injury of the given severity. */
export function hasInjuryOfSeverity(
  w: Pick<Warrior, 'injuries'>,
  severity: InjuryData['severity']
): boolean {
  return (w.injuries ?? []).some((i) => (i as InjuryData).severity === severity);
}
