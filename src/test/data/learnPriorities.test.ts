import { describe, it, expect } from 'vitest';
import {
  STYLE_LEARN_PRIORITY,
  STYLE_LEARN_WEIGHTS,
} from '@/data/learnPriorities';
import {
  LEARN_ATTEMPTS,
  LEARN_WT_FACTOR,
  LEARN_FAVORITE_WEIGHT,
  LEARN_PER_SKILL_CAP,
  LEARN_CAREER_CAP,
  LEARN_SUSPECT_MIN,
} from '@/constants/combat/combat/learn';
import { FightingStyle } from '@/types/shared.types';
import type { BaseSkills } from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);
const SKILL_KEYS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

describe('STYLE_LEARN_PRIORITY — canon coverage', () => {
  it('maps every canonical fighting style', () => {
    for (const style of ALL_STYLES) {
      expect(
        STYLE_LEARN_PRIORITY[style],
        `${style} missing a learn-priority row`
      ).toBeDefined();
    }
  });

  it('lists each of the six skills exactly once per style', () => {
    for (const style of ALL_STYLES) {
      const row = STYLE_LEARN_PRIORITY[style];
      expect(row).toHaveLength(SKILL_KEYS.length);
      for (const skill of SKILL_KEYS) {
        expect(row, `${style} missing ${skill}`).toContain(skill);
      }
    }
  });

  it('pins the Arena-93 canon orderings (Pagan chart)', () => {
    // Signature rows: LU leads INI, TP leads PAR, ST leads DEC, PR leads RIP.
    expect(STYLE_LEARN_PRIORITY[FightingStyle.LungingAttack][0]).toBe('INI');
    expect(STYLE_LEARN_PRIORITY[FightingStyle.TotalParry][0]).toBe('PAR');
    expect(STYLE_LEARN_PRIORITY[FightingStyle.StrikingAttack][0]).toBe('DEC');
    expect(STYLE_LEARN_PRIORITY[FightingStyle.ParryRiposte][0]).toBe('RIP');
    expect(STYLE_LEARN_PRIORITY[FightingStyle.AimedBlow][0]).toBe('ATT');
  });
});

describe('STYLE_LEARN_WEIGHTS — derived weights', () => {
  it('assigns 6..1 in priority order', () => {
    for (const style of ALL_STYLES) {
      const weights = STYLE_LEARN_WEIGHTS[style];
      const row = STYLE_LEARN_PRIORITY[style];
      row.forEach((skill, idx) => {
        expect(
          weights[skill],
          `${style} ${skill} should weight ${6 - idx}`
        ).toBe(SKILL_KEYS.length - idx);
      });
    }
  });

  it('weights every skill positive', () => {
    for (const style of ALL_STYLES) {
      for (const skill of SKILL_KEYS) {
        expect(STYLE_LEARN_WEIGHTS[style][skill]).toBeGreaterThan(0);
      }
    }
  });
});

describe('learn constants — sanity', () => {
  it('defines positive magnitudes', () => {
    for (const [name, value] of Object.entries({
      LEARN_ATTEMPTS,
      LEARN_WT_FACTOR,
      LEARN_FAVORITE_WEIGHT,
      LEARN_PER_SKILL_CAP,
      LEARN_CAREER_CAP,
      LEARN_SUSPECT_MIN,
    })) {
      expect(typeof value, `${name} not numeric`).toBe('number');
      expect(value, `${name} not positive`).toBeGreaterThan(0);
    }
  });

  it('keeps caps coherent — career cap ≥ per-skill cap', () => {
    expect(LEARN_CAREER_CAP).toBeGreaterThanOrEqual(LEARN_PER_SKILL_CAP);
  });

  it('keeps WT factor learnable-but-gated — WT5 below 40%, WT21 below 100%', () => {
    expect(5 * LEARN_WT_FACTOR).toBeLessThan(0.4);
    expect(21 * LEARN_WT_FACTOR).toBeLessThan(1);
  });
});
