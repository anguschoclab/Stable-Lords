/**
 * V22 canon guards (live ratchet) — Noblish Island integration invariants.
 * Fails if persona categories regress, numeral leaks return, the canon
 * style-penalty table is dropped, or statement floors are deleted.
 */
import { describe, it, expect } from 'vitest';
import uiMeta from '@/data/narrative/uiMeta.json';
import { CANON_STYLE_PENALTIES, STATEMENT_MIN_SKILLS } from '@/engine/warrior/skillBreakpoints';
import { FightingStyle } from '@/types/shared.types';

type Persona = Record<
  string,
  Record<string, Record<string, { min: number; text: string }[]>>
>;
const persona = uiMeta.persona as unknown as Persona;

describe('persona category completeness (live guard)', () => {
  const CATS = ['initiative', 'riposte', 'attack', 'parry', 'defense', 'endurance'];
  for (const side of ['good', 'bad'] as const) {
    for (const cat of CATS) {
      it(`${side}.${cat} exists with high+low lists`, () => {
        expect(persona[side]?.[cat]?.high?.length ?? 0).toBeGreaterThan(0);
        expect(persona[side]?.[cat]?.low?.length ?? 0).toBeGreaterThan(0);
      });
    }
  }
});

describe('persona text hygiene (live guard)', () => {
  it('no "(N)" numerals embedded in statement texts', () => {
    const leaks: string[] = [];
    const walk = (o: unknown) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        const r = o as Record<string, unknown>;
        if (typeof r.text === 'string' && /\(\d+\)/.test(r.text)) leaks.push(r.text);
        Object.values(r).forEach(walk);
      }
    };
    walk(persona);
    expect(leaks).toEqual([]);
  });
});

describe('canon tables preserved (live guard)', () => {
  it('CANON_STYLE_PENALTIES covers all ten styles with canon values', () => {
    const expected: Record<string, number[]> = {
      // [ATT,PAR,DEF,INI,RIP,DEC] — Terrablood/CIC originals
      [FightingStyle.AimedBlow]: [-17, -8, -12, -9, -7, 1],
      [FightingStyle.BashingAttack]: [-8, -8, -13, -3, -4, 1],
      [FightingStyle.LungingAttack]: [-6, -8, -10, -2, -4, 0],
      [FightingStyle.ParryLunge]: [-8, -6, -12, -4, -4, -1],
      [FightingStyle.ParryRiposte]: [-12, -6, -14, -5, 0, -1],
      [FightingStyle.ParryStrike]: [-12, -6, -12, -7, -4, -1],
      [FightingStyle.SlashingAttack]: [-8, -10, -12, 0, -4, 0],
      [FightingStyle.StrikingAttack]: [-12, -9, -12, -5, -4, 1],
      [FightingStyle.TotalParry]: [-14, -2, -12, -7, -4, -2],
      [FightingStyle.WallOfSteel]: [-8, -4, -12, -1, -4, -1],
    };
    for (const [style, row] of Object.entries(expected)) {
      expect(CANON_STYLE_PENALTIES[style as FightingStyle]).toEqual(row);
    }
  });

  it('STATEMENT_MIN_SKILLS carries the canon WT15 floors', () => {
    expect(STATEMENT_MIN_SKILLS).toEqual({ INI: 10, RIP: 10, ATT: 7, PAR: 6, DEF: 3, DEC: 9 });
  });
});
