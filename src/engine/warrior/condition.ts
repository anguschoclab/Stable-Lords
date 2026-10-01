import type { Warrior, InjuryData, InjurySeverity } from '@/types/warrior.types';

/**
 * Condition cost of one active injury, by severity. Tuned against the AI
 * bout-acceptance gates: one Minor knock leaves a warrior fit for ordinary
 * bouts (80), two make a cautious owner rest them (60), three are a champion's
 * "too hurt to defend" (40).
 */
const INJURY_CONDITION_COST: Record<InjurySeverity, number> = {
  Minor: 20,
  Moderate: 35,
  Severe: 55,
  Critical: 75,
  Permanent: 25,
};

/**
 * A warrior's between-bout fighting condition, 0–100 (100 = unhurt).
 *
 * This is the AI's "how healthy is this warrior" signal. It is derived from
 * active injuries — NOT from `derivedStats.hp`, which is the warrior's maximum
 * hit points (a CN/SZ/WL stat on the ~20–55 scale), not a health percentage.
 */
export function fightingCondition(warrior: Pick<Warrior, 'injuries'>): number {
  let condition = 100;
  for (const injury of warrior.injuries ?? []) {
    if (typeof injury === 'string') continue;
    condition -= INJURY_CONDITION_COST[(injury as InjuryData).severity] ?? 0;
  }
  return Math.max(0, condition);
}
