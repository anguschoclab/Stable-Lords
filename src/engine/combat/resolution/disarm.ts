/**
 * Disarm — arm hits can knock the weapon out of a fighter's grip.
 *
 * Trigger: landed hit on a DISARM_ARM_LOCATIONS limb rolls a chance that
 * ramps with cumulative armHits (wounded arm), the hit's damage ratio, and
 * crits — the same shape as the knockdown roll.
 *
 * Unarmed state: the drop is a literal `weaponId` swap — first to the
 * fighter's `backupWeaponId` (equipment.backup, one-shot), then to
 * 'fist'. Every weapon read site (damage bonus, INI mod, range mods,
 * armor-type, shield coverage) degrades automatically. The most recently
 * dropped id sits in `droppedWeaponId` — that is what REARM retrieves;
 * an earlier drop is trampled (lost for the bout).
 *
 * Known trade-off: `classicBonus` and `weaponReq` penalties are baked into
 * `effSkills` at bout init and persist while disarmed — treated as muscle
 * memory / burden, not recomputed.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState } from './types';
import type { HitLocation } from '../mechanics/combatDamage';
import { isDisarmable } from '../mechanics/weaponStats';
import {
  DISARM_BASE_CHANCE,
  DISARM_PER_ARMHIT,
  DISARM_DAMAGE_COEFF,
  DISARM_CRIT_BONUS,
  DISARM_CHANCE_CAP,
  DISARM_RECOVER_CHANCE,
  DISARM_UNARMED_WEAPON_ID,
  DISARM_ARM_LOCATIONS,
} from '@/constants/combat';

interface RollDisarmChanceArgs {
  armHits: number;
  damageRatio: number;
  isCrit: boolean;
}

/**
 * Disarm probability for one landed arm hit — ramps with cumulative arm
 * hits, the hit's damage ratio, and crit bonus; capped at DISARM_CHANCE_CAP.
 */
export function rollDisarmChance(args: RollDisarmChanceArgs): number {
  return Math.min(
    DISARM_CHANCE_CAP,
    DISARM_BASE_CHANCE +
      args.armHits * DISARM_PER_ARMHIT +
      args.damageRatio * DISARM_DAMAGE_COEFF +
      (args.isCrit ? DISARM_CRIT_BONUS : 0)
  );
}

/** True when the hit location is a weapon-bearing arm. */
export function isArmLocation(loc: string): boolean {
  return (DISARM_ARM_LOCATIONS as readonly string[]).includes(loc);
}

interface TryDisarmArgs {
  events: CombatEvent[];
  rng: () => number;
  defender: FighterState;
  defLabel: 'A' | 'D';
  hitLoc: HitLocation;
  damage: number;
  isCrit: boolean;
}

/**
 * Roll a disarm on a landed hit. Gates: arm location, defender still
 * standing (hp > 0), current weapon droppable. On success the held weapon
 * drops (`droppedWeaponId`) and the fighter wields their backup — or fists.
 */
export function tryDisarm(args: TryDisarmArgs): boolean {
  const { events, rng, defender, defLabel, hitLoc, damage, isCrit } = args;
  const held = defender.weaponId;
  if (!isArmLocation(hitLoc) || defender.hp <= 0 || !isDisarmable(held)) return false;

  const chance = rollDisarmChance({
    armHits: defender.armHits,
    damageRatio: damage / defender.maxHp,
    isCrit: isCrit,
  });
  if (rng() >= chance || !held) return false;

  const dropped = held;
  const backup = defender.backupWeaponId;
  defender.droppedWeaponId = dropped;
  defender.weaponId = backup ?? DISARM_UNARMED_WEAPON_ID;
  defender.backupWeaponId = undefined;
  events.push({
    type: 'DISARM',
    actor: defLabel,
    metadata: { weaponId: dropped, toWeapon: defender.weaponId, backup: !!backup },
  });
  return true;
}

interface TryRearmArgs {
  events: CombatEvent[];
  rng: () => number;
  fighter: FighterState;
  label: 'A' | 'D';
}

/**
 * Exchange-start retrieve roll: a disarmed fighter scrambles for the most
 * recently dropped weapon. On success it is re-wielded and whatever they
 * were holding (a drawn backup) goes back to the sheath.
 */
export function tryRearm(args: TryRearmArgs): boolean {
  const { events, rng, fighter, label } = args;
  if (!fighter.droppedWeaponId || rng() >= DISARM_RECOVER_CHANCE) return false;

  const restored = fighter.droppedWeaponId;
  if (fighter.weaponId && fighter.weaponId !== DISARM_UNARMED_WEAPON_ID) {
    fighter.backupWeaponId = fighter.weaponId;
  }
  fighter.weaponId = restored;
  fighter.droppedWeaponId = undefined;
  events.push({ type: 'REARM', actor: label, metadata: { weaponId: restored } });
  return true;
}
