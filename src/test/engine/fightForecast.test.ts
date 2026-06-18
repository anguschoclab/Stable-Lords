import { describe, it, expect } from 'vitest';
import { buildFightForecast } from '@/engine/narrative/fightForecast';

const mkWarrior = (over: Partial<any> = {}) => ({
  id: 'w',
  name: 'Test',
  style: 'Lunging Attack',
  attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
  baseSkills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
  equipment: {},
  injuries: [],
  ...over,
});

describe('buildFightForecast', () => {
  it('reports the style matchup edge when the opponent is known', () => {
    const f = buildFightForecast(
      mkWarrior({ name: 'Aulus', style: 'Lunging Attack' }),
      mkWarrior({ name: 'Bran', style: 'Total Parry' })
    );
    expect(f.styleMatchup.styleA).toBe('Lunging Attack');
    expect(f.styleMatchup.styleD).toBe('Total Parry');
    expect(typeof f.styleMatchup.edge).toBe('number');
    expect(f.opponentKnown).toBe(true);
  });

  it('surfaces the biggest skill edge favoring the stronger fighter', () => {
    const f = buildFightForecast(
      mkWarrior({ name: 'Aulus', baseSkills: { ATT: 16, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 } }),
      mkWarrior({ name: 'Bran', baseSkills: { ATT: 8, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 } })
    );
    const attFactor = f.factors.find((x: any) => x.label.includes('ATT'));
    expect(attFactor).toBeDefined();
    expect(attFactor!.favored).toBe('A');
  });

  it('produces a player-readiness factor even when the opponent is unknown (CLASSIFIED)', () => {
    const f = buildFightForecast(mkWarrior({ name: 'Aulus' }), null);
    expect(f.opponentKnown).toBe(false);
    // No opponent comparison, but still a non-empty, useful factor list about the player.
    expect(f.factors.length).toBeGreaterThan(0);
    // Style matchup edge is unknown without an opponent style.
    expect(f.styleMatchup.styleD).toBeNull();
  });

  it('flags an injured player warrior as a readiness risk', () => {
    const f = buildFightForecast(
      mkWarrior({ name: 'Aulus', injuries: [{ severity: 'Major', weeksRemaining: 2 }] }),
      mkWarrior({ name: 'Bran' })
    );
    const risk = f.factors.find((x: any) => x.label.toLowerCase().includes('readiness') || x.label.toLowerCase().includes('injur'));
    expect(risk).toBeDefined();
    expect(risk!.favored).toBe('D'); // injury favors the opponent
  });

  it('returns factors ranked by weight, capped at 5', () => {
    const f = buildFightForecast(mkWarrior(), mkWarrior({ style: 'Total Parry' }));
    expect(f.factors.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < f.factors.length; i++) {
      expect(f.factors[i - 1]!.weight).toBeGreaterThanOrEqual(f.factors[i]!.weight);
    }
  });
});
