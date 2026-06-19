/**
 * Veteran compensation — as a fighter ages past 28 they lose SP/DF (see
 * aging.ts), which guts initiative-dependent styles. Rather than soften the
 * loss (which flattens the lifecycle), we grant a partial, WL-scaled DEF bonus:
 * the veteran "learns to fight old" and drifts toward a patient, defensive
 * profile. The bonus is always strictly less than the speed lost, so aging
 * remains a net decline — the fighter changes identity, it does not get buffed.
 *
 * Magnitude (WISDOM_FACTOR) is a balance knob: tune it via the balance harness
 * so late-career INI styles (LU/PL/PR) stop cliff-diving without veterans
 * out-tanking their prime selves. Keep it < 1.0.
 */
import { AGING_PENALTY_START, VETERAN_WISDOM_FACTOR } from '@/constants/combat/combat';

/** SP+DF points lost to aging at a given age (matches aging.ts penalty). */
function agingAttributeLoss(age: number): number {
  const penalty = Math.max(0, Math.floor((age - AGING_PENALTY_START) / 3));
  return penalty * 2; // applied to both SP and DF
}

/** DEF skill bonus a veteran earns from accumulated age-driven decline. */
export function getVeteranDefBonus(age: number, will: number): number {
  const lost = agingAttributeLoss(age);
  if (lost === 0) return 0;
  const wlScale = will / 15; // 15 = STD attribute; wise > 1, dull < 1
  const bonus = lost * VETERAN_WISDOM_FACTOR * wlScale;
  return Math.min(bonus, lost); // never exceed the speed it compensates
}
