import { describe, it, expect } from 'vitest';
import { getAvailableItems } from '@/data/equipment';
import { FightingStyle } from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);

describe('getAvailableItems — shield pool', () => {
  it('shield pool includes none_shield for all styles', () => {
    for (const style of ALL_STYLES) {
      const pool = getAvailableItems('shield', style);
      expect(
        pool.some((s) => s.id === 'none_shield'),
        `none_shield missing for ${style}`
      ).toBe(true);
    }
  });

  it('shield pool includes small_shield for all styles', () => {
    for (const style of ALL_STYLES) {
      const pool = getAvailableItems('shield', style);
      expect(
        pool.some((s) => s.id === 'small_shield'),
        `small_shield missing for ${style}`
      ).toBe(true);
    }
  });

  it('shield pool excludes medium_shield for AimedBlow', () => {
    const pool = getAvailableItems('shield', FightingStyle.AimedBlow);
    expect(pool.some((s) => s.id === 'medium_shield')).toBe(false);
  });

  it('shield pool excludes large_shield for AimedBlow, LungingAttack, SlashingAttack', () => {
    const restricted = [
      FightingStyle.AimedBlow,
      FightingStyle.LungingAttack,
      FightingStyle.SlashingAttack,
    ];
    for (const style of restricted) {
      const pool = getAvailableItems('shield', style);
      expect(
        pool.some((s) => s.id === 'large_shield'),
        `large_shield should be excluded for ${style}`
      ).toBe(false);
    }
  });

  it('shield pool includes medium_shield for non-restricted styles', () => {
    const nonRestricted = [
      FightingStyle.TotalParry,
      FightingStyle.ParryRiposte,
      FightingStyle.WallOfSteel,
    ];
    for (const style of nonRestricted) {
      const pool = getAvailableItems('shield', style);
      expect(
        pool.some((s) => s.id === 'medium_shield'),
        `medium_shield missing for ${style}`
      ).toBe(true);
    }
  });

  it('shield pool includes large_shield for non-restricted styles', () => {
    const nonRestricted = [
      FightingStyle.TotalParry,
      FightingStyle.WallOfSteel,
      FightingStyle.ParryStrike,
    ];
    for (const style of nonRestricted) {
      const pool = getAvailableItems('shield', style);
      expect(
        pool.some((s) => s.id === 'large_shield'),
        `large_shield missing for ${style}`
      ).toBe(true);
    }
  });

  it('weapon pool is unchanged — no duplicates', () => {
    for (const style of ALL_STYLES) {
      const pool = getAvailableItems('weapon', style);
      const ids = pool.map((w) => w.id);
      const unique = new Set(ids);
      expect(unique.size, `duplicate weapon ids for ${style}`).toBe(ids.length);
    }
  });
});
