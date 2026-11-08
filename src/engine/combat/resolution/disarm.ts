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
  AMBI_PRIMARY_RIGHT_BIAS,
  COORD_DISARM_MOD,
  QUICKDRAW_FUMBLE_CHANCE,
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
  /** Coordination rating of the defender — clumsy fighters drop more (V23). */
  coordination?: string;
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
      (args.isCrit ? DISARM_CRIT_BONUS : 0) +
      // Canon (SJJ "Effects of Coordination"): clumsy fighters drop more.
      (COORD_DISARM_MOD[args.coordination ?? ''] ?? 0)
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
 * Which hand holds this fighter's primary weapon. Non-ambi handedness is
 * fixed; plain 'ambidextrous' resolves lazily — canon (Pagan): the warrior
 * only picks a side when an arm hit forces the question. The pick is
 * sticky once made and biased right (AMBI_PRIMARY_RIGHT_BIAS).
 */
function resolvePrimaryHand(f: FighterState, rng: () => number): 'right' | 'left' {
  switch (f.handedness) {
    case 'left':
    case 'ambi-reversed':
      f.ambiPrimarySide ??= 'left';
      return 'left';
    case 'ambidextrous':
      if (!f.ambiPrimarySide) {
        f.ambiPrimarySide = rng() < AMBI_PRIMARY_RIGHT_BIAS ? 'right' : 'left';
      }
      return f.ambiPrimarySide;
    case 'right':
    default:
      return 'right';
  }
}

/**
 * Roll a disarm on a landed hit. Gates: arm location, defender still
 * standing (hp > 0), the weapon IN THE STRUCK HAND droppable (canon
 * handedness: an arm hit only threatens that hand's weapon — a shield arm
 * holds nothing droppable). On success the struck weapon drops
 * (`droppedWeaponId`); a primary drop swings to the backup — or fists.
 * Clumsy fighters may fumble the backup draw: it stays sheathed and is
 * completed at the next exchange start instead.
 */
export function tryDisarm(args: TryDisarmArgs): boolean {
  const { events, rng, defender, defLabel, hitLoc, damage, isCrit, ctx } = args;
  const held = defender.weaponId;
  const heldOff = defender.offhandWeaponId;
  if (!isArmLocation(hitLoc) || defender.hp <= 0) return false;
  if (!isDisarmable(held) && !isDisarmable(heldOff)) return false;

  // Weapon-side resolution — may consume a draw for a plain ambi's lazy pick.
  const primaryHand = resolvePrimaryHand(defender, rng);
  const struck = hitLoc === 'left arm' ? 'left' : 'right';
  const targetSlot: 'primary' | 'offhand' = struck === primaryHand ? 'primary' : 'offhand';
  const targetId = targetSlot === 'primary' ? held : heldOff;
  if (!isDisarmable(targetId)) return false; // nothing droppable in the struck hand

  const chance =
    rollDisarmChance({
      armHits: defender.armHits,
      damageRatio: damage / defender.maxHp,
      isCrit: isCrit,
      coordination: defender.coordination,
    }) *
    (1 - (defender.disarmResist ?? 0));
  if (rng() >= chance || !targetId) return false;

  if (targetSlot === 'offhand') {
    defender.droppedWeaponId = targetId;
    defender.offhandWeaponId = undefined;
    events.push({
      type: 'DISARM',
      actor: defLabel,
      metadata: { weaponId: targetId, side: 'off' },
    });
    return true;
  }

  const dropped = held as string;
  const backup = defender.backupWeaponId;
  defender.droppedWeaponId = dropped;
  defender.weaponId = DISARM_UNARMED_WEAPON_ID;

  // Quickdraw: low-coordination fighters can fumble the backup draw — it
  // stays sheathed and completes at the next exchange start (pending flag),
  // leaving the fighter on fists meanwhile.
  let fumbled = false;
  if (backup) {
    const fumbleChance = QUICKDRAW_FUMBLE_CHANCE[defender.coordination ?? ''] ?? 0;
    if (fumbleChance > 0 && rng() < fumbleChance) {
      fumbled = true;
      defender.pendingBackupDraw = true;
      events.push({ type: 'FUMBLE', actor: defLabel, metadata: { weaponId: backup } });
    } else {
      defender.weaponId = backup;
      defender.backupWeaponId = undefined;
    }
  }
  applyWeaponSwap(defender, defLabel, ctx);
  events.push({
    type: 'DISARM',
    actor: defLabel,
    metadata: {
      weaponId: dropped,
      toWeapon: defender.weaponId,
      backup: !!backup,
      fumbled,
    },
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
