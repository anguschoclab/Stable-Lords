import { describe, it, expect, vi } from 'vitest';
import {
  generateFavorites,
  checkDiscovery,
  getFavoriteRhythmBonus,
  applyInsightToken,
  isWieldingFavoriteWeapon,
  mergeWeaponChart,
  suspectedFavoriteWeapon,
} from '@/engine/favorites';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior, WarriorFavorites } from '@/types/warrior.types';
import { getAvailableItems } from '@/data/equipment';
import { makeWarrior as fixtureWarrior } from '@/test/_fixtures/factories';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeMockRng(values: number[]): IRNGService {
  let i = 0;
  const next = () => values[i++] ?? 0;
  return {
    next,
    pick: <T>(arr: T[]) => arr[Math.floor(next() * arr.length)] ?? arr[0]!,
    uuid: () => 'test-uuid',
    roll: (min: number, max: number) => min + Math.floor(next() * (max - min)),
    shuffle: <T>(arr: T[]) => arr,
    rollWeighted: <K extends string>(weights: Partial<Record<K, number>>): K =>
      Object.keys(weights)[0] as K,
    chance: () => next() < 0.5,
  };
}

const makeWarrior = (
  overrides: { favorites?: WarriorFavorites; name?: string; equipment?: { weapon: string } } = {}
): Warrior =>
  fixtureWarrior({
    id: 'warrior-test' as import('@/types/shared.types').WarriorId,
    name: overrides.name ?? 'Test Warrior',
    style: FightingStyle.StrikingAttack,
    baseSkills: { ATT: 5, PAR: 5, DEF: 5, INI: 5, RIP: 5, DEC: 5 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 12 },
    fame: 0,
    age: 18,
    ...(overrides.favorites ? { favorites: overrides.favorites } : {}),
    ...(overrides.equipment ? { equipment: overrides.equipment } : {}),
  } as any);

// ─── generateFavorites ──────────────────────────────────────────────────────

describe('generateFavorites', () => {
  const ALL_STYLES = Object.values(FightingStyle).filter(
    (v): v is FightingStyle => typeof v === 'string'
  );

  it('draws a weapon from the style-appropriate pool', () => {
    const rng = makeMockRng([0, 0, 0, 0]);
    for (const style of ALL_STYLES) {
      const result = generateFavorites(style, rng);
      const pool = getAvailableItems('weapon', style);
      const expectedWeapon = pool[0];
      expect(expectedWeapon).toBeDefined();
      expect(result.weaponId).toBe(expectedWeapon!.id);
    }
  });

  it('falls back to broadsword when the pool is empty', async () => {
    const spy = vi.spyOn(await import('@/data/equipment'), 'getAvailableItems').mockReturnValue([]);
    const rng = makeMockRng([0, 0, 0, 0]);
    const result = generateFavorites(FightingStyle.StrikingAttack, rng);
    expect(result.weaponId).toBe('broadsword');
    spy.mockRestore();
  });

  it('uses style-standard rhythm range when useStyleRange = true (80% branch)', () => {
    // rng sequence: weapon idx=0, useStyleRange=true (<0.8), OE=min, AL=min
    const rng = makeMockRng([0, 0, 0, 0]);
    for (const style of ALL_STYLES) {
      const result = generateFavorites(style, rng);
      expect(result.rhythm.oe).toBeGreaterThanOrEqual(1);
      expect(result.rhythm.oe).toBeLessThanOrEqual(9);
      expect(result.rhythm.al).toBeGreaterThanOrEqual(1);
      expect(result.rhythm.al).toBeLessThanOrEqual(9);
    }
  });

  it('uses global weird range when useStyleRange = false (20% branch)', () => {
    // rng sequence: weapon idx=0, useStyleRange=false (>=0.8), OE=1, AL=1
    const rng = makeMockRng([0, 0.85, 0, 0]);
    const result = generateFavorites(FightingStyle.StrikingAttack, rng);
    expect(result.rhythm.oe).toBe(1);
    expect(result.rhythm.al).toBe(1);
  });

  it('produces OE/AL within the style range boundaries for every style', () => {
    for (const style of ALL_STYLES) {
      // Test min OE/AL via rng=0
      const rngMin = makeMockRng([0, 0, 0, 0]);
      const minResult = generateFavorites(style, rngMin);
      expect(minResult.rhythm.oe).toBeGreaterThanOrEqual(1);
      expect(minResult.rhythm.al).toBeGreaterThanOrEqual(1);

      // Test max OE/AL via rng just under 1
      const rngMax = makeMockRng([0, 0, 0.999, 0.999]);
      const maxResult = generateFavorites(style, rngMax);
      expect(maxResult.rhythm.oe).toBeLessThanOrEqual(9);
      expect(maxResult.rhythm.al).toBeLessThanOrEqual(9);
    }
  });

  it('initializes discovered state to all false/zero', () => {
    const rng = makeMockRng([0, 0, 0, 0]);
    const result = generateFavorites(FightingStyle.StrikingAttack, rng);
    expect(result.discovered).toEqual({
      weapon: false,
      rhythm: false,
      weaponHints: 0,
      rhythmHints: 0,
    });
  });
});

