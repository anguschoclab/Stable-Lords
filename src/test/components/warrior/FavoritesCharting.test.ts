import { describe, it, expect } from 'vitest';
import { buildFavoritesChart } from '@/components/warrior/favorites/FavoritesCharting';
import { makeWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/game';

/** Pins weapon-name resolution (WEAPONS.find → getItemById) and counts. */
describe('buildFavoritesChart', () => {
  function withFavorites(id: string, weaponId: string, over: Partial<Warrior> = {}): Warrior {
    return makeWarrior({
      id,
      favorites: {
        weaponId,
        rhythm: { oe: 8, al: 7 },
        discovered: { weapon: true, rhythm: true },
      },
      ...over,
    } as Partial<Warrior>);
  }

  it('resolves display names for known weapons and counts duplicates', () => {
    const chart = buildFavoritesChart([
      withFavorites('w1', 'broadsword'),
      withFavorites('w2', 'broadsword'),
      withFavorites('w3', 'epee'),
    ]);
    expect(chart.total).toBe(3);
    expect(chart.weaponDiscovered).toBe(3);
    expect(chart.weaponRows[0]).toMatchObject({ weaponId: 'broadsword', count: 2 });
    expect(chart.weaponRows[0]!.name).not.toBe('broadsword'); // resolved display name
    expect(chart.maxWeapon).toBe(2);
  });

  it('falls back to the raw id for unknown weapons', () => {
    const chart = buildFavoritesChart([withFavorites('w1', 'not_a_weapon')]);
    expect(chart.weaponRows[0]!.name).toBe('not_a_weapon');
  });

  it('excludes inactive warriors and undiscovered favorites', () => {
    const chart = buildFavoritesChart([
      withFavorites('w1', 'broadsword', { status: 'Dead' as any }),
      makeWarrior({
        id: 'w2',
        favorites: {
          weaponId: 'mace',
          rhythm: { oe: 2, al: 2 },
          discovered: { weapon: false, rhythm: true },
        },
      } as Partial<Warrior>),
    ]);
    expect(chart.total).toBe(1);
    expect(chart.weaponDiscovered).toBe(0);
    expect(chart.weaponRows).toHaveLength(0);
    expect(chart.rhythmRows[0]!.count).toBe(1);
    expect(chart.rhythmRows[0]!.band).toBe('Conservative / Patient');
  });
});
