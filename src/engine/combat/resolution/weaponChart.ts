/**
 * Weapon charting tally — the player's deduction tool for finding a warrior's
 * hidden favorite weapon (Noblish Island "charting" method).
 *
 * Counts, per weapon actually swung: attack attempts (hits, misses, whiffs,
 * ripostes), crits landed, and knockdowns inflicted. A fighter wielding their
 * favorite weapon gets FAVORITE_WEAPON_CRIT_CHANCE on top of their style crit
 * chance, so the favorite's row drifts up over bouts — the statistical tell
 * before formal discovery reveals it.
 */
import type { FighterState } from './types';
import type { WeaponChartEntry } from '@/types/warrior.types';
import { DISARM_UNARMED_WEAPON_ID } from '@/constants/combat';

function chartRow(f: FighterState): WeaponChartEntry {
  const weaponId = f.weaponId ?? DISARM_UNARMED_WEAPON_ID;
  const chart = (f.weaponChart ??= {});
  return (chart[weaponId] ??= { swings: 0, crits: 0, knockdowns: 0, critDamages: 0 });
}

/** One attack attempt with the fighter's current weapon (hit, miss, or whiff). */
export function recordWeaponSwing(f: FighterState): void {
  chartRow(f).swings += 1;
}

/** A swing that rolled crit damage. */
export function recordWeaponCrit(f: FighterState): void {
  chartRow(f).crits += 1;
}

/** A knockdown this fighter inflicted with their current weapon. */
export function recordWeaponKnockdown(f: FighterState): void {
  chartRow(f).knockdowns += 1;
}

/** An "extra value" hit — a crit whose applied damage cleared
 *  CRIT_EXTRA_VALUE_MIN_DAMAGE. The fourth chart column in canon charting:
 *  tracks crits that actually bit deep, not just crits that rolled. */
export function recordWeaponExtraValueHit(f: FighterState): void {
  const row = chartRow(f);
  row.critDamages = (row.critDamages ?? 0) + 1;
}