// ─── checkDiscovery ─────────────────────────────────────────────────────────

describe('checkDiscovery', () => {
  function makeDiscoveredFavorites(
    partial: Partial<WarriorFavorites['discovered']> = {}
  ): WarriorFavorites {
    return {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 5 },
      discovered: {
        weapon: false,
        rhythm: false,
        weaponHints: 0,
        rhythmHints: 0,
        ...partial,
      },
    };
  }

  it('returns no update when warrior has no favorites', () => {
    const warrior = makeWarrior();
    const rng = makeMockRng([0]);
    const result = checkDiscovery(warrior, rng);
    expect(result).toEqual({
      updated: false,
      hints: [],
      weaponRevealed: false,
      rhythmRevealed: false,
    });
  });

  it('reveals weapon via symmetry roll when using favorite weapon', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // Weapon: symmetry reveal (0 < 0.25); Rhythm: no reveal (0.5 >= 0.02), no hint (0.5 >= 0.1)
    const rng = makeMockRng([0, 0.5, 0.5, 0.5]);
    const result = checkDiscovery(warrior, rng, { weaponId: 'longsword', oe: 1, al: 1 });
    expect(result.updated).toBe(true);
    expect(result.weaponRevealed).toBe(true);
    expect(result.hints.length).toBe(1);
    expect(fav.discovered.weapon).toBe(true);
  });

  it('reveals weapon via base lucky epiphany roll', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // Not using favorite weapon: revealRoll = 0.02. First r() = 0.01 < 0.02 triggers base reveal.
    // Rhythm: no reveal (0.5 >= 0.02), no hint (0.5 >= 0.1)
    const rng = makeMockRng([0.01, 0.5, 0.5, 0.5]);
    const result = checkDiscovery(warrior, rng, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(result.updated).toBe(true);
    expect(result.weaponRevealed).toBe(true);
    expect(fav.discovered.weapon).toBe(true);
  });

  it('accumulates weapon hints up to 2', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // First call: no reveal, hint (0.3 >= 0.25, 0.05 < 0.1)
    const rng1 = makeMockRng([0.3, 0.05]);
    const r1 = checkDiscovery(warrior, rng1, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(r1.updated).toBe(true);
    expect(fav.discovered.weaponHints).toBe(1);

    // Second call: no reveal, hint again (0.3 >= 0.25, 0.05 < 0.1)
    const rng2 = makeMockRng([0.3, 0.05]);
    const r2 = checkDiscovery(warrior, rng2, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(r2.updated).toBe(true);
    expect(fav.discovered.weaponHints).toBe(2);

    // Third call: maxed hints, no update
    const rng3 = makeMockRng([0.3, 0.05]);
    const r3 = checkDiscovery(warrior, rng3, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(r3.updated).toBe(false);
    expect(fav.discovered.weaponHints).toBe(2);
  });

  it('reveals rhythm via symmetry when current plan is close', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // Weapon: no reveal (0.3 >= 0.25, 0.2 >= 0.1)
    // Rhythm: match! (oe=7,al=5 vs context oe=6,al=6 => within ±1), then rng < 0.25
    const rng = makeMockRng([0.3, 0.2, 0.1, 0]);
    const result = checkDiscovery(warrior, rng, { weaponId: 'dagger', oe: 6, al: 6 });
    expect(result.updated).toBe(true);
    expect(result.rhythmRevealed).toBe(true);
    expect(fav.discovered.rhythm).toBe(true);
  });

  it('reveals rhythm via base lucky epiphany', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // Weapon: no reveal (0.3 >= 0.25), no hint (0.2 >= 0.1)
    // Rhythm: no match, first r() = 0.01 < 0.02 triggers base reveal
    const rng = makeMockRng([0.3, 0.2, 0.01, 0.5]);
    const result = checkDiscovery(warrior, rng, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(result.updated).toBe(true);
    expect(result.rhythmRevealed).toBe(true);
    expect(fav.discovered.rhythm).toBe(true);
  });

  it('accumulates rhythm hints up to 2', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // No weapon reveal, no hint (0.3, 0.2)
    // No rhythm reveal, hint (0.3 >= 0.02, 0.05 < 0.1)
    const rng1 = makeMockRng([0.3, 0.2, 0.3, 0.05]);
    checkDiscovery(warrior, rng1, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(fav.discovered.rhythmHints).toBe(1);

    const rng2 = makeMockRng([0.3, 0.2, 0.3, 0.05]);
    checkDiscovery(warrior, rng2, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(fav.discovered.rhythmHints).toBe(2);

    const rng3 = makeMockRng([0.3, 0.2, 0.3, 0.05]);
    const r3 = checkDiscovery(warrior, rng3, { weaponId: 'dagger', oe: 1, al: 1 });
    expect(r3.updated).toBe(false);
    expect(fav.discovered.rhythmHints).toBe(2);
  });

  it('does not double-reveal weapon in a single call', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // Symmetry reveal (0 < 0.25); Rhythm: no reveal/hint to keep count at 1
    const rng = makeMockRng([0, 0.5, 0.5, 0.5]);
    const result = checkDiscovery(warrior, rng, { weaponId: 'longsword', oe: 1, al: 1 });
    expect(result.hints.length).toBe(1);
    expect(result.weaponRevealed).toBe(true);
  });

  it('does not double-reveal rhythm in a single call', () => {
    const fav = makeDiscoveredFavorites();
    const warrior = makeWarrior({ favorites: fav });
    // Weapon: no reveal, no hint (0.3, 0.2)
    // Rhythm: symmetry match, reveal (0.1 < 0.25)
    const rng = makeMockRng([0.3, 0.2, 0.1, 0]);
    const result = checkDiscovery(warrior, rng, { weaponId: 'dagger', oe: 6, al: 6 });
    expect(result.hints.length).toBe(1);
    expect(result.rhythmRevealed).toBe(true);
  });
});

