/**
 * V25 — Assur's winning-warrior-archetype taxonomy (Arena 93):
 * six archetypes, per-archetype doctrine/designBars/styles/weapons/armor/
 * strategy, and a total STYLE_ARCHETYPE_FIT coverage map.
 */
import { describe, it, expect } from 'vitest';
import {
  WINNING_ARCHETYPES,
  STYLE_ARCHETYPE_FIT,
  classifyArchetype,
  type WinningArchetype,
} from '@/data/warriorArchetypes';
import { getItemById, getAvailableItems } from '@/data/equipment';
import { FightingStyle, ATTRIBUTE_KEYS } from '@/types/shared.types';

const ALL: WinningArchetype[] = [
  'pureOffensive',
  'pureDefensive',
  'tankHybrid',
  'lowWillTankHybrid',
  'highSkillHybrid',
  'ripostingHybrid',
];

describe('WINNING_ARCHETYPES — taxonomy', () => {
  it('contains all six canon archetypes', () => {
    for (const a of ALL) expect(WINNING_ARCHETYPES[a], `missing ${a}`).toBeDefined();
  });

  it('every archetype carries doctrine, stats, styles, weapons, armor, strategy', () => {
    for (const a of ALL) {
      const g = WINNING_ARCHETYPES[a];
      expect(g.label.length, `${a} label`).toBeGreaterThan(0);
      expect(g.doctrine.length, `${a} doctrine`).toBeGreaterThan(40);
      expect(g.keyStats.length, `${a} keyStats`).toBeGreaterThan(0);
      expect(g.recommendedStyles.length, `${a} styles`).toBeGreaterThan(0);
      expect(g.weapons.length, `${a} weapons`).toBeGreaterThan(0);
      expect(g.armor.ids.length, `${a} armor`).toBeGreaterThan(0);
      expect(g.strategy.oeBand[0]).toBeLessThanOrEqual(g.strategy.oeBand[1]);
      expect(g.strategy.alBand[0]).toBeLessThanOrEqual(g.strategy.alBand[1]);
      expect(g.family).toMatch(/offensive|defensive|hybrid/);
    }
  });

  it('every recommended weapon id resolves to a real item', () => {
    for (const a of ALL) {
      for (const id of WINNING_ARCHETYPES[a].weapons) {
        expect(getItemById(id), `${a} weapon ${id}`).toBeDefined();
      }
    }
  });

  it('armor guidance respects each recommended style\'s restrictedStyles', () => {
    // Canon "APA/F is the norm" only applies where the armor is legal —
    // AB/LU/SL can never wear plate_armor, AB/LU never plate_mail.
    for (const a of ALL) {
      for (const armorId of WINNING_ARCHETYPES[a].armor.ids) {
        for (const style of WINNING_ARCHETYPES[a].recommendedStyles) {
          const legal = getAvailableItems('armor', style).some((i) => i.id === armorId);
          expect(legal, `${a}: ${armorId} illegal for ${style}`).toBe(true);
        }
      }
    }
  });
});

describe('STYLE_ARCHETYPE_FIT — coverage', () => {
  it('every style has at least one archetype fit', () => {
    for (const style of Object.values(FightingStyle)) {
      expect(STYLE_ARCHETYPE_FIT[style]?.length ?? 0, `${style}`).toBeGreaterThan(0);
    }
  });

  it('canon fit claims: LU fits ≥3 archetypes — the ultimate hybrid', () => {
    expect(STYLE_ARCHETYPE_FIT[FightingStyle.LungingAttack]?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('canon fit: TP ⊆ {pureDefensive, tankHybrid, ripostingHybrid}', () => {
    const fits = STYLE_ARCHETYPE_FIT[FightingStyle.TotalParry] ?? [];
    for (const f of fits) {
      expect(['pureDefensive', 'tankHybrid', 'ripostingHybrid']).toContain(f);
    }
    expect(fits).toContain('pureDefensive');
  });

  it('canon fit: striker is a pure offensive', () => {
    expect(STYLE_ARCHETYPE_FIT[FightingStyle.StrikingAttack]).toContain('pureOffensive');
  });
});

describe('classifyArchetype — fit scoring', () => {
  it('a classic scum frame classifies pureDefensive for TP', () => {
    const fits = classifyArchetype(
      { ST: 13, CN: 18, SZ: 5, WT: 9, WL: 19, SP: 3, DF: 11 },
      FightingStyle.TotalParry
    );
    expect(fits[0]?.archetype).toBe('pureDefensive');
  });

  it('a hot ST frame classifies pureOffensive', () => {
    const fits = classifyArchetype(
      { ST: 15, CN: 8, SZ: 12, WT: 15, WL: 13, SP: 9, DF: 11 },
      FightingStyle.StrikingAttack
    );
    expect(fits[0]?.archetype).toBe('pureOffensive');
  });

  it('all scores sit in [0,100]', () => {
    const fits = classifyArchetype(
      { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      FightingStyle.WallOfSteel
    );
    for (const f of fits) {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
    }
    expect(ATTRIBUTE_KEYS).toHaveLength(7);
  });
});
