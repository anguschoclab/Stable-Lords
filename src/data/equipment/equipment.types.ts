/**
 * Equipment type definitions for Stable Lords.
 */

import { FightingStyle } from '@/types/game'; /**
 * Equipment slot type.
 */

/**
 * Equipment slot type.
 */
export type EquipmentSlot = 'weapon' | 'armor' | 'shield' | 'helm'; /**
 * Defines the shape of equipment item.
 */

/**
 * Defines the shape of equipment item.
 */
export interface EquipmentItem {
  id: string;
  code: string; // canonical 2-letter code (DA, EP, BS, etc.)
  name: string;
  slot: EquipmentSlot;
  weight: number; // canonical encumbrance cost
  description: string;
  twoHanded?: boolean; // weapons only — blocks shield slot
  // Canonical Duel II weapon-vs-style suitability tiers (terrablood.com):
  //   favoredStyles    = CW (Can't-go-Wrong / favorite weapon)  — must be a subset of preferredStyles
  //   preferredStyles  = W  (Well suited; includes the CW favorites)
  //   restrictedStyles = U  (Unorthodox)
  //   anything in none of the three = M (Marginal)
  restrictedStyles?: FightingStyle[]; // styles that CANNOT use this (U)
  preferredStyles?: FightingStyle[]; // styles that are well suited or better (W ∪ CW)
  favoredStyles?: FightingStyle[]; // CW — styles this is the favorite/"can't go wrong" weapon for
  // Weapon stat requirements (canonical minimums from Terrablood)
  reqST?: number; // minimum Strength
  reqSZ?: number; // minimum Size
  reqWT?: number; // minimum Wit
  reqDF?: number; // minimum Deftness
  // Canonical Duel II special-case requirement overrides for non-standard wielding.
  // Each is a partial set of stat minimums that REPLACE the base req for that stat
  // when the weapon is held that way (e.g. Battle Axe needs only SZ 3 two-handed,
  // dual Epées need DF 22 — or 17 if ambidextrous).
  twoHandedReq?: Partial<Record<'ST' | 'SZ' | 'WT' | 'DF', number>>; // used two-handed
  offHandReq?: Partial<Record<'ST' | 'SZ' | 'WT' | 'DF', number>>; // used in the off-hand
  dualWieldReq?: Partial<Record<'ST' | 'SZ' | 'WT' | 'DF', number>>; // wielding two of this weapon
  dualWieldReqAmbi?: Partial<Record<'ST' | 'SZ' | 'WT' | 'DF', number>>; // dual-wielded, ambidextrous
  // Shield-only: which hit-location band the shield reliably covers.
  // LOW = legs/groin, MEDIUM = torso/arms, HIGH = head/throat/shoulders.
  // Used by combatDamage to apply zone-specific mitigation when the defender
  // is protecting that band.
  coverage?: 'LOW' | 'MEDIUM' | 'HIGH';
} /**
 * Defines the shape of equipment loadout.
 */

/**
 * Defines the shape of equipment loadout.
 */
export interface EquipmentLoadout {
  weapon: string; // item id
  armor: string;
  shield: string;
  helm: string;
}

/** Check weapon stat requirements against warrior attributes. Returns penalty details. */
export interface WeaponReqCheck {
  stat: 'ST' | 'SZ' | 'WT' | 'DF';
  label: string;
  required: number;
  current: number;
  deficit: number;
} /**
 * Defines the shape of weapon req result.
 */

/**
 * Defines the shape of weapon req result.
 */
export interface WeaponReqResult {
  met: boolean;
  failures: WeaponReqCheck[];
  attPenalty: number; // -2 ATT per point of total stat deficit (summed across unmet ST/SZ/WT/DF)
  endurancePenalty: number; // endurance multiplier: 1 + 0.10 per point of total deficit (e.g. 1.5 at deficit 5)
}

/**
 * Hard-block validation for a loadout. Replaces the previous soft-warning fallthrough
 * for the two-handed + shield conflict — illegal combinations return a list of issues
 * so the UI/plan layer can block save instead of silently stripping gear.
 */
export interface LoadoutIssue {
  code: 'TWO_HANDED_WITH_SHIELD' | 'MISSING_WEAPON';
  message: string;
}
