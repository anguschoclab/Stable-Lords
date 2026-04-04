import { getItemById, getItemByCode } from "@/data/equipment";
import { WeaponType } from "./narrativeData";

/**
 * Stable Lords — Narrative Helpers
 */

type RNG = () => number;

export function pick<T>(rng: RNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Approximate DM-style heights from SZ attribute */
export function szToHeight(sz: number): string {
  const inches = 58 + Math.max(0, sz - 3) * 1.2;
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return inch > 0 ? `${ft}' ${inch}"` : `${ft}'`;
}

/** Map equipment IDs to canonical display names (e.g. "BS" → "BROADSWORD") */
export function getWeaponDisplayName(equipId?: string): string {
  if (!equipId || equipId === "fists" || equipId === "none") return "OPEN HAND";
  const item = getItemById(equipId) ?? getItemByCode(equipId);
  return item?.name?.toUpperCase() ?? "WEAPON";
}

/** Determine weapon category for PBP verb mapping */
export function getWeaponType(weaponId?: string): WeaponType {
  if (!weaponId || weaponId === "fists" || weaponId === "none") return "fist";
  
  const slashWeapons = ["scimitar", "broadsword", "greatsword", "longsword", "short_sword", "hatchet", "battle_axe", "great_axe"];
  const bashWeapons = ["mace", "war_hammer", "morning_star", "maul", "war_flail"];
  const thrustWeapons = ["epee", "dagger", "short_spear", "long_spear", "halberd", "quarterstaff"];
  
  if (slashWeapons.includes(weaponId)) return "slash";
  if (bashWeapons.includes(weaponId)) return "bash";
  if (thrustWeapons.includes(weaponId)) return "thrust";
  
  return "generic";
}
