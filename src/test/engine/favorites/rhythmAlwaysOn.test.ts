/**
 * V25 Phase-7.1 — favorite-rhythm bonus is always on. Canon (Assur):
 * a warrior fights better at their favorite rhythm whether or not the
 * manager has discovered it — matching the favorite-weapon/tactic
 * precedent. Currently gated behind `discovered.rhythm`.
 */
import { describe, it, expect } from 'vitest';
import { getFavoriteRhythmBonus } from '@/engine/favorites/favorites';

const fav = (oe: number, al: number, discovered = false) => ({
  favorites: {
    weaponId: 'broadsword',
    rhythm: { oe, al },
    discovered: {
      weapon: false,
      rhythm: discovered,
      weaponHints: 0,
      rhythmHints: 0,
      learn: false,
      learnHints: 0,
    },
  },
});

describe('getFavoriteRhythmBonus — always-on (canon)', () => {
  it('perfect match grants +2 even while undiscovered', () => {
    expect(getFavoriteRhythmBonus(fav(6, 5, false), 6, 5)).toBe(2);
  });

  it('close match grants +1 even while undiscovered', () => {
    expect(getFavoriteRhythmBonus(fav(6, 5, false), 7, 5)).toBe(1);
  });

  it('off-rhythm grants 0 regardless of discovery', () => {
    expect(getFavoriteRhythmBonus(fav(6, 5, false), 1, 1)).toBe(0);
    expect(getFavoriteRhythmBonus(fav(6, 5, true), 1, 1)).toBe(0);
  });

  it('no favorites grants 0', () => {
    expect(getFavoriteRhythmBonus({ favorites: undefined }, 6, 5)).toBe(0);
  });
});
