/**
 * V23 canon — Sir Jessie Jest, "Effects of Coordination" (Arena 93).
 *
 * Tier boundaries (canon): SP+DF ≤16 Clumsy; 17–20 Slightly Uncoordinated;
 * 21–27 Normal; 28–31 Highly Coordinated; 32–39 Very Highly Coordinated;
 * 40+ Marvel of Fighting Coordination.
 *
 * Clumsy effects (canon): drops weapons more often, fumbles the backup
 * draw, slower to rise after a knockdown. V23 also adds a small
 * knockdown-susceptibility term (house-approved speculative extension).
 */
import { describe, it, expect } from 'vitest';
import { computeCoordination } from '@/data/terrabloodCharts';
import { rollDisarmChance } from '@/engine/combat/resolution/disarm';
import {
  COORD_DISARM_MOD,
  COORD_RISE_FAIL_CHANCE,
  COORD_KD_SUSCEPT,
  QUICKDRAW_FUMBLE_CHANCE,
} from '@/constants/combat';
import { makeFighterState } from '@/test/_fixtures/factories';

describe('computeCoordination — canon tier boundaries', () => {
  it('SP+DF of exactly 16 is Clumsy (canon: 6–16), not Slightly', () => {
    expect(computeCoordination(8, 8)).toBe('Clumsy');
    expect(computeCoordination(10, 6)).toBe('Clumsy');
  });

  it('SP+DF 17–20 is Slightly Uncoordinated', () => {
    expect(computeCoordination(9, 8)).toBe('Slightly Uncoordinated');
    expect(computeCoordination(10, 10)).toBe('Slightly Uncoordinated');
  });

  it('SP+DF 21–27 is Normal', () => {
    expect(computeCoordination(11, 10)).toBe('Normal');
    expect(computeCoordination(14, 13)).toBe('Normal');
  });

  it('SP+DF 28–31 is Highly Coordinated; 32+ is Very Highly Coordinated', () => {
    expect(computeCoordination(14, 14)).toBe('Highly Coordinated');
    expect(computeCoordination(16, 15)).toBe('Highly Coordinated');
    expect(computeCoordination(16, 16)).toBe('Very Highly Coordinated');
  });

  it('SP+DF 40+ is a Marvel of Fighting Coordination', () => {
    expect(computeCoordination(20, 20)).toBe('Marvel of Fighting Coordination');
  });
});

describe('coordination → disarm susceptibility (canon: clumsy drops more)', () => {
  it('a Clumsy fighter is easier to disarm than a Normal one, all else equal', () => {
    const base = { armHits: 2, damageRatio: 0.2, isCrit: false };
    const clumsy = rollDisarmChance({ ...base, coordination: 'Clumsy' });
    const normal = rollDisarmChance({ ...base, coordination: 'Normal' });
    expect(clumsy).toBeCloseTo(normal + (COORD_DISARM_MOD['Clumsy'] ?? 0));
    expect(clumsy).toBeGreaterThan(normal);
  });

  it('a Slightly Uncoordinated fighter sits between Clumsy and Normal', () => {
    const base = { armHits: 1, damageRatio: 0.1, isCrit: false };
    const slight = rollDisarmChance({ ...base, coordination: 'Slightly Uncoordinated' });
    const normal = rollDisarmChance({ ...base, coordination: 'Normal' });
    expect(slight).toBeGreaterThan(normal);
    expect(slight).toBeLessThan(
      rollDisarmChance({ ...base, coordination: 'Clumsy' })
    );
  });

  it('VHC fighters get no clumsy penalty', () => {
    const base = { armHits: 2, damageRatio: 0.2, isCrit: false };
    expect(
      rollDisarmChance({ ...base, coordination: 'Very Highly Coordinated' })
    ).toBe(rollDisarmChance({ ...base, coordination: 'Normal' }));
  });
});

describe('coordination → rise/fumble susceptibility tables (canon)', () => {
  it('clumsy ratings carry a rise-fail chance; coordinated ratings do not', () => {
    expect(COORD_RISE_FAIL_CHANCE['Clumsy']).toBeGreaterThan(0);
    expect(COORD_RISE_FAIL_CHANCE['Slightly Uncoordinated']).toBeGreaterThan(0);
    expect(COORD_RISE_FAIL_CHANCE['Normal'] ?? 0).toBe(0);
    expect(COORD_RISE_FAIL_CHANCE['Very Highly Coordinated'] ?? 0).toBe(0);
  });

  it('clumsy ratings carry a quickdraw fumble chance', () => {
    expect(QUICKDRAW_FUMBLE_CHANCE['Clumsy']).toBeGreaterThan(0);
    expect(QUICKDRAW_FUMBLE_CHANCE['Normal'] ?? 0).toBe(0);
  });

  it('the small KD-susceptibility term exists only for clumsy ratings', () => {
    expect(COORD_KD_SUSCEPT['Clumsy']).toBeGreaterThan(0);
    expect(COORD_KD_SUSCEPT['Clumsy']).toBeLessThanOrEqual(0.1); // stays small
    expect(COORD_KD_SUSCEPT['Normal'] ?? 0).toBe(0);
  });
});

describe('coordination baked onto FighterState at build', () => {
  it('FighterState accepts a coordination rating (wired by fighterState.ts)', () => {
    const f = makeFighterState({ coordination: 'Clumsy' });
    expect(f.coordination).toBe('Clumsy');
  });
});
