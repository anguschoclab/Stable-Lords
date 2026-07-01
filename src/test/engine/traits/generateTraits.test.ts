import { describe, it, expect } from 'vitest';
import { generateTraits, TRAITS } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';

describe('generateTraits (sparse, tier-aware)', () => {
  const sample = (n: number) => {
    const rng = new SeededRNGService(12345);
    const out: string[][] = [];
    for (let i = 0; i < n; i++) out.push(generateTraits(rng, 'brutal'));
    return out;
  };

  it('most warriors are born blank (~68%, never more than one trait)', () => {
    const rolls = sample(1000);
    const blank = rolls.filter((r) => r.length === 0).length / rolls.length;
    expect(blank, `blank rate ${(blank * 100).toFixed(1)}%`).toBeGreaterThan(0.6);
    expect(rolls.every((r) => r.length <= 1)).toBe(true);
  });

  it('never grants Exceptional/Signature or class-restricted traits at birth', () => {
    for (const r of sample(1000)) {
      for (const id of r) {
        const t = TRAITS[id]!;
        expect(['Exceptional', 'Signature'].includes(t.tier), `${id} tier`).toBe(false);
        expect(t.styles, `${id} is class-restricted`).toBeUndefined();
      }
    }
  });

  it('a minority are born with a single Flaw', () => {
    const rolls = sample(1000);
    const flawed =
      rolls.filter((r) => r.some((id) => TRAITS[id]!.tier === 'Flaw')).length / rolls.length;
    expect(flawed, `flaw rate ${(flawed * 100).toFixed(1)}%`).toBeGreaterThan(0.03);
    expect(flawed).toBeLessThan(0.12);
  });
});
