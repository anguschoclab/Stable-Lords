/**
 * V23 / D1 — loadout legality: exactly three states are legal —
 *   (a) one weapon, (b) one weapon + shield, (c) two weapons.
 * An off-hand weapon paired with a shield is illegal (DUAL_WITH_SHIELD),
 * as is an off-hand paired with a two-handed primary.
 */
import { describe, it, expect } from 'vitest';
import { validateLoadout, getLoadoutWeight } from '@/data/equipment/equipment.utils';
import type { EquipmentLoadout } from '@/data/equipment';

const legal = (over: Partial<EquipmentLoadout> = {}): EquipmentLoadout => ({
  weapon: 'broadsword',
  armor: 'leather',
  shield: 'none_shield',
  helm: 'leather_cap',
  ...over,
});

describe('validateLoadout — three legal states', () => {
  it('one weapon passes', () => {
    expect(validateLoadout(legal())).toEqual([]);
  });

  it('weapon + shield passes', () => {
    expect(validateLoadout(legal({ shield: 'medium_shield' }))).toEqual([]);
  });

  it('two weapons passes — off-hand with no shield', () => {
    expect(validateLoadout(legal({ offhand: 'dagger' }))).toEqual([]);
  });
});

describe('validateLoadout — illegal combinations', () => {
  it('off-hand + shield is rejected with DUAL_WITH_SHIELD', () => {
    const issues = validateLoadout(
      legal({ offhand: 'dagger', shield: 'medium_shield' })
    );
    expect(issues.some((i) => i.code === 'DUAL_WITH_SHIELD')).toBe(true);
  });

  it('two-handed primary + off-hand is rejected (no hand free)', () => {
    const issues = validateLoadout(legal({ weapon: 'maul', offhand: 'dagger' }));
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('getLoadoutWeight — off-hand counts, backup does not', () => {
  it('a wielded off-hand weapon adds its weight', () => {
    const single = getLoadoutWeight(legal());
    const dual = getLoadoutWeight(legal({ offhand: 'dagger' }));
    expect(dual).toBeGreaterThan(single);
  });

  it('the sheathed backup stays uncounted (house rule)', () => {
    const plain = getLoadoutWeight(legal());
    const withBackup = getLoadoutWeight(legal({ backup: 'dagger' }));
    expect(withBackup).toBe(plain);
  });
});