// ─── getFavoriteRhythmBonus ─────────────────────────────────────────────────

describe('getFavoriteRhythmBonus', () => {
  it('returns 0 when warrior has no favorites', () => {
    const warrior = makeWarrior();
    expect(getFavoriteRhythmBonus(warrior, 7, 5)).toBe(0);
  });

  it('returns 0 when rhythm is not discovered', () => {
    const warrior = makeWarrior({
      favorites: {
        weaponId: 'longsword',
        rhythm: { oe: 7, al: 5 },
        discovered: { weapon: true, rhythm: false, weaponHints: 0, rhythmHints: 0 },
      },
    });
    expect(getFavoriteRhythmBonus(warrior, 7, 5)).toBe(0);
  });

  it('returns 0 when current plan is far from favorite', () => {
    const warrior = makeWarrior({
      favorites: {
        weaponId: 'longsword',
        rhythm: { oe: 7, al: 5 },
        discovered: { weapon: true, rhythm: true, weaponHints: 0, rhythmHints: 0 },
      },
    });
    expect(getFavoriteRhythmBonus(warrior, 1, 1)).toBe(0);
    expect(getFavoriteRhythmBonus(warrior, 9, 9)).toBe(0);
    expect(getFavoriteRhythmBonus(warrior, 5, 5)).toBe(0); // OE delta = 2
  });

  it('returns 1 for close match (within ±1 on both axes)', () => {
    const warrior = makeWarrior({
      favorites: {
        weaponId: 'longsword',
        rhythm: { oe: 7, al: 5 },
        discovered: { weapon: true, rhythm: true, weaponHints: 0, rhythmHints: 0 },
      },
    });
    expect(getFavoriteRhythmBonus(warrior, 6, 5)).toBe(1); // OE -1
    expect(getFavoriteRhythmBonus(warrior, 8, 5)).toBe(1); // OE +1
    expect(getFavoriteRhythmBonus(warrior, 7, 4)).toBe(1); // AL -1
    expect(getFavoriteRhythmBonus(warrior, 7, 6)).toBe(1); // AL +1
    expect(getFavoriteRhythmBonus(warrior, 6, 6)).toBe(1); // both ±1
  });

  it('returns 2 for perfect match (exact OE and AL)', () => {
    const warrior = makeWarrior({
      favorites: {
        weaponId: 'longsword',
        rhythm: { oe: 7, al: 5 },
        discovered: { weapon: true, rhythm: true, weaponHints: 0, rhythmHints: 0 },
      },
    });
    expect(getFavoriteRhythmBonus(warrior, 7, 5)).toBe(2);
  });

  it('accepts any object exposing favorites (e.g. a FighterState), not just a full Warrior', () => {
    // A minimal structural object — this is what FighterState provides.
    const fighterLike = {
      favorites: {
        // shape mirrors WarriorFavorites enough for the rhythm path
        weaponId: 'longsword',
        discovered: { rhythm: true, weapon: false, weaponHints: 0, rhythmHints: 0 },
        rhythm: { oe: 7, al: 5 },
      },
    } as const;
    // @ts-expect-no-error — should compile once the signature is narrowed.
    expect(getFavoriteRhythmBonus(fighterLike as any, 7, 5)).toBe(2);
  });
});

