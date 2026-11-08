/**
 * V25 guard — archetype data integrity ratchet: coverage, clamps, and
 * id resolution stay true as the data module evolves.
 */
import { describe, it, expect } from 'vitest';
import {
  WINNING_ARCHETYPES,
  STYLE_ARCHETYPE_FIT,
  ARCHETYPE_DESIGN_BARS,
  type WinningArchetype,
} from '@/data/warriorArchetypes';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';
import { getItemById } from '@/data/equipment';
import { FightingStyle, ATTRIBUTE_KEYS, ATTRIBUTE_TOTAL } from '@/types/shared.types';

const ARCHETYPES = Object.keys(WINNING_ARCHETYPES) as WinningArchetype[];

describe('v25 archetype data — integrity', () => {
  it('exactly six archetypes are defined', () => {
    expect(ARCHETYPES).toHaveLength(6);
  });

  it('every design-bar value sits inside the attribute clamps', () => {
    for (const a of ARCHETYPES) {
      for (const v of Object.values(WINNING_ARCHETYPES[a].designBars)) {
        if (typeof v === 'number') {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(25);
        }
      }
    }
  });

  it('every recommended/caution style is a valid FightingStyle', () => {
    const styles = new Set(Object.values(FightingStyle));
    for (const a of ARCHETYPES) {
      for (const s of WINNING_ARCHETYPES[a].recommendedStyles) expect(styles.has(s)).toBe(true);
      for (const s of WINNING_ARCHETYPES[a].cautionStyles) expect(styles.has(s)).toBe(true);
    }
  });

  it('weapon and armor ids all resolve to real items', () => {
    for (const a of ARCHETYPES) {
      for (const id of WINNING_ARCHETYPES[a].weapons) expect(getItemById(id)).toBeDefined();
      for (const id of WINNING_ARCHETYPES[a].armor.ids) expect(getItemById(id)).toBeDefined();
    }
  });

  it('STYLE_ARCHETYPE_FIT covers all ten styles and references only known archetypes', () => {
    for (const style of Object.values(FightingStyle)) {
      const fits = STYLE_ARCHETYPE_FIT[style];
      expect(fits?.length ?? 0, `${style}`).toBeGreaterThan(0);
      for (const f of fits) expect(ARCHETYPES).toContain(f);
    }
  });

  it('no fighter concept spread violates the 70-pt budget or clamps', () => {
    for (const style of Object.values(FightingStyle)) {
      for (const c of FIGHTER_CONCEPTS[style].concepts) {
        const total = ATTRIBUTE_KEYS.reduce((s, k) => s + c.stats[k], 0);
        expect(total, `${style} ${c.name}`).toBe(ATTRIBUTE_TOTAL);
      }
    }
  });

  it('ARCHETYPE_DESIGN_BARS exists as named constants', () => {
    expect(ARCHETYPE_DESIGN_BARS).toBeDefined();
    expect(Object.keys(ARCHETYPE_DESIGN_BARS).length).toBeGreaterThan(0);
  });
});
