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
 * Weapon-linked skills unbake on swap: classicWeaponBonus, weaponReq
 * penalties, and weapon-slot shield mods are tracked in `weaponMods` and
 * re-added for whatever is newly held — an underqualified broadsword's
 * attPenalty lifts the moment it hits the ground, and a TP's dropped
 * weapon-slot shield stops protecting. `ctx.weaponReq*` is refreshed in
 * place so the per-exchange endurance cost follows the held weapon.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { FighterState, ResolutionContext } from './types';
import type { HitLocation } from '../mechanics/combatDamage';
import { isDisarmable } from '../mechanics/weaponStats';
import {
  checkWeaponRequirements,
  getClassicWeaponBonus,
  getShieldModifiers,
} from '@/data/equipment';
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

/**
 * Weapon-linked skill contributions for a held weapon — mirrors the
 * `classicBonus + weaponReq.attPenalty + wShield` slice baked into
 * `effSkills` at bout init (see computeEffectiveSkills).
 */
function weaponLinkedMods(fighter: FighterState, weaponId: string | undefined) {
  const id = weaponId ?? DISARM_UNARMED_WEAPON_ID;
  const req = fighter.attributes
    ? checkWeaponRequirements(id, fighter.attributes)
    : { attPenalty: 0, endurancePenalty: 1 };
  const attPenalty = req.attPenalty || 0; // normalize -0 from met weapons
  const shield = getShieldModifiers(id);
  return {
    att: getClassicWeaponBonus(fighter.style, id) + attPenalty + shield.att,
    par: shield.def,
    def: shield.def,
    attPenalty: attPenalty,
    endurancePenalty: req.endurancePenalty,
  };
}

/** Re-baseline `skills` and live `ctx.weaponReq*` after a weapon swap. */
function applyWeaponSwap(
  fighter: FighterState,
  label: 'A' | 'D',
  ctx?: ResolutionContext
): void {
  const next = weaponLinkedMods(fighter, fighter.weaponId);
  const prev = fighter.weaponMods ?? { att: 0, par: 0, def: 0 };
  fighter.skills.ATT += next.att - prev.att;
  fighter.skills.PAR += next.par - prev.par;
  fighter.skills.DEF += next.def - prev.def;
  fighter.weaponMods = { att: next.att, par: next.par, def: next.def };
  const slot = label === 'A' ? ctx?.weaponReqA : ctx?.weaponReqD;
  if (slot) {
    slot.endurancePenalty = next.endurancePenalty;
    slot.attPenalty = next.attPenalty;
  }
}

interface TryDisarmArgs {
  events: CombatEvent[];
  rng: () => number;
  defender: FighterState;
  defLabel: 'A' | 'D';
  hitLoc: HitLocation;
  damage: number;
  isCrit: boolean;
  ctx?: ResolutionContext;
}

/**
 * Roll a disarm on a landed hit. Gates: arm location, defender still
 * standing (hp > 0), current weapon droppable. On success the held weapon
 * drops (`droppedWeaponId`) and the fighter wields their backup — or fists.
 */
export function tryDisarm(args: TryDisarmArgs): boolean {
  const { events, rng, defender, defLabel, hitLoc, damage, isCrit, ctx } = args;
  const held = defender.weaponId;
  if (!isArmLocation(hitLoc) || defender.hp <= 0 || !isDisarmable(held)) return false;

  const chance =
    rollDisarmChance({
      armHits: defender.armHits,
      damageRatio: damage / defender.maxHp,
      isCrit: isCrit,
    }) *
    (1 - (defender.disarmResist ?? 0));
  if (rng() >= chance || !held) return false;

  const dropped = held;
  const backup = defender.backupWeaponId;
  defender.droppedWeaponId = dropped;
  defender.weaponId = backup ?? DISARM_UNARMED_WEAPON_ID;
  defender.backupWeaponId = undefined;
  applyWeaponSwap(defender, defLabel, ctx);
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
  ctx?: ResolutionContext;
}

/**
 * Exchange-start retrieve roll: a disarmed fighter scrambles for the most
 * recently dropped weapon. On success it is re-wielded and whatever they
 * were holding (a drawn backup) goes back to the sheath.
 */
export function tryRearm(args: TryRearmArgs): boolean {
  const { events, rng, fighter, label, ctx } = args;
  if (!fighter.droppedWeaponId || rng() >= DISARM_RECOVER_CHANCE) return false;

  const restored = fighter.droppedWeaponId;
  if (fighter.weaponId && fighter.weaponId !== DISARM_UNARMED_WEAPON_ID) {
    fighter.backupWeaponId = fighter.weaponId;
  }
  fighter.weaponId = restored;
  fighter.droppedWeaponId = undefined;
  applyWeaponSwap(fighter, label, ctx);
  events.push({ type: 'REARM', actor: label, metadata: { weaponId: restored } });
  return true;
}
