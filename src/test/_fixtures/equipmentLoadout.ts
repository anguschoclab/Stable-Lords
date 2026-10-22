/** Shared encumbrance loadout fixtures — light/medium/heavy tiers pinned by
 * the encumbrance + equipment-integration specs. */
import type { EquipmentLoadout } from '@/data/equipment';

export const LIGHT_LOADOUT: EquipmentLoadout = {
  weapon: 'dagger',
  armor: 'none_armor',
  shield: 'none_shield',
  helm: 'none_helm',
};

export const MEDIUM_LOADOUT: EquipmentLoadout = {
  weapon: 'longsword',
  armor: 'leather',
  shield: 'small_shield',
  helm: 'none_helm',
};

export const HEAVY_LOADOUT: EquipmentLoadout = {
  weapon: 'longsword',
  armor: 'plate_armor',
  shield: 'large_shield',
  helm: 'full_helm',
};
