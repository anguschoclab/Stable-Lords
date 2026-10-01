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

  describe('endurance tier breakpoints', () => {
    // Formula: score = WL * 3 + ST + CN
    // Values: L: 12, P: 18, N: 25, G: 33, R: 42, T: 52, A: 65, U: 80

    it('handles Tier P breakpoint (score >= 35)', () => {
      // exactly 35: WL 5, ST 10, CN 10 (15 + 10 + 10 = 35) -> Tier P (18)
      expect(computeEndurance(createAttrs({ WL: 5, ST: 10, CN: 10 }))).toBe(18);
      // exactly 34: WL 5, ST 10, CN 9 (15 + 10 + 9 = 34) -> Tier L (12)
      expect(computeEndurance(createAttrs({ WL: 5, ST: 10, CN: 9 }))).toBe(12);
    });

    it('handles Tier N breakpoint (score >= 48)', () => {
      // exactly 48: WL 10, ST 9, CN 9 (30 + 9 + 9 = 48) -> Tier N (25)
      expect(computeEndurance(createAttrs({ WL: 10, ST: 9, CN: 9 }))).toBe(25);
      // exactly 47: WL 10, ST 9, CN 8 (30 + 9 + 8 = 47) -> Tier P (18)
      expect(computeEndurance(createAttrs({ WL: 10, ST: 9, CN: 8 }))).toBe(18);
    });

    it('handles Tier G breakpoint (score >= 62)', () => {
      // exactly 62: WL 10, ST 16, CN 16 (30 + 16 + 16 = 62) -> Tier G (33)
      expect(computeEndurance(createAttrs({ WL: 10, ST: 16, CN: 16 }))).toBe(33);
      // exactly 61: WL 10, ST 16, CN 15 (30 + 16 + 15 = 61) -> Tier N (25)
      expect(computeEndurance(createAttrs({ WL: 10, ST: 16, CN: 15 }))).toBe(25);
    });

    it('handles Tier R breakpoint (score >= 75)', () => {
      // exactly 75: WL 15, ST 15, CN 15 (45 + 15 + 15 = 75) -> Tier R (42)
      expect(computeEndurance(createAttrs({ WL: 15, ST: 15, CN: 15 }))).toBe(42);
      // exactly 74: WL 15, ST 15, CN 14 (45 + 15 + 14 = 74) -> Tier G (33)
      expect(computeEndurance(createAttrs({ WL: 15, ST: 15, CN: 14 }))).toBe(33);
    });

    it('handles Tier T breakpoint (score >= 85)', () => {
      // exactly 85: WL 15, ST 20, CN 20 (45 + 20 + 20 = 85) -> Tier T (52)
      expect(computeEndurance(createAttrs({ WL: 15, ST: 20, CN: 20 }))).toBe(52);
      // exactly 84: WL 15, ST 20, CN 19 (45 + 20 + 19 = 84) -> Tier R (42)
      expect(computeEndurance(createAttrs({ WL: 15, ST: 20, CN: 19 }))).toBe(42);
    });

    it('handles Tier A breakpoint (score >= 95)', () => {
      // exactly 95: WL 20, ST 18, CN 17 (60 + 18 + 17 = 95) -> Tier A (65)
      expect(computeEndurance(createAttrs({ WL: 20, ST: 18, CN: 17 }))).toBe(65);
      // exactly 94: WL 20, ST 18, CN 16 (60 + 18 + 16 = 94) -> Tier T (52)
      expect(computeEndurance(createAttrs({ WL: 20, ST: 18, CN: 16 }))).toBe(52);
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
          expect(skills[k], `${style} ${k} (penalty ${pen[i]})`).toBeGreaterThan(floor);
        }
      });
    }
  });
});
