/**
 * Combat Damage — barrel re-export of damage mechanics modules.
 */

export type { HitLocation } from './hitLocation';
export {
  HIT_LOCATIONS,
  protectCovers,
  rollHitLocation,
  LOCATION_DAMAGE_MULT,
  LOCATION_KILL_MULT,
} from './hitLocation';

export { WEAPON_DAMAGE_TYPE, applyArmorTypeMod } from './weaponArmor';

export { applyProtectMod, applyShieldZoneMod } from './protectShield';

export { computeHitDamage, calculateKillWindow } from './damageCalc';
