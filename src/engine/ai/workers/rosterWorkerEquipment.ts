/**
 * AI roster equipment logic — gear upgrades via validated loadout recommendations.
 * Extracted from rosterWorker.ts for SRP separation.
 */
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { generateRecommendations } from '@/engine/equipmentOptimizer';
import { validateLoadout, checkWeaponRequirements } from '@/data/equipment';

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
    const wepReq = checkWeaponRequirements(rec.loadout.weapon, attrs);
    if (!wepReq.met) continue;
    // Validated loadout wins — apply to the warrior.
    return { ...w, equipment: { ...rec.loadout } };
  }
  return w;
}
