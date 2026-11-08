/**
 * V25 — archetype-aware armor fitting: tanks take the heaviest legal
 * armor their carry allows; hybrids never land OVER encumbrance; every
 * pick honors the armor's per-style restrictedStyles list.
 */
import { describe, it, expect } from 'vitest';
import { fitArchetypeArmor } from '@/engine/equipment/archetypeArmor';
import { getAvailableItems, getItemById } from '@/data/equipment';
import { getEncumbranceRatio, getEncumbranceTier } from '@/data/equipment/encumbrance';
import { computeEncumbranceCapacity } from '@/data/terrabloodCharts';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';

const attrs = (over: Partial<Attributes> = {}): Attributes => ({
  ST: 10,
  CN: 10,
  SZ: 10,
  WT: 10,
  WL: 10,
  SP: 10,
  DF: 10,
  ...over,
});

describe('fitArchetypeArmor — canon armor doctrine', () => {
  it('a tank frame gets plate-class armor (APA/F norm)', () => {
    const pick = fitArchetypeArmor(
      FightingStyle.TotalParry,
      attrs({ ST: 16, CN: 16, SZ: 5, WT: 9, WL: 19, SP: 3, DF: 11 })
    );
    expect(['plate_armor', 'plate_mail', 'chain_mail']).toContain(pick);
  });

  it('the pick is always legal for the style — AB never wears plate', () => {
    const pick = fitArchetypeArmor(
      FightingStyle.AimedBlow,
      attrs({ ST: 15, CN: 14, WT: 17, WL: 9, DF: 17, SZ: 6, SP: 5 })
    );
    const legal = getAvailableItems('armor', FightingStyle.AimedBlow).some((i) => i.id === pick);
    expect(legal).toBe(true);
    expect(['plate_armor', 'plate_mail']).not.toContain(pick);
  });

  it('a weak frame never lands OVER encumbrance from the armor pick', () => {
    const a = attrs({ ST: 7, CN: 7, SZ: 4, WT: 17, WL: 13, DF: 15 });
    const pick = fitArchetypeArmor(FightingStyle.ParryRiposte, a);
    const armorWeight = getItemById(pick)?.weight ?? 0;
    // Worst-case: armor + a mid weapon + helm must stay under capacity.
    const ratio = getEncumbranceRatio(
      { weapon: 'broadsword', armor: pick, shield: 'none_shield', helm: 'leather_cap' },
      computeEncumbranceCapacity(a.ST, a.CN)
    );
    expect(armorWeight).toBeLessThanOrEqual(8);
    expect(getEncumbranceTier(ratio)).not.toBe('OVER');
  });

  it('tank-fit high-carry frames prefer heavier armor than fragile frames', () => {
    const heavy = fitArchetypeArmor(
      FightingStyle.BashingAttack,
      attrs({ ST: 17, CN: 17, WT: 9, WL: 15, SZ: 9 })
    );
    const light = fitArchetypeArmor(
      FightingStyle.BashingAttack,
      attrs({ ST: 8, CN: 8, WT: 17, WL: 15, SZ: 9 })
    );
    expect(getItemById(heavy)!.weight).toBeGreaterThan(getItemById(light)!.weight);
  });
});
