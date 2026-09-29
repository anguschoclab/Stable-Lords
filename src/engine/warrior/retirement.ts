/**
 * Shared retirement helper — retires a warrior and, for distinguished
 * careers, earns the permanent 'legend' epithet (never downgrading a
 * higher-ranked one). All four retirement paths funnel through here so the
 * honor is awarded consistently.
 */
import type { Warrior } from '@/types/warrior.types';
import { earnEpithet, qualifiesForLegend } from '@/data/names/epithets';

/**
 * Returns a retired copy of `w`. Distinguished careers (50+ wins, 10+ kills,
 * fame >= 1500, or any title) gain a 'legend' epithet.
 */
export function retireWithHonors(w: Warrior, week: number, age?: number): Warrior {
  const retired: Warrior = {
    ...w,
    status: 'Retired',
    retiredWeek: week,
    ...(age !== undefined ? { age } : {}),
  };
  if (qualifiesForLegend(w)) {
    const epithet = earnEpithet('legend', w.id, w.epithet);
    if (epithet) retired.epithet = epithet;
  }
  return retired;
}
