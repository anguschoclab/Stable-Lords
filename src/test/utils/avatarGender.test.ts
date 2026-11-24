import { describe, it, expect } from 'vitest';
import { genderFromAvatarSeed } from '@/utils/avatarGender';

describe('genderFromAvatarSeed', () => {
  it('returns a valid AvatarGender for every seed', () => {
    const valid = new Set(['masc', 'fem', 'neutral']);
    for (let seed = 0; seed < 500; seed++) {
      expect(valid.has(genderFromAvatarSeed(seed))).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    expect(genderFromAvatarSeed(123456)).toBe(genderFromAvatarSeed(123456));
  });

  it('spans all three buckets across seeds', () => {
    const seen = new Set(Array.from({ length: 200 }, (_, i) => genderFromAvatarSeed(i)));
    expect(seen.has('masc')).toBe(true);
    expect(seen.has('fem')).toBe(true);
    expect(seen.has('neutral')).toBe(true);
  });

  it('handles seed zero, negatives, and non-integers', () => {
    expect(genderFromAvatarSeed(0)).toBe('masc');
    expect(genderFromAvatarSeed(-7)).toBe('masc');
    expect(genderFromAvatarSeed(95.9)).toBe('neutral');
  });
});
