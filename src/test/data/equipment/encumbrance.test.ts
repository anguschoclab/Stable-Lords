/**
 * Encumbrance tier system tests.
 * Replaces the binary over-encumbrance check with a 5-tier graduated system.
 * Tiers: NONE, LIGHT, MEDIUM, HEAVY, OVER
 *
 * Boundaries:
 *   ratio < 0.60  → NONE
 *   0.60 ≤ ratio < 0.80 → LIGHT
 *   0.80 ≤ ratio < 1.00 → MEDIUM
 *   1.00 ≤ ratio < 1.20 → HEAVY
 *   ratio ≥ 1.20          → OVER
 */
import { describe, it, expect } from 'vitest';
import {
  getEncumbranceRatio,
  getEncumbranceTier,
  getEncumbrancePenalties,
  type EncumbranceTier,
} from '@/data/equipment/encumbrance';
import type { EquipmentLoadout } from '@/data/equipment';

const baseLoadout: EquipmentLoadout = {
  weapon: 'broadsword',
  armor: 'none_armor',
  shield: 'none_shield',
  helm: 'none_helm',
};

// broadsword weight = 4, so baseLoadout weight = 4

describe('getEncumbranceRatio', () => {
  it('returns 0 for zero-weight loadout', () => {
    const zero: EquipmentLoadout = {
      weapon: 'fist',
      armor: 'none_armor',
      shield: 'none_shield',
      helm: 'none_helm',
    };
    expect(getEncumbranceRatio(zero, 10)).toBe(0);
  });

  it('returns weight/carryCap ratio', () => {
    // broadsword weight=4, carryCap=10 → 0.4
    expect(getEncumbranceRatio(baseLoadout, 10)).toBeCloseTo(0.4, 5);
  });

  it('handles carryCap of 0 gracefully (returns Infinity)', () => {
    expect(getEncumbranceRatio(baseLoadout, 0)).toBe(Infinity);
  });
});

describe('getEncumbranceTier boundary tests', () => {
  // Helper: create a loadout with a specific weight by using armor items
  // We'll use the ratio directly via a mock approach — test the function
  // with exact ratio values by constructing loadouts with known weights.

  // Using broadsword (weight 4) as weapon, we can adjust carryCap to hit exact ratios.
  // weight=4, carryCap=X → ratio = 4/X
  // For ratio 0.60: X = 4/0.60 = 6.666...
  // Instead, we'll test getEncumbranceTier directly with ratio values.

  it('ratio 0.599 → NONE', () => {
    expect(getEncumbranceTier(0.599)).toBe('NONE' as EncumbranceTier);
  });

  it('ratio 0.60 → LIGHT', () => {
    expect(getEncumbranceTier(0.6)).toBe('LIGHT' as EncumbranceTier);
  });

  it('ratio 0.799 → LIGHT', () => {
    expect(getEncumbranceTier(0.799)).toBe('LIGHT' as EncumbranceTier);
  });

  it('ratio 0.80 → MEDIUM', () => {
    expect(getEncumbranceTier(0.8)).toBe('MEDIUM' as EncumbranceTier);
  });

  it('ratio 0.999 → MEDIUM', () => {
    expect(getEncumbranceTier(0.999)).toBe('MEDIUM' as EncumbranceTier);
  });

  it('ratio 1.00 → HEAVY', () => {
    expect(getEncumbranceTier(1.0)).toBe('HEAVY' as EncumbranceTier);
  });

  it('ratio 1.199 → HEAVY', () => {
    expect(getEncumbranceTier(1.199)).toBe('HEAVY' as EncumbranceTier);
  });

  it('ratio 1.20 → OVER', () => {
    expect(getEncumbranceTier(1.2)).toBe('OVER' as EncumbranceTier);
  });

  it('ratio 0 → NONE', () => {
    expect(getEncumbranceTier(0)).toBe('NONE' as EncumbranceTier);
  });

  it('ratio 2.0 → OVER', () => {
    expect(getEncumbranceTier(2.0)).toBe('OVER' as EncumbranceTier);
  });
});

