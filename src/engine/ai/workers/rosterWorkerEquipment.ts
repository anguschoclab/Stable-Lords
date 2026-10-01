/**
 * AI roster equipment logic — gear upgrades via validated loadout recommendations.
 * Extracted from rosterWorker.ts for SRP separation.
 */
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { generateRecommendations } from '@/engine/equipment/equipmentOptimizer';
import { validateLoadout, checkWeaponRequirements, getStyleDefaultLoadout } from '@/data/equipment';
import { refitWeapon } from '@/engine/equipment/loadoutFitting';

/**
 * Apply an equipment upgrade — validated through the same loadout + weapon-
 * requirement gates the player hits via `StableEquipment.tsx`. Walks the
 * optimizer recommendations in profile-priority order, skipping any that fail
 * `validateLoadout` (catches two-handed + shield) or `checkWeaponRequirements`
 * (ST/SZ/WT/DF gates). If every recommendation fails, the warrior is returned
 * untouched — no attribute nudge, no invalid gear applied.
 *
 * Historical note: the previous implementation didn't write `warrior.equipment`
 * at all — it just incremented attributes based on the top recommendation's
 * weight profile. That made the function a misnamed attribute nudger *and*
 * skipped every validation gate. We now do the job on the tin and honor the
 * shared validator.
 */
export function applyGearUpgrade(w: Warrior, _rng: IRNGService): Warrior {
  const recommendations = generateRecommendations(w.style, w.derivedStats?.encumbrance ?? 0);
  const attrs = {
    ST: w.attributes.ST,
    SZ: w.attributes.SZ,
    WT: w.attributes.WT,
    DF: w.attributes.DF,
  };

  for (const rec of recommendations) {
    const loadoutIssues = validateLoadout(rec.loadout);
    if (loadoutIssues.length > 0) continue;
    // The optimizer picks by style alone; the weapon slot is then fitted to
    // this warrior's attributes so an upgrade never hands over a favorite
    // they cannot wield.
    const loadout = refitWeapon(w.style, w.attributes, rec.loadout);
    if (validateLoadout(loadout).length > 0) continue;
    const wepReq = checkWeaponRequirements(loadout.weapon, attrs);
    if (!wepReq.met) continue;
    // Validated loadout wins — apply to the warrior.
    return { ...w, equipment: { ...loadout } };
  }
  return w;
}

/**
 * Weekly armory pass: keep each active warrior on the best weapon they can
 * wield as their attributes change (a recruit who trains into the favorite's
 * requirements picks it up; one who never will stops swinging it at a
 * penalty). Free and RNG-free — swapping between stock weapons is not the
 * paid gear upgrade above. Returns the same roster array when nothing changed.
 */
export function refitRosterWeapons(roster: Warrior[]): Warrior[] {
  let changed = false;
  const next = roster.map((w) => {
    if (w.status !== 'Active') return w;
    const current = w.equipment ?? getStyleDefaultLoadout(w.style);
    const fitted = refitWeapon(w.style, w.attributes, current);
    if (fitted === current && w.equipment) return w;
    changed = true;
    return { ...w, equipment: fitted };
  });
  return changed ? next : roster;
}
