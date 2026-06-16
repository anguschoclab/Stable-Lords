import { describe, it, expect } from 'vitest';
import { FightSummarySchema } from '@/schemas/gameStateSchema';

describe('FightSummary schema accepts analysis', () => {
  it('parses an arenaHistory entry that carries an analysis object', () => {
    const fight = {
      id: 'f1',
      week: 1,
      title: 'Test',
      warriorIdA: 'a',
      warriorIdD: 'd',
      winner: 'A',
      by: 'Kill',
      styleA: 'Lunging Attack',
      styleD: 'Total Parry',
      createdAt: new Date().toISOString(),
      analysis: {
        styleMatchup: { styleA: 'Lunging Attack', styleD: 'Total Parry', edge: 2 },
        decisiveExchange: { index: 2, minute: 3, reasonCodes: ['AI_PUSH_FATIGUE'], summary: 'x' },
        fatigue: { fatiguedSide: 'D', crossoverExchange: 2 },
        tale: { hitsA: 3, hitsD: 0, damageA: 22, damageD: 0, ripostesA: 0, ripostesD: 0 },
        factors: [{ label: 'Style matchup', detail: 'x', favored: 'A', weight: 0.5 }],
      },
    };
    const result = FightSummarySchema.safeParse(fight);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.analysis?.styleMatchup.edge).toBe(2);
    }
  });
});
