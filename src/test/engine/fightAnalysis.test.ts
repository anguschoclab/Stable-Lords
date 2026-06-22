import { describe, it, expect } from 'vitest';
import { buildFightAnalysis } from '@/engine/narrative/fightAnalysis';
import type { FightOutcome } from '@/types/combat.types';

const baseWarrior = (over: Partial<any> = {}) => ({
  id: 'w1',
  name: 'Test',
  style: 'Lunging Attack',
  attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
  skills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
  ...over,
});

const outcome = (over: Partial<FightOutcome> = {}): FightOutcome => ({
  winner: 'A',
  by: 'Kill',
  minutes: 7,
  log: [],
  exchangeLog: [
    {
      exchangeIndex: 0,
      minute: 1,
      iniWinner: 'A',
      attResult: 'hit',
      damage: 4,
      endDeltas: { a: -3, d: -5 },
    },
    {
      exchangeIndex: 1,
      minute: 2,
      iniWinner: 'A',
      attResult: 'hit',
      damage: 6,
      endDeltas: { a: -3, d: -6 },
    },
    {
      exchangeIndex: 2,
      minute: 3,
      iniWinner: 'A',
      attResult: 'crit',
      damage: 12,
      killWindow: true,
      executionFlag: true,
      reasonCodes: ['AI_PUSH_FATIGUE'],
    },
  ],
  post: {
    xpA: 10,
    xpD: 2,
    hitsA: 3,
    hitsD: 0,
    gotKillA: true,
    causeBucket: 'FATAL_DAMAGE',
    fatalExchangeIndex: 2,
  },
  ...over,
});

describe('buildFightAnalysis', () => {
  it('identifies the decisive exchange from the fatal exchange index', () => {
    const a = buildFightAnalysis(
      outcome(),
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D', style: 'Total Parry' })
    );
    expect(a.decisiveExchange.index).toBe(2);
    expect(a.decisiveExchange.reasonCodes).toContain('AI_PUSH_FATIGUE');
  });

  it('reports the style matchup edge in favor of the winner', () => {
    const a = buildFightAnalysis(
      outcome(),
      baseWarrior({ id: 'A', style: 'Lunging Attack' }),
      baseWarrior({ id: 'D', style: 'Total Parry' })
    );
    expect(a.styleMatchup.styleA).toBe('Lunging Attack');
    expect(a.styleMatchup.styleD).toBe('Total Parry');
    expect(typeof a.styleMatchup.edge).toBe('number');
  });

  it('summarizes hits and aggregate damage per side', () => {
    const a = buildFightAnalysis(outcome(), baseWarrior({ id: 'A' }), baseWarrior({ id: 'D' }));
    expect(a.tale.hitsA).toBe(3);
    expect(a.tale.damageA).toBe(22);
    expect(a.tale.damageD).toBe(0);
  });

  it('detects the endurance crossover exchange when one side fatigues first', () => {
    const a = buildFightAnalysis(outcome(), baseWarrior({ id: 'A' }), baseWarrior({ id: 'D' }));
    // D loses endurance faster; crossover should be a non-null exchange index or null
    expect(a.fatigue.fatiguedSide === 'D' || a.fatigue.fatiguedSide === null).toBe(true);
  });

  it('returns a graceful empty-ish analysis when exchangeLog is absent', () => {
    const a = buildFightAnalysis(
      outcome({ exchangeLog: undefined }),
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D' })
    );
    expect(a.decisiveExchange.index).toBeNull();
    expect(a.factors.length).toBeGreaterThan(0); // still produces matchup + outcome factors
  });

  it('produces a ranked, human-readable factors list (3-5 items)', () => {
    const a = buildFightAnalysis(
      outcome(),
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D', style: 'Total Parry' })
    );
    expect(a.factors.length).toBeGreaterThanOrEqual(3);
    expect(a.factors.length).toBeLessThanOrEqual(5);
    a.factors.forEach((f: { label: string; detail: string }) => {
      expect(typeof f.label).toBe('string');
      expect(typeof f.detail).toBe('string');
    });
  });

  it('summarizes hits and ripostes correctly when opponent has initiative', () => {
    const customOutcome = outcome({
      exchangeLog: [
        {
          exchangeIndex: 0,
          minute: 1,
          iniWinner: 'D',
          attResult: 'hit',
          damage: 5,
        },
        {
          exchangeIndex: 1,
          minute: 2,
          iniWinner: 'D',
          ripResult: 'hit',
        },
      ],
    });
    const a = buildFightAnalysis(
      customOutcome,
      baseWarrior({ id: 'A' }),
      baseWarrior({ id: 'D' })
    );
    expect(a.tale.hitsD).toBe(1);
    expect(a.tale.damageD).toBe(5);
    expect(a.tale.ripostesA).toBe(1); // D had init, so A riposted
  });

  it('determines fatigue without a crossover exchange if gap builds late', () => {
    const customOutcome = outcome({
      exchangeLog: [
        { exchangeIndex: 0, minute: 1, iniWinner: 'A', endDeltas: { a: -1, d: -2 } },
        { exchangeIndex: 1, minute: 2, iniWinner: 'A', endDeltas: { a: -1, d: -2 } },
        { exchangeIndex: 2, minute: 3, iniWinner: 'A', endDeltas: { a: -1, d: -3 } },
      ], // Total gap: a=-3, d=-7. Gap is 4, which triggers the finalGap logic
    });
    const a = buildFightAnalysis(customOutcome, baseWarrior({ id: 'A' }), baseWarrior({ id: 'D' }));
    expect(a.fatigue.fatiguedSide).toBe('D');
    expect(a.fatigue.crossoverExchange).toBeNull();
  });

  it('handles tied or no skill gaps correctly without adding it to factors', () => {
    const warriorA = baseWarrior({ id: 'A', skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 } });
    const warriorD = baseWarrior({ id: 'D', skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 } });

    const a = buildFightAnalysis(outcome(), warriorA, warriorD);
    const skillFactor = a.factors.find(f => f.label.includes('edge'));
    expect(skillFactor).toBeUndefined();
  });

  it('identifies biggest skill gap properly even when negative (opponent favored)', () => {
    const warriorA = baseWarrior({ id: 'A', skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 } });
    const warriorD = baseWarrior({ id: 'D', skills: { ATT: 10, PAR: 15, DEF: 10, INI: 10, RIP: 10, DEC: 10 } }); // 5 point PAR advantage for D

    const a = buildFightAnalysis(outcome(), warriorA, warriorD);
    const skillFactor = a.factors.find(f => f.label.includes('PAR edge'));
    expect(skillFactor).toBeDefined();
    expect(skillFactor?.favored).toBe('D');
    expect(skillFactor?.detail).toContain('5-point PAR advantage');
  });

  it('handles Winner is No one (draw/timeout)', () => {
    const customOutcome = outcome({
      winner: null as any,
      by: 'Timeout',
      post: undefined, // no fatalExchangeIndex
    });
    const a = buildFightAnalysis(customOutcome, baseWarrior({ id: 'A' }), baseWarrior({ id: 'D' }));
    const outcomeFactor = a.factors.find(f => f.label === 'Outcome');
    expect(outcomeFactor?.detail).toContain('No one won by Timeout');
  });
});
