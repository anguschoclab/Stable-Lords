import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { InjuryId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

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

/**
 * Build an injury with RNG-generated id and random duration.
 * Consumes one uuid then one next() — preserves deterministic RNG call order.
 */
export function makeInjury(
  rng: IRNGService,
  params: {
    name: string;
    description: string;
    severity: InjuryData['severity'];
    weeksBase: number;
    weeksRange: number;
    penalties: InjuryData['penalties'];
  }
): InjuryData {
  return {
    id: rng.uuid('injury') as InjuryId,
    name: params.name,
    description: params.description,
    severity: params.severity,
    weeksRemaining: params.weeksBase + Math.floor(rng.next() * params.weeksRange),
    penalties: params.penalties,
  };
}
