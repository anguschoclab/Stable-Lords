// @vitest-environment node
/**
 * V26 — `EquipmentPass` is deleted. `rosterWorkerEquipment.refitRosterWeapons`
 * is the single weekly writer of rival loadouts at the single `.met`
 * legality standard. The old pass equipped any discovered favorite with
 * `attPenalty >= -4` — a different standard — so a barely-unmet favorite
 * (e.g. scimitar on 10s: WT/DF −1 each → attPenalty −4 → pass equips,
 * refit strips, pass re-equips…) oscillated weekly.
 *
 * Live since Phase 7 — pass registration + module removed.
 */
import { describe, it, expect } from 'vitest';
import { WEEK_PIPELINE_PASSES } from '@/engine/pipeline/services/weekPipelineService';
import { refitRosterWeapons } from '@/engine/ai/workers/rosterWorkerEquipment';
import { checkWeaponRequirements } from '@/data/equipment';
import { makeWarrior } from '@/test/_fixtures/factories';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorFavorites } from '@/types/warrior.types';

describe('week pipeline — EquipmentPass removal', () => {
  it('registers no equipment pass', () => {
    expect(WEEK_PIPELINE_PASSES.map((p) => p.id)).not.toContain('equipment');
  });
});

describe('single legality standard — a .met-failing favorite is never equipped', () => {
  it('refitRosterWeapons leaves an unmet suspected favorite off the roster', () => {
    // Scimitar needs WT 11 / DF 11; this warrior runs 10s → met: false,
    // attPenalty −4 — inside the old EquipmentPass's equip window.
    const w = makeWarrior({
      style: FightingStyle.StrikingAttack,
      equipment: { weapon: 'short_spear', armor: 'leather', helm: 'none_helm', shield: 'none_shield' },
      favorites: {
        weaponId: 'scimitar',
        rhythm: { oe: 5, al: 5 },
        discovered: {
          weapon: true,
          rhythm: false,
          weaponHints: 0,
          rhythmHints: 0,
        },
      } as WarriorFavorites,
    });
    const req = checkWeaponRequirements('scimitar', w.attributes);
    expect(req.met).toBe(false);
    expect(req.attPenalty).toBeGreaterThanOrEqual(-4); // the oscillation window
    const [out] = refitRosterWeapons([w]);
    expect(out!.equipment?.weapon).not.toBe('scimitar');
  });
});
