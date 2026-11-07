import { describe, it, expect } from 'vitest';
import {
  FIGHTER_CONCEPTS,
  scaleToAttributeBudget,
  conceptPrimaryAttr,
  conceptMean,
} from '@/data/fighterConcepts';
import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from '@/types/shared.types';

const ALL_STYLES = Object.values(FightingStyle);
const sum = (a: Attributes) => ATTRIBUTE_KEYS.reduce((s, k) => s + a[k], 0);

describe('FIGHTER_CONCEPTS — coverage & content', () => {
  it('covers every canonical fighting style', () => {
    for (const style of ALL_STYLES) {
      const guide = FIGHTER_CONCEPTS[style];
      expect(guide, `missing concept guide for ${style}`).toBeDefined();
      expect(guide.doctrine.length, `empty doctrine for ${style}`).toBeGreaterThan(0);
      expect(guide.concepts.length, `no concepts for ${style}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every concept carries canon and scaled spreads, notes, and tactics', () => {
    for (const style of ALL_STYLES) {
      for (const concept of FIGHTER_CONCEPTS[style].concepts) {
        expect(concept.name.length).toBeGreaterThan(0);
        expect(concept.notes.length).toBeGreaterThan(0);
        expect(concept.tactics.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('FIGHTER_CONCEPTS — canon spreads', () => {
  it('canon spreads preserve the original ~84-point newsletter budget', () => {
    for (const style of ALL_STYLES) {
      for (const concept of FIGHTER_CONCEPTS[style].concepts) {
        const total = sum(concept.canonStats);
        expect(
          total,
          `${style}/${concept.name} canon sum ${total} outside [83, 86]`
        ).toBeGreaterThanOrEqual(83);
        expect(total).toBeLessThanOrEqual(86);
      }
    }
  });
});

describe('FIGHTER_CONCEPTS — scaled spreads', () => {
  it('scaled spreads land exactly on the 70-point budget inside [MIN, MAX]', () => {
    for (const style of ALL_STYLES) {
      for (const concept of FIGHTER_CONCEPTS[style].concepts) {
        expect(sum(concept.stats), `${style}/${concept.name}`).toBe(ATTRIBUTE_TOTAL);
        for (const key of ATTRIBUTE_KEYS) {
          const v = concept.stats[key];
          expect(Number.isInteger(v), `${style}/${concept.name} ${key}=${v} not integer`).toBe(true);
          expect(v).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
          expect(v).toBeLessThanOrEqual(ATTRIBUTE_MAX);
        }
      }
    }
  });
});

describe('FIGHTER_CONCEPTS — "How to Build a Better Warrior" redesigns', () => {
  // Neon Necromancer's three example rebuilds (Arena 93, ~84-pt canon budget).
  const find = (style: FightingStyle, name: string) =>
    FIGHTER_CONCEPTS[style].concepts.find((c) => c.name === name);

  it('includes the Broke Stroker lunging redesign', () => {
    const c = find(FightingStyle.LungingAttack, 'Broke Stroker');
    expect(c).toBeDefined();
    expect(c!.canonStats).toEqual({ ST: 10, CN: 10, SZ: 10, WT: 15, WL: 15, SP: 11, DF: 13 });
  });

  it('includes the Scimitar Adept slashing redesign', () => {
    const c = find(FightingStyle.SlashingAttack, 'Scimitar Adept');
    expect(c).toBeDefined();
    expect(c!.canonStats).toEqual({ ST: 9, CN: 8, SZ: 14, WT: 13, WL: 17, SP: 10, DF: 13 });
  });

  it('includes the Low-Will Wonder striking redesign', () => {
    const c = find(FightingStyle.StrikingAttack, 'Low-Will Wonder');
    expect(c).toBeDefined();
    expect(c!.canonStats).toEqual({ ST: 17, CN: 9, SZ: 7, WT: 17, WL: 9, SP: 14, DF: 11 });
  });
});

describe('FIGHTER_CONCEPTS — Parry-Riposte Arena 93 canon builds', () => {
  const prConcepts = FIGHTER_CONCEPTS[FightingStyle.ParryRiposte].concepts;

  it('carries the full dozen canon ripper concepts', () => {
    expect(prConcepts).toHaveLength(12);
  });

  it('includes the newsletter canon builds', () => {
    const names = prConcepts.map((c) => c.name);
    for (const n of [
      'Daydream',
      'Consortium Hybrid',
      'Freshman Scum',
      'The Art',
      "Necrom's Paragon",
      "Thror's Lesson",
      'Fantasy Duelist',
      'Dawnrain',
      'Scovellie',
      'Santee',
    ]) {
      expect(names).toContain(n);
    }
  });

  it('pins Daydream — Assur\'s "best Parry Riposte ever" (17-14-4-17-7-8-17)', () => {
    const c = prConcepts.find((x) => x.name === 'Daydream');
    expect(c?.canonStats).toEqual({ ST: 17, CN: 14, SZ: 4, WT: 17, WL: 7, SP: 8, DF: 17 });
  });

  it('pins Necrom\'s Paragon — the "perfect" ripper (9-4-5-17-21-11-17)', () => {
    const c = prConcepts.find((x) => x.name === "Necrom's Paragon");
    expect(c?.canonStats).toEqual({ ST: 9, CN: 4, SZ: 5, WT: 17, WL: 21, SP: 11, DF: 17 });
  });
});

describe('scaleToAttributeBudget', () => {
  const SPREAD: Attributes = { ST: 11, CN: 12, SZ: 9, WT: 17, WL: 15, SP: 5, DF: 15 }; // sums 84

  it('leaves a spread already on budget untouched', () => {
    const onBudget: Attributes = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
    expect(scaleToAttributeBudget(onBudget)).toEqual(onBudget);
  });

  it('scales an 84-point spread to exactly 70 with integer values', () => {
    const scaled = scaleToAttributeBudget(SPREAD);
    expect(sum(scaled)).toBe(ATTRIBUTE_TOTAL);
    for (const key of ATTRIBUTE_KEYS) {
      expect(Number.isInteger(scaled[key])).toBe(true);
      expect(scaled[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
      expect(scaled[key]).toBeLessThanOrEqual(ATTRIBUTE_MAX);
    }
  });

  it('preserves the spread shape — rank order survives scaling', () => {
    const scaled = scaleToAttributeBudget(SPREAD);
    expect(scaled.WT).toBeGreaterThan(scaled.ST);
    expect(scaled.DF).toBeGreaterThan(scaled.SP);
    expect(scaled.SZ).toBeLessThan(scaled.CN);
  });

  it('respects the attribute floor when a stat scales below MIN', () => {
    const tiny: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 25, WL: 25, SP: 3, DF: 25 }; // sums 87
    const scaled = scaleToAttributeBudget(tiny);
    for (const key of ATTRIBUTE_KEYS) expect(scaled[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
    expect(sum(scaled)).toBe(ATTRIBUTE_TOTAL);
  });

  it('is deterministic — same input, same output', () => {
    expect(scaleToAttributeBudget(SPREAD)).toEqual(scaleToAttributeBudget(SPREAD));
  });
});

describe('conceptPrimaryAttr', () => {
  it('returns a legal attribute key for every style', () => {
    for (const style of ALL_STYLES) {
      expect(ATTRIBUTE_KEYS).toContain(conceptPrimaryAttr(style));
    }
  });

  it('picks the argmax of the style mean spread', () => {
    for (const style of ALL_STYLES) {
      const mean = conceptMean(style);
      const primary = conceptPrimaryAttr(style);
      for (const key of ATTRIBUTE_KEYS) {
        expect(mean[primary]).toBeGreaterThanOrEqual(mean[key]);
      }
    }
  });
});

describe('conceptMean', () => {
  it('equals the single concept spread for one-concept styles', () => {
    for (const style of ALL_STYLES) {
      const concepts = FIGHTER_CONCEPTS[style].concepts;
      if (concepts.length !== 1) continue;
      for (const key of ATTRIBUTE_KEYS) {
        expect(conceptMean(style)[key]).toBeCloseTo(concepts[0]!.stats[key], 5);
      }
    }
  });

  it('mean spreads stay on the 70-point scale', () => {
    for (const style of ALL_STYLES) {
      const mean = conceptMean(style);
      const total = ATTRIBUTE_KEYS.reduce((s, k) => s + mean[k], 0);
      expect(Math.abs(total - ATTRIBUTE_TOTAL), `${style} mean total ${total}`).toBeLessThan(1);
    }
  });
});
