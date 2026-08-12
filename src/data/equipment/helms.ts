/**
 * Helm data for Stable Lords.
 * Head protection with varying weights and style restrictions.
 */

import { FightingStyle } from '@/types/game';
import type { EquipmentItem } from './equipment.types'; /**
 * Helms.
 */

/**
 * Helms.
 */
export const HELMS: EquipmentItem[] = [
  {
    id: 'none_helm',
    code: '',
    name: 'None',
    slot: 'helm',
    weight: 0,
    description: 'No helm. Risky but light.',
    mitigation: 0,
    defenseMod: 0,
    enduranceCostMod: 1.0,
  },
  {
    id: 'leather_cap',
    code: 'L',
    name: 'Leather Cap',
    slot: 'helm',
    weight: 1,
    description: 'Basic head protection.',
    mitigation: 1,
    defenseMod: 0,
    enduranceCostMod: 1.05,
  },
  {
    id: 'steel_cap',
    code: 'S',
    name: 'Steel Cap',
    slot: 'helm',
    weight: 2,
    description: 'Open-faced metal helm.',
    mitigation: 2,
    defenseMod: 0,
    enduranceCostMod: 1.1,
  },
  {
    id: 'helm',
    code: 'H',
    name: 'Helm',
    slot: 'helm',
    weight: 3,
    description: 'Standard enclosed helm.',
    mitigation: 3,
    defenseMod: 1,
    enduranceCostMod: 1.15,
  },
  {
    id: 'full_helm',
    code: 'FF',
    name: 'Full Helm',
    slot: 'helm',
    weight: 4,
    description: 'Fully enclosed helm. Great protection, reduces visibility.',
    restrictedStyles: [FightingStyle.AimedBlow],
    mitigation: 4,
    defenseMod: 1,
    enduranceCostMod: 1.2,
  },
];
