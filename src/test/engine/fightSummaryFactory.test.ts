import { describe, it, expect } from 'vitest';
import { createFightSummary } from '@/engine/core/fightSummaryFactory';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';

describe('fightSummaryFactory attaches analysis', () => {
  it('includes analysis built from the outcome exchangeLog', () => {
    const warriorA: Warrior = {
      id: 'a' as any,
      name: 'Aulus',
      style: FightingStyle.LungingAttack,
      attributes: { ST: 15, CN: 12, SZ: 10, WT: 11, WL: 10, SP: 13, DF: 9 },
      baseSkills: { ATT: 12, PAR: 8, DEF: 9, INI: 11, RIP: 6, DEC: 10 },
      derivedStats: { hp: 30, endurance: 20, damage: 5, encumbrance: 0 },
      fame: 10,
      popularity: 5,
      titles: [],
      injuries: [],
      flair: [],
      career: { wins: 0, losses: 0, kills: 0 },
      champion: false,
      status: 'Active',
      stableId: 's1' as any,
      traits: [],
    };

    const warriorD: Warrior = {
      id: 'd' as any,
      name: 'Bran',
      style: FightingStyle.TotalParry,
      attributes: { ST: 12, CN: 14, SZ: 11, WT: 10, WL: 12, SP: 10, DF: 11 },
      baseSkills: { ATT: 10, PAR: 12, DEF: 11, INI: 10, RIP: 8, DEC: 8 },
      derivedStats: { hp: 32, endurance: 22, damage: 4, encumbrance: 0 },
      fame: 8,
      popularity: 4,
      titles: [],
      injuries: [],
      flair: [],
      career: { wins: 0, losses: 0, kills: 0 },
      champion: false,
      status: 'Active',
      stableId: 's2' as any,
      traits: [],
    };

    const outcome: FightOutcome = {
      winner: 'A',
      by: 'Kill',
      minutes: 7,
      log: [],
      exchangeLog: [
        { exchangeIndex: 0, minute: 1, iniWinner: 'A', attResult: 'hit', damage: 4, endDeltas: { a: -3, d: -5 } },
        { exchangeIndex: 1, minute: 2, iniWinner: 'A', attResult: 'hit', damage: 6, endDeltas: { a: -3, d: -6 } },
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
      post: { xpA: 10, xpD: 2, hitsA: 3, hitsD: 0, gotKillA: true, causeBucket: 'FATAL_DAMAGE', fatalExchangeIndex: 2 },
    };

    const summary = createFightSummary({
      warriorA,
      warriorD,
      outcome,
      week: 1,
      rng: { uuid: () => 'test-id' },
    });

    expect(summary.analysis).toBeDefined();
    expect(summary.analysis?.styleMatchup).toBeDefined();
    expect(summary.analysis?.factors.length).toBeGreaterThan(0);
  });
});
