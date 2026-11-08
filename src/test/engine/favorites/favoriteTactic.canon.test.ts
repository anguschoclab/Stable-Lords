/**
 * V24 canon — favorite tactics (Pagan's favorites chart, Arena 93):
 * every warrior has a favorite tactic drawn from the style's possible
 * favorites; it fires hidden like the favorite weapon (Godling Heresy).
 */
import { describe, it, expect } from 'vitest';
import {
  generateFavorites,
  getFavoriteTacticBonus,
  FAVORITE_TACTIC_POOLS,
} from '@/engine/favorites/favorites';
import { getOffensiveSuitability, getDefensiveSuitability } from '@/engine/strategy/tacticSuitability';
import { FightingStyle } from '@/types/shared.types';
import { FAVORITE_TACTIC_BONUS } from '@/constants/combat';

const rng = { next: () => 0.5, roll: (a: number, _b: number) => a, rollWeighted: (w: Record<string, number>) => Object.keys(w)[0] } as never;

describe('favorite tactic generation', () => {
  it('every generated warrior has a favorite tactic', () => {
    for (const style of Object.values(FightingStyle)) {
      const fav = generateFavorites(style, rng);
      expect(fav.tactic, `${style} rolled no favorite tactic`).toBeDefined();
    }
  });

  it('the favorite always comes from the style’s possible set (WS-rated)', () => {
    for (const style of Object.values(FightingStyle)) {
      const fav = generateFavorites(style, rng);
      const suited =
        getOffensiveSuitability(style, fav.tactic as never) === 'WS' ||
        getDefensiveSuitability(style, fav.tactic as never) === 'WS';
      expect(suited, `${style} favorite ${fav.tactic} is not WS-rated`).toBe(true);
    }
  });

  it('PR/PS/PL pools use the article weights', () => {
    expect(FAVORITE_TACTIC_POOLS[FightingStyle.ParryRiposte]).toEqual([
      { tactic: 'Lunge', weight: 3 },
      { tactic: 'Riposte', weight: 11 },
      { tactic: 'Parry', weight: 6 },
    ]);
    expect(FAVORITE_TACTIC_POOLS[FightingStyle.ParryStrike]?.map((p) => p.tactic)).toEqual(
      ['Decisiveness', 'Responsiveness', 'Dodge', 'Riposte', 'Parry']
    );
    expect(FAVORITE_TACTIC_POOLS[FightingStyle.ParryLunge]?.map((p) => p.tactic)).toEqual(
      ['Lunge', 'Dodge', 'Parry']
    );
  });
});

describe('favorite tactic bonus — hidden like the favorite weapon', () => {
  const warriorWith = (tactic: string) => ({
    favorites: {
      weaponId: 'scimitar',
      rhythm: { oe: 5, al: 5 },
      tactic,
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    },
  });

  it('fires when the plan uses the favorite — undiscovered or not', () => {
    const w = warriorWith('Parry');
    expect(getFavoriteTacticBonus(w, 'Parry')).toBe(FAVORITE_TACTIC_BONUS);
  });

  it('does not fire on a different tactic', () => {
    const w = warriorWith('Parry');
    expect(getFavoriteTacticBonus(w, 'Dodge')).toBe(0);
    expect(getFavoriteTacticBonus(w, undefined)).toBe(0);
  });
});
