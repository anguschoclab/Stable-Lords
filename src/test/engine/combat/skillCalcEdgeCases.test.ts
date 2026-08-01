import { describe, it, expect } from 'vitest';
import { computeBaseSkills, computeHP, computeEndurance, computeDamage, computeDerivedStats } from '@/engine/skillCalc';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';

const zeroAttrs: Attributes = { ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 };
const maxAttrs: Attributes = { ST: 30, CN: 30, SZ: 30, WT: 30, WL: 30, SP: 30, DF: 30 };
const midAttrs: Attributes = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };

describe('skillCalcEdgeCases', () => {
  it('skill calc with 0 attributes does not produce NaN', () => {
    const skills = computeBaseSkills(zeroAttrs, FightingStyle.StrikingAttack);
    for (const key of Object.keys(skills) as (keyof typeof skills)[]) {
      expect(Number.isNaN(skills[key]), `${key} is NaN with 0 attributes`).toBe(false);
      expect(skills[key], `${key} should be clamped to >= 1`).toBeGreaterThanOrEqual(1);
    }
  });

  it('skill calc with max attributes does not overflow', () => {
    const skills = computeBaseSkills(maxAttrs, FightingStyle.StrikingAttack);
    for (const key of Object.keys(skills) as (keyof typeof skills)[]) {
      expect(Number.isNaN(skills[key]), `${key} is NaN with max attributes`).toBe(false);
      expect(skills[key], `${key} should be clamped to <= 20`).toBeLessThanOrEqual(20);
    }
  });

  it('floor/ceil consistency across all skill calculations', () => {
    // All skills should be integers (no floating point)
    const skills = computeBaseSkills(midAttrs, FightingStyle.TotalParry);
    for (const key of Object.keys(skills) as (keyof typeof skills)[]) {
      expect(Number.isInteger(skills[key]), `${key} should be an integer, got ${skills[key]}`).toBe(true);
    }
  });

  it('derived stats with 0 attributes do not produce NaN', () => {
    const derived = computeDerivedStats(zeroAttrs);
    expect(Number.isNaN(derived.hp)).toBe(false);
    expect(Number.isNaN(derived.endurance)).toBe(false);
    expect(Number.isNaN(derived.damage)).toBe(false);
    expect(Number.isNaN(derived.encumbrance)).toBe(false);
  });

  it('derived stats with max attributes do not produce Infinity', () => {
    const derived = computeDerivedStats(maxAttrs);
    expect(Number.isFinite(derived.hp)).toBe(true);
    expect(Number.isFinite(derived.endurance)).toBe(true);
    expect(Number.isFinite(derived.damage)).toBe(true);
    expect(Number.isFinite(derived.encumbrance)).toBe(true);
  });

  it('HP is always positive even with 0 attributes', () => {
    const hp = computeHP(zeroAttrs);
    expect(hp).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(hp)).toBe(false);
  });

  it('endurance is always finite', () => {
    const end = computeEndurance(zeroAttrs);
    expect(Number.isFinite(end)).toBe(true);
  });

  it('damage is always finite', () => {
    const dmg = computeDamage(zeroAttrs);
    expect(Number.isFinite(dmg)).toBe(true);
  });
});