// ─── applyInsightToken ──────────────────────────────────────────────────────

describe('applyInsightToken', () => {
  it('returns early when warrior has no favorites', () => {
    const warrior = makeWarrior();
    expect(applyInsightToken(warrior, 'weapon')).toContain('no hidden favorites');
  });

  it('returns early when weapon already discovered', () => {
    const warrior = makeWarrior({
      favorites: {
        weaponId: 'longsword',
        rhythm: { oe: 7, al: 5 },
        discovered: { weapon: true, rhythm: false, weaponHints: 0, rhythmHints: 0 },
      },
    });
    expect(applyInsightToken(warrior, 'weapon')).toContain('already knows');
  });

  it('returns early when rhythm already discovered', () => {
    const warrior = makeWarrior({
      favorites: {
        weaponId: 'longsword',
        rhythm: { oe: 7, al: 5 },
        discovered: { weapon: false, rhythm: true, weaponHints: 0, rhythmHints: 0 },
      },
    });
    expect(applyInsightToken(warrior, 'rhythm')).toContain('already knows');
  });

  it('reveals weapon and mutates state', () => {
    const fav: WarriorFavorites = {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 5 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    };
    const warrior = makeWarrior({ favorites: fav });
    const msg = applyInsightToken(warrior, 'weapon');
    expect(msg).toContain('Longsword');
    expect(fav.discovered.weapon).toBe(true);
  });

  it('reveals rhythm and mutates state', () => {
    const fav: WarriorFavorites = {
      weaponId: 'longsword',
      rhythm: { oe: 7, al: 5 },
      discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    };
    const warrior = makeWarrior({ favorites: fav });
    const msg = applyInsightToken(warrior, 'rhythm');
    expect(msg).toContain('OE 7');
    expect(msg).toContain('AL 5');
    expect(fav.discovered.rhythm).toBe(true);
  });
});

// ─── isWieldingFavoriteWeapon ───────────────────────────────────────────────

describe('isWieldingFavoriteWeapon', () => {
  const fav: WarriorFavorites = {
    weaponId: 'longsword',
    rhythm: { oe: 7, al: 5 },
    discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
  };

  it('is true on a weapon-id match regardless of discovery', () => {
    expect(isWieldingFavoriteWeapon(fav, 'longsword')).toBe(true);
  });

  it('is false on mismatch, missing favorites, or missing weapon', () => {
    expect(isWieldingFavoriteWeapon(fav, 'dagger')).toBe(false);
    expect(isWieldingFavoriteWeapon(undefined, 'longsword')).toBe(false);
    expect(isWieldingFavoriteWeapon(fav, undefined)).toBe(false);
  });
});

