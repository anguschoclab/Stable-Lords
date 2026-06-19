import { describe, it, expect } from 'vitest';
import { generateTraits, TRAITS } from '@/engine/traits';
import { SeededRNG } from '@/utils/random';

describe('Trait generation amplifies identity (low cross-style noise)', () => {
  it('a brutal archetype rarely rolls anti-synergy traits', () => {
    const rng = new SeededRNG(12345);
    let total = 0;
    let antiSyn = 0;
    for (let i = 0; i < 2000; i++) {
      const ids = generateTraits(rng, 'brutal');
      for (const id of ids) {
        total++;
        if (TRAITS[id]?.antiSynergy?.includes('brutal')) antiSyn++;
      }
    }
    const share = total > 0 ? antiSyn / total : 0;
    // Target: anti-synergy traits make up < 8% of a brutal fighter's traits.
    expect(share, `anti-synergy share ${(share * 100).toFixed(1)}%`).toBeLessThan(0.08);
  });

  it('still produces varied traits (amplified, not collapsed to one)', () => {
    const rng = new SeededRNG(54321);
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      for (const id of generateTraits(rng, 'brutal')) seen.add(id);
    }
    // A brutal fighter should still draw from a healthy palette, not 1-2 traits.
    expect(seen.size, `distinct brutal traits seen: ${seen.size}`).toBeGreaterThanOrEqual(6);
  });
});
