import { describe, it, expect } from 'vitest';
import { generateTraits, TRAITS } from '@/engine/traits';
import { SeededRNG } from '@/utils/random';

describe('generateTraits (sparse, tier-aware)', () => {
  const sample = (n: number) => {
    const rng = new SeededRNG(12345);
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

  it('biases the positive pick toward archetype synergy and away from anti-synergy', () => {
    const share = (archetype: 'brutal' | 'agile', pred: (id: string) => boolean) => {
      const rng = new SeededRNG(777);
      let hit = 0;
      let nonBlank = 0;
      for (let i = 0; i < 4000; i++) {
        const rolled = generateTraits(rng, archetype);
        if (rolled.length === 0) continue;
        nonBlank++;
        if (rolled.some(pred)) hit++;
      }
      return hit / nonBlank;
    };
    // Birth-eligible Notables with synergy:['brutal'] — ashen_lungs,
    // pit_fighter, iron_vein — should be picked more often for 'brutal'.
    const brutalSynergy = (id: string) => (TRAITS[id]!.synergy ?? []).includes('brutal');
    // silent_one / cold_eyed carry antiSynergy:['brutal'] — suppressed under 'brutal'.
    const brutalAnti = (id: string) => (TRAITS[id]!.antiSynergy ?? []).includes('brutal');

    expect(share('brutal', brutalSynergy)).toBeGreaterThan(share('agile', brutalSynergy));
    expect(share('brutal', brutalAnti)).toBeLessThan(share('agile', brutalAnti));
  });
});
