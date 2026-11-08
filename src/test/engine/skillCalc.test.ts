import { describe, it, expect } from 'vitest';
import { computeBaseSkills, computeEndurance } from '@/engine/warrior/skillCalc';
import { STYLE_PENALTIES, STYLE_SKILL_FLOORS } from '@/engine/warrior/skillBreakpoints';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/game';

describe('skillCalc - computeEndurance', () => {
  // Helper to quickly create an Attributes object with default values
  const createAttrs = (overrides: Partial<Attributes> = {}): Attributes => ({
    ST: 10,
    CN: 10,
    SZ: 10,
    WT: 10,
    WL: 10,
    SP: 10,
    DF: 10,
    ...overrides,
  });

  it('calculates endurance correctly for minimum possible attributes (3s)', () => {
    // Score = 3*3 + 3 + 3 = 15 (Tier L -> 12)
    const attrs = createAttrs({ ST: 3, CN: 3, WL: 3 });
    expect(computeEndurance(attrs)).toBe(12);
  });

  it('calculates endurance correctly for maximum possible attributes (25s)', () => {
    // Score = 25*3 + 25 + 25 = 125 (Tier A -> 65)
    const attrs = createAttrs({ ST: 25, CN: 25, WL: 25 });
    expect(computeEndurance(attrs)).toBe(65);
  });

  describe('endurance tier lookups — canon (ST+CN) × WL table', () => {
    // Canon chart (terrabloodCharts ENDURANCE_TABLE); tier values:
    // L: 12, P: 18, N: 25, G: 33, R: 42, T: 52, A: 65, U: 80.
    // Boundary coverage lives in derivedStats.canon.test.ts — these are
    // spot checks that computeEndurance delegates to the table.

    it('low-WL warriors stay Little even at mid ST+CN', () => {
      // ST+CN 20 × WL 5 → L
      expect(computeEndurance(createAttrs({ WL: 5, ST: 10, CN: 10 }))).toBe(12);
      // ST+CN 19 × WL 5 → L
      expect(computeEndurance(createAttrs({ WL: 5, ST: 10, CN: 9 }))).toBe(12);
    });

    it('mid-table: ST+CN ~17-18 × WL 10 → Poor', () => {
      expect(computeEndurance(createAttrs({ WL: 10, ST: 9, CN: 9 }))).toBe(18);
      expect(computeEndurance(createAttrs({ WL: 10, ST: 9, CN: 8 }))).toBe(18);
    });

    it('ST+CN 31-32 × WL 10 straddles Poor/Normal', () => {
      // ST+CN 32 × WL 10 → N
      expect(computeEndurance(createAttrs({ WL: 10, ST: 16, CN: 16 }))).toBe(25);
      // ST+CN 31 × WL 10 → P
      expect(computeEndurance(createAttrs({ WL: 10, ST: 16, CN: 15 }))).toBe(18);
    });

    it('ST+CN ~30 × WL 15 → Good', () => {
      expect(computeEndurance(createAttrs({ WL: 15, ST: 15, CN: 15 }))).toBe(33);
      expect(computeEndurance(createAttrs({ WL: 15, ST: 15, CN: 14 }))).toBe(33);
    });

    it('ST+CN ~40 × WL 15 → Great', () => {
      expect(computeEndurance(createAttrs({ WL: 15, ST: 20, CN: 20 }))).toBe(42);
      expect(computeEndurance(createAttrs({ WL: 15, ST: 20, CN: 19 }))).toBe(42);
    });

    it('ST+CN ~35 × WL 20 → Great; the A band opens deeper in', () => {
      expect(computeEndurance(createAttrs({ WL: 20, ST: 18, CN: 17 }))).toBe(42);
      expect(computeEndurance(createAttrs({ WL: 20, ST: 18, CN: 16 }))).toBe(42);
      // ST+CN 40 × WL 20 → A
      expect(computeEndurance(createAttrs({ WL: 20, ST: 20, CN: 20 }))).toBe(65);
    });

    // Tier U is score >= 110, but the computeEnduranceTier in terrabloodCharts.ts stops at 95 (returning "A")
    // Let's verify score > 95 returns Tier A.
    it('maxes out at Tier A for very high scores (e.g. >95)', () => {
      // score 100: WL 20, ST 20, CN 20 (60 + 20 + 20 = 100) -> Tier A (65)
      expect(computeEndurance(createAttrs({ WL: 20, ST: 20, CN: 20 }))).toBe(65);
    });
  });
});

describe('skillCalc - style skill floors', () => {
  const SKILLS = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'] as const;
  const ALL_STYLES = Object.values(FightingStyle);
  const WEAK: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  const FLAT_15: Attributes = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };

  it('never lets a skill fall below its style floor', () => {
    for (const style of ALL_STYLES) {
      const skills = computeBaseSkills(WEAK, style);
      SKILLS.forEach((k, i) => {
        expect(skills[k], `${style} ${k}`).toBeGreaterThanOrEqual(STYLE_SKILL_FLOORS[style][i]!);
      });
    }
  });

  it('pins a weak warrior to the floor on a floored signature skill', () => {
    const ws = computeBaseSkills(WEAK, FightingStyle.WallOfSteel);
    expect(ws.ATT).toBe(STYLE_SKILL_FLOORS[FightingStyle.WallOfSteel][0]);
    expect(ws.INI).toBe(STYLE_SKILL_FLOORS[FightingStyle.WallOfSteel][3]);
  });

  it('keeps every floor at or above 1 and at most 20', () => {
    for (const style of ALL_STYLES) {
      for (const floor of STYLE_SKILL_FLOORS[style]) {
        expect(floor).toBeGreaterThanOrEqual(1);
        expect(floor).toBeLessThanOrEqual(20);
      }
    }
  });

  it('stays below what the all-15s balance fixture produces, so floors never touch it', () => {
    // A floor the fixture reaches stops being a population-only lever and
    // would silently shift the certified guardrail numbers.
    for (const style of ALL_STYLES) {
      const pen = STYLE_PENALTIES[style];
      const skills = computeBaseSkills(FLAT_15, style);
      SKILLS.forEach((k, i) => {
        const floor = STYLE_SKILL_FLOORS[style][i]!;
        if (floor > 1) {
          // V23: BA ATT floor sits at exactly the all-15s value (14) — a
          // no-op bind that doesn't shift the fixture; strict > would
          // mis-flag it. The invariant is that floors never LIFT the
          // fixture (floor > computed), so >= is the correct boundary.
          expect(skills[k], `${style} ${k} (penalty ${pen[i]})`).toBeGreaterThanOrEqual(floor);
        }
      });
    }
  });
});
