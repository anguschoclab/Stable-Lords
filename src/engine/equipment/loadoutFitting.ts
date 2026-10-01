/**
 * Loadout fitting — pick the weapon a specific warrior can actually wield.
 *
 * Every style has a canonical favorite weapon, but the canonical stat
 * requirements (ST/SZ/WT/DF) do not care about style: a Wall of Steel recruit
 * with DF 8 swinging a Morning Star (DF 11) eats −2 ATT per missing point. A
 * manager would hand that warrior a War Flail instead. This module makes that
 * choice: it scores every weapon the style may use by its net in-combat effect
 * on THIS warrior and returns the best one.
 *
 * Canon data (requirements, the CW/W/M/U suitability matrix) is read, never
 * altered — only the choice of weapon changes.
 */
import type { FightingStyle, Attributes } from '@/types/shared.types';
import {
  type EquipmentLoadout,
  checkWeaponRequirements,
  getAvailableItems,
  getClassicWeaponBonus,
  getStyleDefaultLoadout,
  SHIELD_ITEM_IDS,
} from '@/data/equipment';
import {
  getEncumbrancePenalties,
  getEncumbranceRatio,
  getEncumbranceTier,
} from '@/data/equipment/encumbrance';
import { computeEncumbranceCapacity } from '@/data/terrabloodCharts';
import { weaponDamageBonus, getWeaponInitiativeMod } from '@/engine/combat/mechanics/weaponStats';

/** A point of damage class is worth about a point of ATT over a bout. */
const DAMAGE_WEIGHT = 1;
/** Initiative decides who attacks at all — a point of INI is worth a point of ATT. */
const INI_WEIGHT = 1;
/** Encumbrance PAR / DEF swings matter, but less than landing the blow. */
const SECONDARY_WEIGHT = 0.5;

/**
 * Net combat value of wielding `weaponId` for this warrior, in ATT-point
 * equivalents: requirement penalty (dominant), classic-weapon bonus, heft +
 * style-suitability damage, weapon speed, and the penalties of the encumbrance
 * tier the full loadout lands in.
 */
export function weaponFitScore(
  weaponId: string,
  style: FightingStyle,
  attrs: Attributes,
  loadout: EquipmentLoadout
): number {
  const req = checkWeaponRequirements(weaponId, attrs);
  const enc = getEncumbrancePenalties(
    getEncumbranceTier(
      getEncumbranceRatio(
        { ...loadout, weapon: weaponId },
        computeEncumbranceCapacity(attrs.ST, attrs.CN)
      )
    )
  );
  return (
    req.attPenalty +
    getClassicWeaponBonus(style, weaponId) +
    weaponDamageBonus(weaponId, style) * DAMAGE_WEIGHT +
    (getWeaponInitiativeMod(weaponId) + enc.iniPenalty) * INI_WEIGHT +
    (enc.parPenalty + enc.defPenalty) * SECONDARY_WEIGHT
  );
}

/**
 * The best weapon for this warrior among those the style may use (never an
 * Unorthodox one). Two-handed weapons are skipped while a shield is strapped
 * on. Ties keep the current weapon, then the style's classic weapon, so a
 * warrior who qualifies for the favorite always carries it.
 */
export function fitWeapon(
  style: FightingStyle,
  attrs: Attributes,
  loadout: EquipmentLoadout = getStyleDefaultLoadout(style)
): string {
  const hasShield = !!loadout.shield && loadout.shield !== 'none_shield';
  const classic = getStyleDefaultLoadout(style).weapon;
  // A shield in the weapon hand is Total Parry's art alone (its classic weapon).
  const shieldIds: readonly string[] = SHIELD_ITEM_IDS;
  const shieldFighter = shieldIds.includes(classic);
  const candidates = getAvailableItems('weapon', style).filter(
    (w) => !(hasShield && w.twoHanded) && (shieldFighter || !shieldIds.includes(w.id))
  );

  // The weapon in hand is the incumbent only if it is itself a legal choice;
  // otherwise (two-handed behind a shield, unorthodox, unknown id) it is replaced.
  const incumbent = candidates.some((w) => w.id === loadout.weapon) ? loadout.weapon : undefined;
  let best = incumbent ?? classic;
  let bestScore = incumbent ? weaponFitScore(incumbent, style, attrs, loadout) : -Infinity;
  // Classic first so an equal-scoring favorite wins over an arbitrary tie.
  const ordered = [...candidates].sort((a, b) => Number(b.id === classic) - Number(a.id === classic));
  for (const item of ordered) {
    const score = weaponFitScore(item.id, style, attrs, loadout);
    if (score > bestScore) {
      best = item.id;
      bestScore = score;
    }
  }
  return best;
}

/** The style's default loadout with the weapon fitted to this warrior's attributes. */
export function getFittedLoadout(style: FightingStyle, attrs: Attributes): EquipmentLoadout {
  const base = getStyleDefaultLoadout(style);
  return { ...base, weapon: fitWeapon(style, attrs, base) };
}

/** Re-fit only the weapon slot of an existing loadout; returns the same object when unchanged. */
export function refitWeapon(
  style: FightingStyle,
  attrs: Attributes,
  loadout: EquipmentLoadout
): EquipmentLoadout {
  const weapon = fitWeapon(style, attrs, loadout);
  return weapon === loadout.weapon ? loadout : { ...loadout, weapon };
}