describe('getEncumbrancePenalties', () => {
  it('NONE tier: no penalties', () => {
    const p = getEncumbrancePenalties('NONE' as EncumbranceTier);
    expect(p.iniPenalty).toBe(0);
    expect(p.defPenalty).toBe(0);
    expect(p.parPenalty).toBe(0);
    expect(p.enduranceMult).toBe(1.0);
  });

  it('LIGHT tier: small INI penalty, no DEF/PAR penalty', () => {
    const p = getEncumbrancePenalties('LIGHT' as EncumbranceTier);
    expect(p.iniPenalty).toBeLessThan(0);
    expect(p.defPenalty).toBe(0);
    expect(p.parPenalty).toBe(0);
    expect(p.enduranceMult).toBeGreaterThan(1.0);
    expect(p.enduranceMult).toBeLessThanOrEqual(1.1);
  });

  it('MEDIUM tier: INI + DEF penalty, small endurance mult', () => {
    const p = getEncumbrancePenalties('MEDIUM' as EncumbranceTier);
    expect(p.iniPenalty).toBeLessThan(0);
    expect(p.defPenalty).toBeLessThan(0);
    expect(p.parPenalty).toBe(0);
    expect(p.enduranceMult).toBeGreaterThan(1.0);
    expect(p.enduranceMult).toBeLessThanOrEqual(1.2);
  });

  it('HEAVY tier: INI + DEF + PAR penalty, higher endurance mult', () => {
    const p = getEncumbrancePenalties('HEAVY' as EncumbranceTier);
    expect(p.iniPenalty).toBeLessThan(0);
    expect(p.defPenalty).toBeLessThan(0);
    expect(p.parPenalty).toBeLessThan(0);
    expect(p.enduranceMult).toBeGreaterThan(1.1);
    expect(p.enduranceMult).toBeLessThanOrEqual(1.4);
  });

  it('OVER tier: largest penalties', () => {
    const p = getEncumbrancePenalties('OVER' as EncumbranceTier);
    expect(p.iniPenalty).toBeLessThanOrEqual(-3);
    expect(p.defPenalty).toBeLessThan(0);
    expect(p.parPenalty).toBeLessThan(0);
    expect(p.enduranceMult).toBeGreaterThan(1.3);
  });

  it('penalties are monotonically increasing in severity', () => {
    const tiers: EncumbranceTier[] = ['NONE', 'LIGHT', 'MEDIUM', 'HEAVY', 'OVER'];
    for (let i = 1; i < tiers.length; i++) {
      const prev = getEncumbrancePenalties(tiers[i - 1]!);
      const curr = getEncumbrancePenalties(tiers[i]!);
      expect(curr.iniPenalty).toBeLessThanOrEqual(prev.iniPenalty);
      expect(curr.enduranceMult).toBeGreaterThanOrEqual(prev.enduranceMult);
    }
  });
});

// ─── Call-site shape tests ────────────────────────────────────────────────────
// The 2 real isOverEncumbered call sites are:
// 1. fighterState.ts:86 — uses overweight for iniPenalty and enduranceMult
// 2. EquipmentLoadout.tsx:47 — uses overEncumbered for UI display
// These tests verify the new tier-aware functions can replace the old binary check.

describe('isOverEncumbered replacement shapes', () => {
  it('getEncumbranceTier returns OVER when ratio >= 1.20 (replaces isOverEncumbered true)', () => {
    // Old: isOverEncumbered(loadout, carryCap) = weight > carryCap
    // New: getEncumbranceTier returns 'OVER' when ratio >= 1.20
    // The old check was ratio > 1.0, new HEAVY tier covers 1.0-1.2
    expect(getEncumbranceTier(1.3)).toBe('OVER' as EncumbranceTier);
  });

  it('getEncumbrancePenalties for HEAVY includes iniPenalty and enduranceMult (replaces old overweight fields)', () => {
    const heavy = getEncumbrancePenalties('HEAVY' as EncumbranceTier);
    // Old code: encumbranceIniPenalty = -2, encumbranceEndMult = 1.2
    // New HEAVY tier should have at least as much penalty
    expect(heavy.iniPenalty).toBeLessThanOrEqual(-2);
    expect(heavy.enduranceMult).toBeGreaterThanOrEqual(1.2);
  });
});
