/**
 * V22 canon derived-stats specs — verified against the live Terrablood
 * charts (fetched 2026): hit-point-chart (n=3650, 100% accuracy) and
 * warrior-endurance-chart (postulated table).
 *
 * Anchors (Chronic Pain, 9-6-18-15-9-10-17): HP 22 → "Cannot take a lot";
 * endurance ST+CN=15 × WL9 → VERY LITTLE.
 */
import { describe, it, expect } from 'vitest';
import {
  computeHP,
  computeEnduranceTier,
  computeEnduranceValue,
  hpRating,
} from '@/data/terrabloodCharts';
import { computeWarriorStats, computeEndurance } from '@/engine/warrior/skillCalc';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/warrior.types';

describe('computeHP — canon CN*2 + SZmod + WLmod (100% accuracy table)', () => {
  it('CN6/SZ18/WL9 → 22 → "Cannot take a lot" (Chronic Pain profile)', () => {
    expect(computeHP(6, 18, 9)).toBe(22);
    expect(hpRating(22)).toBe('Cannot take a lot');
  });

  it('mid warriors land in Average band', () => {
    // CN12*2 + SZ12(+5) + WL12(+2) = 31
    expect(computeHP(12, 12, 12)).toBe(31);
    expect(hpRating(31)).toBe('Average');
  });
});

describe('hpRating — canon punishment bands', () => {
  it.each([
    [10, 'Very frail'],
    [17, 'Very frail'],
    [25, 'Cannot take a lot'],
    [32, 'Average'],
    [40, 'A lot'],
    [50, 'Tremendous'],
    [60, 'Seemingly unaffected'],
  ])('hp %i → %s', (hp, label) => {
    expect(hpRating(hp)).toBe(label);
  });
});

describe('computeEnduranceTier — canon (ST+CN) × WL lookup table', () => {
  it('ST+CN 15 × WL 9 → VERY LITTLE (Chronic Pain)', () => {
    expect(computeEnduranceTier(9, 6, 9)).toBe('L');
  });

  it('ST+CN 20 × WL 10 → POOR', () => {
    expect(computeEnduranceTier(10, 10, 10)).toBe('P');
  });

  it('ST+CN 25 × WL 17 → GOOD', () => {
    expect(computeEnduranceTier(13, 12, 17)).toBe('G');
  });

  it('ST+CN 29 × WL 11 → NORMAL', () => {
    expect(computeEnduranceTier(15, 14, 11)).toBe('N');
  });

  it('ST+CN 36 × WL 17 → GREAT', () => {
    expect(computeEnduranceTier(18, 18, 17)).toBe('R');
  });

  it('ST+CN 33 × WL 21 → TREMENDOUS', () => {
    expect(computeEnduranceTier(17, 16, 21)).toBe('T');
  });

  it('low WL punishes: ST+CN 42 × WL 5 → VERY LITTLE', () => {
    expect(computeEnduranceTier(21, 21, 5)).toBe('L');
  });

  it('low ST+CN punishes: 10 × WL 21 → POOR', () => {
    expect(computeEnduranceTier(5, 5, 21)).toBe('P');
  });

  it('ST+CN 42 × WL 21 → AWESOME (canon table tops out — no Limitless in chart)', () => {
    expect(computeEnduranceTier(20, 22, 21)).toBe('A');
    expect(computeEnduranceTier(25, 25, 25)).toBe('A');
  });

  it('computeEnduranceValue follows the tier', () => {
    expect(computeEnduranceValue(9, 6, 9)).toBe(12);
  });
});

describe('striker endurance pool bonus (canon)', () => {
  const attrs: Attributes = { SZ: 10, ST: 14, CN: 14, WT: 10, WL: 10, SP: 10, DF: 10 };

  it('StrikingAttack gets a deeper endurance pool than the raw chart', () => {
    const raw = computeEndurance(attrs);
    const striker = computeWarriorStats(attrs, FightingStyle.StrikingAttack).derivedStats.endurance;
    expect(striker).toBeGreaterThan(raw);
  });

  it('non-strikers keep the raw chart value', () => {
    const raw = computeEndurance(attrs);
    const wall = computeWarriorStats(attrs, FightingStyle.WallOfSteel).derivedStats.endurance;
    expect(wall).toBe(raw);
  });
});
