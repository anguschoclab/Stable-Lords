import { describe, it, expect } from 'vitest';
import '@/test/_setup/setup';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import { FightingStyle } from '@/types/shared.types';

describe('balance constant bounds', () => {
  it('BANKRUPTCY_THRESHOLD is a negative number', () => {
    expect(BANKRUPTCY_THRESHOLD).toBeDefined();
    expect(typeof BANKRUPTCY_THRESHOLD).toBe('number');
    expect(BANKRUPTCY_THRESHOLD).toBeLessThan(0);
  });

  it('all FightingStyle enum values are valid strings', () => {
    const styles = Object.values(FightingStyle);
    expect(styles.length).toBeGreaterThan(0);
    for (const style of styles) {
      expect(typeof style).toBe('string');
      expect(style.length).toBeGreaterThan(0);
    }
  });

  it('no FightingStyle value is empty or whitespace-only', () => {
    const styles = Object.values(FightingStyle);
    for (const style of styles) {
      expect(style.trim().length).toBeGreaterThan(0);
    }
  });

  it('FightingStyle enum has no duplicate values', () => {
    const styles = Object.values(FightingStyle);
    const unique = new Set(styles);
    expect(unique.size).toBe(styles.length);
  });
});
