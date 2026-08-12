/**
 * Shield data-driven modifier lookup tests.
 * Verifies the extracted getShieldModifiers function matches the hardcoded
 * getShieldBonus values and handles dual-slot scenarios.
 */
import { describe, it, expect } from 'vitest';
import { getShieldModifiers } from '@/data/equipment/equipment.utils';

describe('getShieldModifiers', () => {
  it('small_shield returns def=1, att=0', () => {
    expect(getShieldModifiers('small_shield')).toEqual({ def: 1, att: 0 });
  });

  it('medium_shield returns def=2, att=0', () => {
    expect(getShieldModifiers('medium_shield')).toEqual({ def: 2, att: 0 });
  });

  it('large_shield returns def=3, att=-1', () => {
    expect(getShieldModifiers('large_shield')).toEqual({ def: 3, att: -1 });
  });

  it('non-shield id returns def=0, att=0', () => {
    expect(getShieldModifiers('broadsword')).toEqual({ def: 0, att: 0 });
  });

  it('none_shield returns def=0, att=0', () => {
    expect(getShieldModifiers('none_shield')).toEqual({ def: 0, att: 0 });
  });

  it('undefined id returns def=0, att=0', () => {
    expect(getShieldModifiers(undefined)).toEqual({ def: 0, att: 0 });
  });

  it('unknown id returns def=0, att=0', () => {
    expect(getShieldModifiers('unknown_shield')).toEqual({ def: 0, att: 0 });
  });

  // Dual-slot: shield in weapon slot AND a different shield in shield slot
  it('dual-slot: small_shield in weapon + medium_shield in shield → def=3, att=0', () => {
    const w = getShieldModifiers('small_shield');
    const s = getShieldModifiers('medium_shield');
    expect(w.def + s.def).toBe(3);
    expect(w.att + s.att).toBe(0);
  });

  it('dual-slot: large_shield in weapon + small_shield in shield → def=4, att=-1', () => {
    const w = getShieldModifiers('large_shield');
    const s = getShieldModifiers('small_shield');
    expect(w.def + s.def).toBe(4);
    expect(w.att + s.att).toBe(-1);
  });

  it('dual-slot: medium_shield in both slots → def=4, att=0', () => {
    const w = getShieldModifiers('medium_shield');
    const s = getShieldModifiers('medium_shield');
    expect(w.def + s.def).toBe(4);
    expect(w.att + s.att).toBe(0);
  });
});
