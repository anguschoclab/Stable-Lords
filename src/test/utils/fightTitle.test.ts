import { describe, it, expect } from 'vitest';
import { getNamesFromTitle } from '@/utils/fightTitle';

describe('getNamesFromTitle', () => {
  it('parses a plain "A vs B" title', () => {
    expect(getNamesFromTitle('AARON vs BRAN')).toEqual({ a: 'AARON', d: 'BRAN' });
  });

  it('strips a tournament parenthetical suffix', () => {
    expect(getNamesFromTitle('AARON vs BRAN (Spring Cup)')).toEqual({ a: 'AARON', d: 'BRAN' });
  });

  it('returns Unknown for both names on an empty string', () => {
    expect(getNamesFromTitle('')).toEqual({ a: 'Unknown', d: 'Unknown' });
  });

  it('returns Unknown for a missing defender', () => {
    expect(getNamesFromTitle('AARON vs ')).toEqual({ a: 'AARON', d: 'Unknown' });
  });

  it('returns Unknown for a missing attacker', () => {
    expect(getNamesFromTitle(' vs BRAN')).toEqual({ a: 'Unknown', d: 'BRAN' });
  });

  it('preserves spaces inside multi-word names', () => {
    expect(getNamesFromTitle('Marcus the Bold vs Linnea of Vale (Tourney)')).toEqual({
      a: 'Marcus the Bold',
      d: 'Linnea of Vale',
    });
  });

  it('discards a parenthetical that itself contains " vs "', () => {
    expect(getNamesFromTitle('AARON vs BRAN (A vs B Cup)')).toEqual({ a: 'AARON', d: 'BRAN' });
  });

  it('preserves a defender name that itself contains " vs "', () => {
    expect(getNamesFromTitle('AARON vs BRAN the Mighty vs Slayer')).toEqual({
      a: 'AARON',
      d: 'BRAN the Mighty vs Slayer',
    });
  });
});
