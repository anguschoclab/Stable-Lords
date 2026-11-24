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

  it("armor guidance respects each recommended style's restrictedStyles", () => {
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

describe('classifyArchetype — corpus equivalence (micro-opt pin)', () => {
  // Re-derives the full sorted fit vector from first principles: any change
  // to bar weighting, style fit, rounding, or sort order breaks this pin.
  const bar = (v: number, floor: number) => Math.min(v / floor, 1);
  const cap = (v: number, ceil: number) => Math.min(ceil / v, 1);
  const refRatio = (
    attrs: Record<string, number>,
    bars: (typeof WINNING_ARCHETYPES)[WinningArchetype]['designBars']
  ) => {
    const r: number[] = [];
    if (bars.stMin !== undefined) r.push(bar(attrs.ST ?? 0, bars.stMin));
    if (bars.cnMin !== undefined) r.push(bar(attrs.CN ?? 0, bars.cnMin));
    if (bars.szMax !== undefined) r.push(cap(attrs.SZ ?? 0, bars.szMax));
    if (bars.wtMin !== undefined) r.push(bar(attrs.WT ?? 0, bars.wtMin));
    if (bars.wlMin !== undefined) r.push(bar(attrs.WL ?? 0, bars.wlMin));
    if (bars.wlMax !== undefined) r.push(cap(attrs.WL ?? 0, bars.wlMax));
    if (bars.spMax !== undefined) r.push(cap(attrs.SP ?? 0, bars.spMax));
    if (bars.dfMin !== undefined) r.push(bar(attrs.DF ?? 0, bars.dfMin));
    if (bars.minRipBase !== undefined)
      r.push(bar((attrs.SP ?? 0) + (attrs.DF ?? 0), bars.minRipBase));
    return r.length === 0 ? 0 : r.reduce((a, b) => a + b, 0) / r.length;
  };
  const refStyleFit = (
    style: FightingStyle,
    guide: (typeof WINNING_ARCHETYPES)[WinningArchetype]
  ) =>
    guide.recommendedStyles.includes(style) ? 1 : guide.cautionStyles.includes(style) ? 0.6 : 0.3;
  const expected = (attrs: Record<string, number>, style: FightingStyle) =>
    (
      Object.entries(WINNING_ARCHETYPES) as [
        WinningArchetype,
        (typeof WINNING_ARCHETYPES)[WinningArchetype],
      ][]
    )
      .map(([archetype, guide]) => ({
        archetype,
        score:
          Math.round(
            (0.7 * refRatio(attrs, guide.designBars) + 0.3 * refStyleFit(style, guide)) * 100
          ) / 1,
      }))
      .sort((a, b) => b.score - a.score);

  const corpus: [Record<string, number>, FightingStyle][] = [
    [{ ST: 15, CN: 8, SZ: 12, WT: 15, WL: 13, SP: 9, DF: 11 }, FightingStyle.StrikingAttack],
    [{ ST: 3, CN: 21, SZ: 21, WT: 21, WL: 21, SP: 3, DF: 21 }, FightingStyle.WallOfSteel],
    [{ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }, FightingStyle.AimedBlow],
    [{ ST: 21, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 21, DF: 3 }, FightingStyle.LungingAttack],
    [{ ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 }, FightingStyle.BashingAttack],
  ];

  it.each(corpus)('full sorted fit vector matches reference for %j / %s', (attrs, style) => {
    expect(classifyArchetype(attrs as never, style)).toEqual(expected(attrs, style));
  });
});
