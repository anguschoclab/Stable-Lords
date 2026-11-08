/**
 * V22 canon wit-statement specs — Noblish Island HIGH WIT STATEMENT chart
 * (Warrior Skill Base article).
 *
 * Canon at WT15 (the high-wit row): a statement only appears when the skill
 * reaches its low-order floor — INI ≥10, RIP ≥10, ATT ≥7, PAR ≥6, DEF ≥3,
 * DEC ≥9; at 13+ INI the high-order "nothing short of a genius…" line fires.
 */
import { describe, it, expect } from 'vitest';
import { generateWarriorStatements } from '@/data/warriorStatements';
import uiMeta from '@/data/narrative/uiMeta.json';
import type { BaseSkills } from '@/types/shared.types';

const skills = (o: Partial<BaseSkills> = {}): BaseSkills => ({
  ATT: 5,
  PAR: 5,
  DEF: 5,
  INI: 5,
  RIP: 5,
  DEC: 5,
  ...o,
});

describe('canon statement floors (WT15)', () => {
  it('RIP below 10 earns no statement (canon: needs 10+)', () => {
    const s = generateWarriorStatements(15, 10, 10, skills({ RIP: 9 }));
    expect(s.riposte).toBe('');
  });

  it('PAR below 6 earns no statement (canon: needs 6+)', () => {
    const s = generateWarriorStatements(15, 10, 10, skills({ PAR: 5 }));
    expect(s.parry).toBe('');
  });

  it('DEF below 3 earns no statement; 3-6 earns "avoids blows well"-order', () => {
    expect(generateWarriorStatements(15, 10, 10, skills({ DEF: 2 })).defense).toBe('');
    expect(
      generateWarriorStatements(15, 10, 10, skills({ DEF: 5 })).defense.length
    ).toBeGreaterThan(0);
  });

  it('ATT below 7 earns no statement (canon: low order 7-9)', () => {
    expect(generateWarriorStatements(15, 10, 10, skills({ ATT: 6 })).attack).toBe('');
  });

  it('INI below 10 earns no statement (canon: low order 10-12)', () => {
    expect(generateWarriorStatements(15, 10, 10, skills({ INI: 9 })).initiative).toBe('');
  });
});

describe('canon statement texts', () => {
  it('INI ≥13 at high wit can yield "nothing short of a genius…"', () => {
    const personaRec = uiMeta.persona as unknown as Record<
      string,
      Record<string, Record<string, { min: number; text: string }[]>>
    >;
    const texts: string[] = (personaRec['good']?.['initiative']?.['high'] ?? []).map((e) =>
      e.text.toLowerCase()
    );
    expect(texts.some((t) => t.includes('genius'))).toBe(true);
  });

  it('persona texts contain no embedded skill numerals like "(9)"', () => {
    const leaks: string[] = [];
    const walk = (o: unknown) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        const rec = o as Record<string, unknown>;
        if (typeof rec.text === 'string' && /\(\d+\)/.test(rec.text))
          leaks.push(rec.text);
        Object.values(rec).forEach(walk);
      }
    };
    walk(uiMeta.persona);
    expect(leaks).toEqual([]);
  });

  it('bad-wit persona covers all six statement categories', () => {
    const bad = (uiMeta.persona as unknown as Record<string, unknown>).bad as Record<
      string,
      unknown
    >;
    for (const cat of ['initiative', 'riposte', 'attack', 'parry', 'defense', 'endurance']) {
      expect(bad[cat], `bad.${cat} missing`).toBeDefined();
    }
  });
});
