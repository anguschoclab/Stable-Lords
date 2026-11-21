/**
 * Armor data for Stable Lords.
 * Body armor with varying weights and style restrictions.
 *
 * V24-F3: ids/codes aligned to the canonical Duel2 armor table
 * (ALE/APL/ARM/ASM/ACM/APM/APA). The weight-5 studded-hide row has no canon
 * code — `AS` is a house divergence recorded in docs/MEGAPLAN_BACKLOG.md §3.
 * Canon `APA-F` (full plate) is not modeled — APA is the heaviest tier.
 */

import { FightingStyle } from '@/types/game';
import type { EquipmentItem } from './equipment.types';

/**
 * Armors.
 */
export const ARMORS: EquipmentItem[] = [
  {
    id: 'none_armor',
    code: '',
    name: 'None',
    slot: 'armor',
    weight: 0,
    description: 'No armor. Maximum mobility.',
    mitigation: 0,
    defenseMod: 0,
    enduranceCostMod: 1.0,
  },
  {
    id: 'ALE',
    code: 'ALE',
    name: 'Leather',
    slot: 'armor',
    weight: 2,
    description: 'Cured leather armor. Light and flexible.',
    mitigation: 1,
    defenseMod: 0,
    enduranceCostMod: 1.1,
  },
  {
    id: 'APL',
    code: 'APL',
    name: 'Padded Leather',
    slot: 'armor',
    weight: 4,
    description: 'Quilted cloth armor. Basic protection.',
    mitigation: 2,
    defenseMod: 1,
    enduranceCostMod: 1.2,
  },
  {
    id: 'AS',
    code: 'AS',
    name: 'Studded Leather',
    slot: 'armor',
    weight: 5,
    description: 'Leather reinforced with metal studs.',
    mitigation: 3,
    defenseMod: 1,
    enduranceCostMod: 1.3,
  },
  {
    id: 'ARM',
    code: 'ARM',
    name: 'Ringmail',
    slot: 'armor',
    weight: 6,
    description: 'Leather with metal rings sewn on.',
    mitigation: 4,
    defenseMod: 1,
    enduranceCostMod: 1.4,
  },
  {
    id: 'ASM',
    code: 'ASM',
    name: 'Scalemail',
    slot: 'armor',
    weight: 8,
    description: 'Overlapping metal scales. Heavy.',
    mitigation: 5,
    defenseMod: 2,
    enduranceCostMod: 1.6,
  },
  {
    id: 'ACM',
    code: 'ACM',
    name: 'Chainmail',
    slot: 'armor',
    weight: 10,
    description: 'Interlocking metal rings. Standard heavy protection.',
    mitigation: 6,
    defenseMod: 2,
    enduranceCostMod: 1.8,
  },
  {
    id: 'APM',
    code: 'APM',
    name: 'Platemail',
    slot: 'armor',
    weight: 12,
    description: 'Full plate mail. Very heavy.',
    restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack],
    mitigation: 8,
    defenseMod: 3,
    enduranceCostMod: 2.0,
  },
  {
    id: 'APA',
    code: 'APA',
    name: 'Plate Armor',
    slot: 'armor',
    weight: 14,
    description: 'Maximum protection. Extremely heavy.',
    restrictedStyles: [
      FightingStyle.AimedBlow,
      FightingStyle.LungingAttack,
      FightingStyle.SlashingAttack,
    ],
    mitigation: 10,
    defenseMod: 3,
    enduranceCostMod: 2.5,
  },
];
