/**
 * V24-F3 canon armor table — pins every armor row to the Duel2 strategy-sheet
 * family (reality.com / Assur's charts): ALE Leather(2), APL Padded Leather(4),
 * ARM Ringmail(6), ASM Scalemail(8), ACM Chainmail(10), APM Platemail(12),
 * APA Plate Armor(14).
 *
 * Canon adjudication (WS3):
 *  - The weight-5 studded-hide row is NOT canon — removed outright (user
 *    directive + strategy sheet confirms 7 armor codes).
 *  - `APA-F` (full plate) is a canon tier this game does not model — do not
 *    invent it (8 rows total: 7 canon + none_armor; APA is the heaviest).
 *  - ids equal codes on canon rows (F3 zero-compat rename — no alias index;
 *    stale saves reject via SAVE_STATE_VERSION 4.0.0).
 *  - Stats (mitigation/defenseMod/enduranceCostMod/restrictedStyles) are the
 *    pre-F3 values — the rename must not drift them.
 */
import { describe, it, expect } from 'vitest';
import { ARMORS } from '@/data/equipment/armor';
import {
  getItemById,
  getItemByCode,
  DEFAULT_LOADOUT,
  getStyleDefaultLoadout,
} from '@/data/equipment/equipment.utils';
import { protectCovers } from '@/engine/combat/mechanics/hitLocation';
import { FightingStyle } from '@/types/game';
import type { EquipmentItem } from '@/data/equipment/equipment.types';

interface RowPin {
  id: string;
  code: string;
  name: string;
  weight: number;
  mitigation: number;
  defenseMod: number;
  enduranceCostMod: number;
  restrictedStyles?: FightingStyle[];
}

const CANON_ROWS: RowPin[] = [
  {
    id: 'none_armor',
    code: '',
    name: 'None',
    weight: 0,
    mitigation: 0,
    defenseMod: 0,
    enduranceCostMod: 1.0,
  },
  {
    id: 'ALE',
    code: 'ALE',
    name: 'Leather',
    weight: 2,
    mitigation: 1,
    defenseMod: 0,
    enduranceCostMod: 1.1,
  },
  {
    id: 'APL',
    code: 'APL',
    name: 'Padded Leather',
    weight: 4,
    mitigation: 2,
    defenseMod: 1,
    enduranceCostMod: 1.2,
  },
  {
    id: 'ARM',
    code: 'ARM',
    name: 'Ringmail',
    weight: 6,
    mitigation: 4,
    defenseMod: 1,
    enduranceCostMod: 1.4,
  },
  {
    id: 'ASM',
    code: 'ASM',
    name: 'Scalemail',
    weight: 8,
    mitigation: 5,
    defenseMod: 2,
    enduranceCostMod: 1.6,
  },
  {
    id: 'ACM',
    code: 'ACM',
    name: 'Chainmail',
    weight: 10,
    mitigation: 6,
    defenseMod: 2,
    enduranceCostMod: 1.8,
  },
  {
    id: 'APM',
    code: 'APM',
    name: 'Platemail',
    weight: 12,
    mitigation: 8,
    defenseMod: 3,
    enduranceCostMod: 2.0,
    restrictedStyles: [FightingStyle.AimedBlow, FightingStyle.LungingAttack],
  },
  {
    id: 'APA',
    code: 'APA',
    name: 'Plate Armor',
    weight: 14,
    mitigation: 10,
    defenseMod: 3,
    enduranceCostMod: 2.5,
    restrictedStyles: [
      FightingStyle.AimedBlow,
      FightingStyle.LungingAttack,
      FightingStyle.SlashingAttack,
    ],
  },
];

describe('armor canon table (V24-F3)', () => {
  it('has exactly 8 rows — the 7 canon tiers plus none_armor (no studded tier, no APA-F)', () => {
    expect(ARMORS).toHaveLength(8);
    expect(ARMORS.some((a) => a.code === 'APA-F' || a.id === 'APA-F')).toBe(false);
    expect(ARMORS.some((a) => a.code === 'ASH' || a.id === 'ASH')).toBe(false);
    expect(ARMORS.some((a) => a.code === 'AS' || a.id === 'AS')).toBe(false);
    expect(ARMORS.some((a) => a.id === 'studded_leather')).toBe(false);
  });

  it.each(CANON_ROWS)('$id — canon id/code/name + pinned stats', (pin) => {
    const row = ARMORS.find((a) => a.id === pin.id) as EquipmentItem | undefined;
    expect(row, `armor row ${pin.id}`).toBeDefined();
    expect(row!.code).toBe(pin.code);
    expect(row!.name).toBe(pin.name);
    expect(row!.slot).toBe('armor');
    expect(row!.weight).toBe(pin.weight);
    expect(row!.mitigation).toBe(pin.mitigation);
    expect(row!.defenseMod).toBe(pin.defenseMod);
    expect(row!.enduranceCostMod).toBe(pin.enduranceCostMod);
    expect(row!.restrictedStyles ?? []).toEqual(pin.restrictedStyles ?? []);
  });

  it('canon armor ids equal their codes', () => {
    for (const row of ARMORS.filter((a) => a.id !== 'none_armor')) {
      expect(row.id).toBe(row.code);
    }
  });

  it('weights strictly increase down the canon table', () => {
    const weights = ARMORS.map((a) => a.weight);
    expect(weights).toEqual([...weights].sort((x, y) => x - y));
  });

  it('getItemById resolves canon ids', () => {
    expect(getItemById('APM')?.name).toBe('Platemail');
    expect(getItemById('APA')?.name).toBe('Plate Armor');
    expect(getItemById('ALE')?.name).toBe('Leather');
    expect(getItemById('APL')?.name).toBe('Padded Leather');
  });

  it('getItemByCode resolves canon codes', () => {
    expect(getItemByCode('ARM')?.name).toBe('Ringmail');
    expect(getItemByCode('ASM')?.name).toBe('Scalemail');
    expect(getItemByCode('ACM')?.name).toBe('Chainmail');
  });

  it('default loadouts use the canon APL id', () => {
    expect(DEFAULT_LOADOUT.armor).toBe('APL');
    expect(getStyleDefaultLoadout(FightingStyle.StrikingAttack).armor).toBe('APL');
  });

  it.each(['ALE', 'APL', 'ARM', 'ASM', 'ACM', 'APM', 'APA'])(
    'protectCovers(%s) still covers chest + abdomen',
    (id) => {
      expect(protectCovers(id)).toEqual(['chest', 'abdomen']);
    }
  );
});
