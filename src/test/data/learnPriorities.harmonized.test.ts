/**
 * V23 — harmonized learn-priority canon.
 *
 * Two Arena-93 sources conflict in three rows: Pagan's "Priority Skill
 * Learning" chart vs the "Learns Naturally" table. User-locked merge rule:
 * positions both sources agree on keep their rank; the article's
 * parenthetical fills the contested slot; the remainder keeps Pagan order.
 *
 * Pagan rows (pre-harmonization):
 *   BA: ATT INI DEC PAR RIP DEF  → article: DEC before INI → ATT DEC INI …
 *   SL: INI ATT RIP DEC PAR DEF  → article: DEC before RIP → INI ATT DEC RIP …
 *   WS: ATT INI PAR DEF DEC RIP  → article: PAR before INI → ATT PAR INI …
 */
import { describe, it, expect } from 'vitest';
import { STYLE_LEARN_PRIORITY, STYLE_LEARN_WEIGHTS } from '@/data/learnPriorities';
import { FightingStyle } from '@/types/shared.types';
import type { BaseSkills } from '@/types/shared.types';

describe('STYLE_LEARN_PRIORITY — harmonized conflict rows', () => {
  it('BashingAttack learns ATT first, then DEC before INI', () => {
    expect(STYLE_LEARN_PRIORITY[FightingStyle.BashingAttack].slice(0, 3)).toEqual([
      'ATT',
      'DEC',
      'INI',
    ]);
  });

  it('SlashingAttack learns INI/ATT, then DEC before RIP', () => {
    expect(STYLE_LEARN_PRIORITY[FightingStyle.SlashingAttack].slice(0, 4)).toEqual([
      'INI',
      'ATT',
      'DEC',
      'RIP',
    ]);
  });

  it('WallOfSteel learns ATT first, then PAR before INI', () => {
    expect(STYLE_LEARN_PRIORITY[FightingStyle.WallOfSteel].slice(0, 3)).toEqual([
      'ATT',
      'PAR',
      'INI',
    ]);
  });
});

describe('STYLE_LEARN_PRIORITY — uncontested rows stay pinned (Pagan)', () => {
  const PINNED: [FightingStyle, (keyof BaseSkills)[]][] = [
    [FightingStyle.AimedBlow, ['ATT', 'RIP', 'DEF', 'PAR', 'DEC', 'INI']],
    [FightingStyle.LungingAttack, ['INI', 'DEF', 'RIP', 'ATT', 'DEC', 'PAR']],
    [FightingStyle.ParryLunge, ['INI', 'PAR', 'ATT', 'DEF', 'DEC', 'RIP']],
    [FightingStyle.ParryStrike, ['PAR', 'DEC', 'INI', 'ATT', 'DEF', 'RIP']],
    [FightingStyle.ParryRiposte, ['RIP', 'PAR', 'ATT', 'DEF', 'INI', 'DEC']],
    [FightingStyle.StrikingAttack, ['DEC', 'ATT', 'INI', 'RIP', 'PAR', 'DEF']],
    [FightingStyle.TotalParry, ['PAR', 'DEF', 'RIP', 'ATT', 'DEC', 'INI']],
  ];

  for (const [style, expected] of PINNED) {
    it(`${style} row matches the pinned order`, () => {
      expect(STYLE_LEARN_PRIORITY[style]).toEqual(expected);
    });
  }
});

describe('STYLE_LEARN_WEIGHTS — derived from the harmonized table', () => {
  it('every style covers all six skills with a 6..1 weight ordering', () => {
    for (const style of Object.values(FightingStyle)) {
      const row = STYLE_LEARN_PRIORITY[style];
      expect(row).toHaveLength(6);
      row.forEach((skill, idx) => {
        expect(STYLE_LEARN_WEIGHTS[style][skill]).toBe(row.length - idx);
      });
    }
  });
});
