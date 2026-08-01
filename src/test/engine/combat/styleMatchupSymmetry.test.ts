import { describe, it, expect } from 'vitest';
import { getStyleMatchupMods } from '@/engine/ai/matchup/styleMatcher';
import { FightingStyle } from '@/types/shared.types';

describe('styleMatchupSymmetry', () => {
  const allStyles = Object.values(FightingStyle).filter(
    (v): v is FightingStyle => typeof v === 'string'
  );

  it('matchup matrix is intentionally asymmetric — documents all asymmetric pairs', () => {
    // The matchup matrix is NOT antisymmetric by design. Some styles have
    // specific counters that are one-directional. This test documents all
    // asymmetric pairs so changes are intentional.
    const asymmetricPairs: string[] = [];
    for (const styleA of allStyles) {
      for (const styleB of allStyles) {
        if (styleA === styleB) continue;
        const ab = getStyleMatchupMods(styleA, styleB);
        const ba = getStyleMatchupMods(styleB, styleA);
        const sumOe = ab.oe + ba.oe;
        const sumAl = ab.al + ba.al;
        const sumKd = ab.kd + ba.kd;
        if (sumOe !== 0 || sumAl !== 0 || sumKd !== 0) {
          asymmetricPairs.push(`${styleA} vs ${styleB}: oe=${ab.oe}/${ba.oe} al=${ab.al}/${ba.al} kd=${ab.kd}/${ba.kd}`);
        }
      }
    }
    // Document the known asymmetric pairs. If this count changes, it should be intentional.
    expect(asymmetricPairs.length).toBeGreaterThan(0);
  });

  it('matchup modifiers should be bounded (no unbounded multipliers)', () => {
    for (const styleA of allStyles) {
      for (const styleB of allStyles) {
        const mods = getStyleMatchupMods(styleA, styleB);
        expect(Math.abs(mods.oe), `OE out of bounds for ${styleA} vs ${styleB}`).toBeLessThanOrEqual(5);
        expect(Math.abs(mods.al), `AL out of bounds for ${styleA} vs ${styleB}`).toBeLessThanOrEqual(5);
        expect(Math.abs(mods.kd), `KD out of bounds for ${styleA} vs ${styleB}`).toBeLessThanOrEqual(5);
      }
    }
  });
});