// ─── mergeWeaponChart ───────────────────────────────────────────────────────

describe('mergeWeaponChart', () => {
  const baseFav = (): WarriorFavorites => ({
    weaponId: 'longsword',
    rhythm: { oe: 7, al: 5 },
    discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
  });

  it('returns undefined when there is no favorites record or no tally', () => {
    expect(mergeWeaponChart(undefined, { x: { swings: 1, crits: 0, knockdowns: 0 } })).toBeUndefined();
    expect(mergeWeaponChart(baseFav(), undefined)).toBeUndefined();
    expect(mergeWeaponChart(baseFav(), {})).toBeUndefined();
  });

  it('seeds a chart row for a newly wielded weapon', () => {
    const merged = mergeWeaponChart(baseFav(), {
      short_spear: { swings: 12, crits: 4, knockdowns: 1 },
    });
    expect(merged?.chart?.short_spear).toEqual({ swings: 12, crits: 4, knockdowns: 1 });
  });

  it('accumulates across bouts and tracks multiple weapons independently', () => {
    const fav = baseFav();
    const first = mergeWeaponChart(fav, {
      scimitar: { swings: 16, crits: 2, knockdowns: 1 },
    });
    const second = mergeWeaponChart(first, {
      scimitar: { swings: 5, crits: 1, knockdowns: 0 },
      short_spear: { swings: 15, crits: 7, knockdowns: 2 },
    });
    expect(second?.chart?.scimitar).toEqual({ swings: 21, crits: 3, knockdowns: 1 });
    expect(second?.chart?.short_spear).toEqual({ swings: 15, crits: 7, knockdowns: 2 });
  });

  it('does not mutate the input favorites object', () => {
    const fav = baseFav();
    mergeWeaponChart(fav, { dagger: { swings: 3, crits: 1, knockdowns: 0 } });
    expect(fav.chart).toBeUndefined();
  });
});

// ─── suspectedFavoriteWeapon ────────────────────────────────────────────────

describe('suspectedFavoriteWeapon', () => {
  const fav = (over: Partial<WarriorFavorites> = {}): WarriorFavorites => ({
    weaponId: 'longsword',
    rhythm: { oe: 7, al: 5 },
    discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
    ...over,
  });

  it('returns the discovered favorite outright', () => {
    const f = fav({
      discovered: { weapon: true, rhythm: false, weaponHints: 0, rhythmHints: 0 },
      chart: { dagger: { swings: 30, crits: 9, knockdowns: 0 } },
    });
    expect(suspectedFavoriteWeapon(f)).toBe('longsword');
  });

  it('reads a chart suspect — elevated crit rate over a real sample', () => {
    const f = fav({
      chart: {
        scimitar: { swings: 16, crits: 2, knockdowns: 1 }, // 12.5% — doubtful
        short_spear: { swings: 15, crits: 7, knockdowns: 2 }, // 47% — BINGO
      },
    });
    expect(suspectedFavoriteWeapon(f)).toBe('short_spear');
  });

  it('ignores small samples and low-rate rows', () => {
    const f = fav({
      chart: {
        dagger: { swings: 4, crits: 4, knockdowns: 0 }, // 100% but too few swings
        mace: { swings: 40, crits: 2, knockdowns: 0 }, // 5% — doubtful
      },
    });
    expect(suspectedFavoriteWeapon(f)).toBeUndefined();
  });

  it('returns undefined without favorites or a chart', () => {
    expect(suspectedFavoriteWeapon(undefined)).toBeUndefined();
    expect(suspectedFavoriteWeapon(fav())).toBeUndefined();
  });

  it('fists can be a favorite — generation pool and suspect read both allow it', () => {
    // 'fist' is pool[0] for Striking Attack (not restricted) — rng=0 lands it.
    const rng = makeMockRng([0, 0, 0, 0]);
    const generated = generateFavorites(FightingStyle.StrikingAttack, rng);
    expect(generated.weaponId).toBe('fist');

    const f = fav({
      weaponId: 'fist',
      chart: { fist: { swings: 20, crits: 5, knockdowns: 1 } },
    });
    expect(suspectedFavoriteWeapon(f)).toBe('fist');
    expect(isWieldingFavoriteWeapon(f, 'fist')).toBe(true);
  });
});
