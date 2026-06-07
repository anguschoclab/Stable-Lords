import { describe, it, expect } from 'vitest';
import { rollLuckfactor, applyLuckfactor, computeBaseSkills } from '@/engine/skillCalc';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FightingStyle, type BaseSkills } from '@/types/shared.types';

const SKILLS: (keyof BaseSkills)[] = ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'];

describe('luckfactor', () => {
  it('rolls a delta in [-4, +4] for each of the 6 skills', () => {
    const rng = new SeededRNGService(12345);
    for (let i = 0; i < 200; i++) {
      const luck = rollLuckfactor(rng);
      for (const s of SKILLS) {
        expect(luck[s]).toBeGreaterThanOrEqual(-4);
        expect(luck[s]).toBeLessThanOrEqual(4);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(rollLuckfactor(new SeededRNGService(7))).toEqual(
      rollLuckfactor(new SeededRNGService(7))
    );
  });

  it('produces variety (two seeds differ)', () => {
    const a = rollLuckfactor(new SeededRNGService(1));
    const b = rollLuckfactor(new SeededRNGService(2));
    expect(a).not.toEqual(b);
  });

  it('applyLuckfactor adds deltas and floors each skill at 1', () => {
    const base: BaseSkills = { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 };
    expect(applyLuckfactor(base, { ATT: 3, DEF: -2 })).toMatchObject({ ATT: 13, DEF: 8 });
    // floor at 1 even with a large negative delta against a tiny base
    expect(applyLuckfactor({ ...base, RIP: 2 }, { RIP: -4 }).RIP).toBe(1);
  });

  it('applyLuckfactor with no luck returns skills unchanged (overview is luck-free)', () => {
    const base = computeBaseSkills(
      { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
      FightingStyle.StrikingAttack
    );
    expect(applyLuckfactor(base, undefined)).toBe(base);
  });
});
