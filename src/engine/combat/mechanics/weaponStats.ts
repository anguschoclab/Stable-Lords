/**
 * Weapon combat statistics.
 *
 * Gives weapon choice real in-combat consequences beyond range and stat
 * requirements: heavier weapons hit harder but swing slower, lighter weapons the
 * reverse, and the canonical per-style weapon suitability (W/M/U) shifts damage —
 * a Well-suited weapon lands an edge, an Unorthodox one a penalty. The heft curve
 * is centred on weight 3 so the population-wide mortality baseline is preserved
 * (mean contribution ~0 across the weapon table).
 */
import type { FightingStyle } from '@/types/shared.types';
import { WEAPONS } from '@/data/equipment/weapons';
import {
  DISARM_UNARMED_WEAPON_ID,
  FAST_WEAPON_INI,
  LUNGE_KNOCKDOWN_BONUS,
  TWOHANDED_PARRY_ENDURANCE_SURCHARGE,
} from '@/constants/combat';
import {
  getWeaponSuitability,
  weaponSuitabilityDamageMod,
} from '@/engine/equipment/weaponSuitability';

const WEAPON_BY_ID = new Map<string, (typeof WEAPONS)[0]>();
for (const w of WEAPONS) {
  WEAPON_BY_ID.set(w.id, w);
}

/**
 * Flat damage-class bonus from the weapon: heft (weight-driven) plus the canonical
 * weapon-style suitability modifier (CW +1 / W 0 / M −1 / U −2). Added to the
 * attacker's damage class before {@link computeHitDamage}.
 *
 * @param weaponId - Equipped weapon id (optional).
 * @param style - Wielder's fighting style, for the suitability modifier (optional).
 * @returns Damage-class delta (favorite weapon ≈ heft +1; unorthodox ≈ heft −2).
 */
export function weaponDamageBonus(weaponId?: string, style?: FightingStyle): number {
  if (!weaponId) return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w) return 0;
  const heft = Math.round((w.weight - 3) * 0.8);
  const suitability = style ? weaponSuitabilityDamageMod(getWeaponSuitability(weaponId, style)) : 0;
  return heft + suitability;
}

/**
 * Initiative modifier from weapon heft: light weapons strike faster, heavy ones
 * slower. Centred on weight 3 (≈ +1 for a dagger, ≈ -2 for a maul).
 *
 * @param weaponId - Equipped weapon id (optional).
 * @returns Initiative delta.
 */
export function getWeaponInitiativeMod(weaponId?: string): number {
  if (!weaponId) return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w) return 0;
  // Canon (Assur): HA/QS/WH/SS are the fast blades — a flat initiative edge
  // on top of the weight-derived formula.
  const fastEdge = (FAST_WEAPON_INI as readonly string[]).includes(weaponId) ? 1 : 0;
  const base = -Math.round((w.weight - 3) * 0.5);
  return fastEdge === 0 ? base : base + fastEdge;
}

/**
 * Whether the item in the weapon slot can be knocked loose by a disarm.
 * Bare fists can never be "dropped"; anything else defaults to droppable
 * unless the item data opts out via `disarmable: false`.
 */
/** Canon (Assur): lunging/thrusting weapons have the best knock-down
 *  ability — the spears get an additive bump on the knockdown check. */
const LUNGING_WEAPON_IDS: readonly string[] = ['long_spear', 'short_spear'];

export function lungingKnockdownBonus(weaponId?: string): number {
  if (!weaponId) return 0;
  return LUNGING_WEAPON_IDS.includes(weaponId) ? LUNGE_KNOCKDOWN_BONUS : 0;
}

/** Canon (Assur): 2-handed weapons pay an endurance surcharge on the
 *  parry side ("break often when used to parry"). */
export function twoHandedParryEnduranceMult(weaponId?: string): number {
  if (!weaponId) return 1;
  const w = WEAPON_BY_ID.get(weaponId);
  return w?.twoHanded ? TWOHANDED_PARRY_ENDURANCE_SURCHARGE : 1;
}

export function isDisarmable(weaponId?: string): boolean {
  if (!weaponId || weaponId === DISARM_UNARMED_WEAPON_ID) return false;
  const w = WEAPON_BY_ID.get(weaponId);
  return !!w && w.disarmable !== false;
}
