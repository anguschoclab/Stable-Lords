import { describe, it, expect } from 'vitest';
import {
  STYLE_FAMILY,
  FAMILY_GUIDE,
  DESIGN_REVIEW_THRESHOLDS,
  type StyleFamily,
} from '@/data/designDoctrine';
import { FightingStyle, ATTRIBUTE_KEYS } from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);
const ALL_FAMILIES: StyleFamily[] = ['offensive', 'defensive', 'mixed'];

describe('STYLE_FAMILY — coverage', () => {
  it('maps every canonical fighting style to a family', () => {
    for (const style of ALL_STYLES) {
      expect(
        ALL_FAMILIES,
        `${style} missing a family assignment`
      ).toContain(STYLE_FAMILY[style]);
    }
  });

  it('uses all three families', () => {
    const used = new Set(ALL_STYLES.map((s) => STYLE_FAMILY[s]));
    for (const family of ALL_FAMILIES) {
      expect(used.has(family), `no style assigned to ${family}`).toBe(true);
    }
  });

  it('places each style in its Arena-93 family', () => {
    // Neon Necromancer: offensive = LU/SL/ST/AB/BA, defensive = TP/PR/PS,
    // mixed = WS/PL.
    for (const style of [
      FightingStyle.LungingAttack,
      FightingStyle.SlashingAttack,
      FightingStyle.StrikingAttack,
      FightingStyle.AimedBlow,
      FightingStyle.BashingAttack,
    ]) {
      expect(STYLE_FAMILY[style]).toBe('offensive');
    }
    for (const style of [
      FightingStyle.TotalParry,
      FightingStyle.ParryRiposte,
      FightingStyle.ParryStrike,
    ]) {
      expect(STYLE_FAMILY[style]).toBe('defensive');
    }
    for (const style of [FightingStyle.WallOfSteel, FightingStyle.ParryLunge]) {
      expect(STYLE_FAMILY[style]).toBe('mixed');
    }
  });
});

describe('FAMILY_GUIDE — content', () => {
  it('guides every family with label, key attributes, and doctrine', () => {
    for (const family of ALL_FAMILIES) {
      const guide = FAMILY_GUIDE[family];
      expect(guide, `missing guide for ${family}`).toBeDefined();
      expect(guide.label.length, `empty label for ${family}`).toBeGreaterThan(0);
      expect(guide.doctrine.length, `empty doctrine for ${family}`).toBeGreaterThan(0);
      expect(
        guide.keyAttributes.length,
        `no key attributes for ${family}`
      ).toBeGreaterThanOrEqual(1);
      for (const key of guide.keyAttributes) {
        expect(ATTRIBUTE_KEYS, `${family} key attribute ${key}`).toContain(key);
      }
    }
  });

  it('names will as a key attribute for every family (canon: will is key)', () => {
    for (const family of ALL_FAMILIES) {
      expect(FAMILY_GUIDE[family].keyAttributes).toContain('WL');
    }
  });
});

describe('DESIGN_REVIEW_THRESHOLDS — sanity', () => {
  it('defines positive numeric thresholds', () => {
    for (const [key, value] of Object.entries(DESIGN_REVIEW_THRESHOLDS)) {
      expect(typeof value, `${key} not numeric`).toBe('number');
      expect(value, `${key} not positive`).toBeGreaterThan(0);
    }
  });

  it('pins the piker canon thresholds — wit note below 15, flat warn at spread ≤ 7', () => {
    expect(DESIGN_REVIEW_THRESHOLDS.PS_WT_NOTE).toBe(15);
    expect(DESIGN_REVIEW_THRESHOLDS.PS_FLAT_SPREAD).toBe(7);
  });
});

  it('pins the wall canon thresholds — will warn below 15, deftness floor at 11', () => {
    expect(DESIGN_REVIEW_THRESHOLDS.WS_WL_WARN).toBe(15);
    expect(DESIGN_REVIEW_THRESHOLDS.WS_DF_MIN).toBe(11);
    expect(DESIGN_REVIEW_THRESHOLDS.WS_ST_MIN).toBe(9);
    expect(DESIGN_REVIEW_THRESHOLDS.WS_COORD_MIN).toBe(18);
  });
