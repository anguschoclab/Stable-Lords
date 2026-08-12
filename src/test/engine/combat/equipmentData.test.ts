/**
 * Equipment data tests for armor and helm mitigation/defense/endurance fields.
 * These fields drive flat damage mitigation, DEF skill bonuses, and endurance
 * drain modifiers in the combat pipeline.
 */
import { describe, it, expect } from 'vitest';
import { ARMORS } from '@/data/equipment/armor';
import { HELMS } from '@/data/equipment/helms';
import { getItemById } from '@/data/equipment/equipment.utils';

// ─── Armor mitigation / defenseMod / enduranceCostMod ─────────────────────────

describe('Armor data fields', () => {
  it('every non-none armor defines mitigation as a non-negative number', () => {
    for (const armor of ARMORS) {
      if (armor.id === 'none_armor') continue;
      expect(armor.mitigation, `${armor.id}: missing mitigation`).toBeDefined();
      expect(typeof armor.mitigation).toBe('number');
      expect(armor.mitigation!).toBeGreaterThanOrEqual(0);
      expect(armor.mitigation!).toBeLessThanOrEqual(10);
    }
  });

  it('none_armor has mitigation=0', () => {
    const none = getItemById('none_armor');
    expect(none).toBeDefined();
    expect(none!.mitigation).toBe(0);
  });

  it('every non-none armor defines defenseMod as a non-negative number', () => {
    for (const armor of ARMORS) {
      if (armor.id === 'none_armor') continue;
      expect(armor.defenseMod, `${armor.id}: missing defenseMod`).toBeDefined();
      expect(typeof armor.defenseMod).toBe('number');
      expect(armor.defenseMod!).toBeGreaterThanOrEqual(0);
      expect(armor.defenseMod!).toBeLessThanOrEqual(5);
    }
  });

  it('none_armor has defenseMod=0', () => {
    const none = getItemById('none_armor');
    expect(none).toBeDefined();
    expect(none!.defenseMod).toBe(0);
  });

  it('every non-none armor defines enduranceCostMod as a number >= 1.0', () => {
    for (const armor of ARMORS) {
      if (armor.id === 'none_armor') continue;
      expect(armor.enduranceCostMod, `${armor.id}: missing enduranceCostMod`).toBeDefined();
      expect(typeof armor.enduranceCostMod).toBe('number');
      expect(armor.enduranceCostMod!).toBeGreaterThanOrEqual(1.0);
      expect(armor.enduranceCostMod!).toBeLessThanOrEqual(3.0);
    }
  });

  it('none_armor has enduranceCostMod=1.0', () => {
    const none = getItemById('none_armor');
    expect(none).toBeDefined();
    expect(none!.enduranceCostMod).toBe(1.0);
  });

  it('heavier armor has >= mitigation than lighter armor', () => {
    const sorted = [...ARMORS].filter((a) => a.id !== 'none_armor').sort((a, b) => a.weight - b.weight);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].mitigation!, `${sorted[i].id} (w=${sorted[i].weight}) should have >= mitigation than ${sorted[i - 1].id} (w=${sorted[i - 1].weight})`).toBeGreaterThanOrEqual(sorted[i - 1].mitigation!);
    }
  });
});

// ─── Helm mitigation / defenseMod / enduranceCostMod ──────────────────────────

describe('Helm data fields', () => {
  it('every non-none helm defines mitigation as a non-negative number', () => {
    for (const helm of HELMS) {
      if (helm.id === 'none_helm') continue;
      expect(helm.mitigation, `${helm.id}: missing mitigation`).toBeDefined();
      expect(typeof helm.mitigation).toBe('number');
      expect(helm.mitigation!).toBeGreaterThanOrEqual(0);
      expect(helm.mitigation!).toBeLessThanOrEqual(5);
    }
  });

  it('none_helm has mitigation=0', () => {
    const none = getItemById('none_helm');
    expect(none).toBeDefined();
    expect(none!.mitigation).toBe(0);
  });

  it('every non-none helm defines defenseMod as a non-negative number', () => {
    for (const helm of HELMS) {
      if (helm.id === 'none_helm') continue;
      expect(helm.defenseMod, `${helm.id}: missing defenseMod`).toBeDefined();
      expect(typeof helm.defenseMod).toBe('number');
      expect(helm.defenseMod!).toBeGreaterThanOrEqual(0);
      expect(helm.defenseMod!).toBeLessThanOrEqual(3);
    }
  });

  it('none_helm has defenseMod=0', () => {
    const none = getItemById('none_helm');
    expect(none).toBeDefined();
    expect(none!.defenseMod).toBe(0);
  });

  it('every non-none helm defines enduranceCostMod as a number >= 1.0', () => {
    for (const helm of HELMS) {
      if (helm.id === 'none_helm') continue;
      expect(helm.enduranceCostMod, `${helm.id}: missing enduranceCostMod`).toBeDefined();
      expect(typeof helm.enduranceCostMod).toBe('number');
      expect(helm.enduranceCostMod!).toBeGreaterThanOrEqual(1.0);
      expect(helm.enduranceCostMod!).toBeLessThanOrEqual(2.0);
    }
  });

  it('none_helm has enduranceCostMod=1.0', () => {
    const none = getItemById('none_helm');
    expect(none).toBeDefined();
    expect(none!.enduranceCostMod).toBe(1.0);
  });

  it('heavier helm has >= mitigation than lighter helm', () => {
    const sorted = [...HELMS].filter((h) => h.id !== 'none_helm').sort((a, b) => a.weight - b.weight);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].mitigation!, `${sorted[i].id} (w=${sorted[i].weight}) should have >= mitigation than ${sorted[i - 1].id} (w=${sorted[i - 1].weight})`).toBeGreaterThanOrEqual(sorted[i - 1].mitigation!);
    }
  });
});
