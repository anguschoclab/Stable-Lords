/**
 * V23 guard — ratchets the new canon constants and adjudicated data so a
 * later pass can't silently drift the table. Mirrors the V22 guard style:
 * assert the LOCKED values, not "a value exists".
 */
import { describe, it, expect } from 'vitest';
import {
  LUCKFACTOR_RANGE,
  COORD_DISARM_MOD,
  COORD_RISE_FAIL_CHANCE,
  COORD_KD_SUSCEPT,
  QUICKDRAW_FUMBLE_CHANCE,
  JUMP_OE_COEFF,
  JUMP_DISPARITY,
  JUMP_CLASH_MAX,
  AMBI_PRIMARY_RIGHT_BIAS,
  AMBI_REVERSED_CHANCE,
  DUAL_VHC_SUM_MIN,
  DUAL_VHC_STAT_MIN,
} from '@/constants/combat';
import { STYLE_DESIGN_MINIMUMS, DA_WL_FLOOR, DA_ST_FLOOR } from '@/data/designDoctrine';
import { FightingStyle } from '@/types/shared.types';

describe('V23 canon knobs — locked values', () => {
  it('luckfactor is a single shared constant (±4, all styles)', () => {
    expect(LUCKFACTOR_RANGE).toBe(4);
  });

  it('coordination effect tables only key clumsy tiers', () => {
    const clumsyKeys = new Set(['Clumsy', 'Slightly Uncoordinated']);
    for (const table of [
      COORD_DISARM_MOD,
      COORD_RISE_FAIL_CHANCE,
      COORD_KD_SUSCEPT,
      QUICKDRAW_FUMBLE_CHANCE,
    ]) {
      for (const k of Object.keys(table)) {
        expect(clumsyKeys.has(k), `unexpected tier key ${k}`).toBe(true);
      }
    }
    // The small speculative KD-suscept term stays small.
    expect(COORD_KD_SUSCEPT['Clumsy']).toBeLessThanOrEqual(0.1);
  });

  it('jump knobs: OE coefficient, disparity floor, bounded clash loop', () => {
    expect(JUMP_OE_COEFF).toBeGreaterThan(0);
    expect(JUMP_DISPARITY).toBeGreaterThan(0);
    expect(JUMP_CLASH_MAX).toBeGreaterThanOrEqual(1);
    expect(JUMP_CLASH_MAX).toBeLessThanOrEqual(6);
  });

  it('dual-wield VHC gate matches canon (SP+DF > 31, both > 14)', () => {
    expect(DUAL_VHC_SUM_MIN).toBe(32);
    expect(DUAL_VHC_STAT_MIN).toBe(15);
    expect(AMBI_PRIMARY_RIGHT_BIAS).toBeGreaterThan(0.5);
    expect(AMBI_PRIMARY_RIGHT_BIAS).toBeLessThan(1);
    expect(AMBI_REVERSED_CHANCE).toBeGreaterThan(0);
    expect(AMBI_REVERSED_CHANCE).toBeLessThan(0.5);
  });

  it('design minimums cover all ten styles; DA floors pinned', () => {
    expect(Object.keys(STYLE_DESIGN_MINIMUMS)).toHaveLength(
      Object.values(FightingStyle).length
    );
    expect(DA_WL_FLOOR).toBe(7);
    expect(DA_ST_FLOOR).toBe(7);
  });
});
