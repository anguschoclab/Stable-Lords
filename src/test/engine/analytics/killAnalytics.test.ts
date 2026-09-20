import { describe, it, expect } from 'vitest';
import { computeKillAnalytics } from '@/engine/analytics/killAnalytics';
import { makeFightSummary, makeWarrior } from '@/test/_fixtures/factories';

describe('computeKillAnalytics (G6)', () => {
  it('returns zeroed analytics for empty history', () => {
    const a = computeKillAnalytics([]);
    expect(a.totalFights).toBe(0);
    expect(a.kills).toBe(0);
    expect(a.killRate).toBe(0);
  });

  it('aggregates kills by style, minute band, memorial tags, cause, killer', () => {
    const kills = makeFightSummary({
      by: 'Kill',
      winner: 'D',
      styleD: 'Lunging Attack',
      isDeathEvent: true,
      deathEventData: {
        boutId: 'b1',
        killerId: 'w1',
        deathSummary: 'slain',
        memorialTags: ['brutal', 'brutal-ish'],
      },
      analysis: {
        styleMatchup: { styleA: 'A', styleD: 'B', edge: 0 },
        decisiveExchange: { index: 9, minute: 8, reasonCodes: ['CAUSE_EXECUTION'], summary: '' },
        fatigue: { fatiguedSide: null, crossoverExchange: null },
        tale: { hitsA: 1, hitsD: 3, damageA: 5, damageD: 40, ripostesA: 0, ripostesD: 0 },
        factors: [],
      },
    });
    const ko = makeFightSummary({ by: 'KO' });
    const clean = makeFightSummary({ by: 'Decision' });

    const dead = makeWarrior({
      isDead: true,
      causeOfDeath: 'EXECUTION',
      killedBy: 'Vortax the Cruel',
    });

    const a = computeKillAnalytics([kills, ko, clean], [dead]);
    expect(a.totalFights).toBe(3);
    expect(a.kills).toBe(1);
    expect(a.killRate).toBeCloseTo(1 / 3);
    expect(a.byStyle['Lunging Attack']).toBe(1);
    expect(a.byMinuteBand['Late (min 7+)']).toBe(1);
    expect(a.memorialTags.brutal).toBe(1);
    expect(a.byCause.EXECUTION).toBe(1);
    expect(a.topKillers[0]).toEqual({ name: 'Vortax the Cruel', kills: 1 });
  });
});
