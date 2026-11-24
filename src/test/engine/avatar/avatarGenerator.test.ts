import { describe, it, expect, beforeEach } from 'vitest';
import {
  ageGroupForAge,
  avatarDescription,
  clothingCategoryForStyle,
  generateAvatar,
  seedForEntity,
  wearScore,
} from '@/engine/avatar/avatarGenerator';
import { setAvatarCatalog } from '@/engine/avatar/avatarCatalog';
import {
  createTestAvatarCatalog,
  createTestPortraitCatalog,
} from '@/test/_fixtures/avatarCatalog';
import { FightingStyle } from '@/types/shared.types';
import type { AvatarCatalogEntry, AvatarConfig } from '@/types/avatar.types';

function baseConfig(overrides?: Partial<AvatarConfig>): AvatarConfig {
  return {
    entityId: 'w-1',
    entityType: 'warrior',
    seed: 12345,
    name: 'Aulus',
    age: 25,
    ...overrides,
  };
}

describe('avatarGenerator', () => {
  it('is deterministic for the same config', () => {
    const config = baseConfig();
    const a = generateAvatar(config);
    const b = generateAvatar(config);
    expect(a).toEqual(b);
  });

  it('produces different portraits for different seeds', () => {
    const a = generateAvatar(baseConfig({ seed: 11111 }));
    const b = generateAvatar(baseConfig({ seed: 22222 }));
    expect(a.layers).not.toEqual(b.layers);
  });

  it('derives a stable portrait from entity id + type when no seed is supplied', () => {
    const a = generateAvatar({ entityId: 'w-1', entityType: 'warrior', name: 'A' });
    const b = generateAvatar({ entityId: 'w-1', entityType: 'warrior', name: 'A' });
    const c = generateAvatar({ entityId: 'w-2', entityType: 'warrior', name: 'B' });
    expect(a).toEqual(b);
    expect(a.layers).not.toEqual(c.layers);
  });

  it('maps ages to the expected age groups', () => {
    expect(generateAvatar(baseConfig({ age: 17 })).ageGroup).toBe('young');
    expect(generateAvatar(baseConfig({ age: 25 })).ageGroup).toBe('adult');
    expect(generateAvatar(baseConfig({ age: 40 })).ageGroup).toBe('middle');
    expect(generateAvatar(baseConfig({ age: 55 })).ageGroup).toBe('elder');
  });

  it('produces different clothing for different fighting styles', () => {
    const heavy = generateAvatar(baseConfig({ style: FightingStyle.BashingAttack }));
    const light = generateAvatar(baseConfig({ style: FightingStyle.AimedBlow }));
    const heavyClothing = heavy.layers.find((l) => l.category === 'clothing');
    const lightClothing = light.layers.find((l) => l.category === 'clothing');
    expect(heavyClothing?.src).not.toBe(lightClothing?.src);
  });

  it('adds scar/eyepatch markings for high-wear warriors', () => {
    const young = generateAvatar(baseConfig({ age: 18, kills: 0, injuries: [] }));
    const veteran = generateAvatar(
      baseConfig({ age: 50, kills: 10, injuries: Array(5).fill('scar') })
    );
    const youngMarks = young.layers.filter((l) => l.category === 'markings');
    const vetMarks = veteran.layers.filter((l) => l.category === 'markings');
    expect(vetMarks.length).toBeGreaterThan(youngMarks.length);
  });

  it('exports stable seed and exact age helpers', () => {
    expect(seedForEntity('warrior', 'w-1')).toBe(seedForEntity('warrior', 'w-1'));
    expect(seedForEntity('warrior', 'w-1')).not.toBe(seedForEntity('trainer', 'w-1'));
    expect([19, 20, 34, 35, 49, 50].map(ageGroupForAge)).toEqual([
      'young',
      'adult',
      'adult',
      'middle',
      'middle',
      'elder',
    ]);
  });

  it('increases wear and description severity with career history', () => {
    const novice = baseConfig({ age: 18, kills: 0, fame: 0, injuries: [] });
    const veteran = baseConfig({ age: 55, kills: 10, fame: 2500, injuries: ['scar', 'break'] });
    expect(wearScore(veteran)).toBeGreaterThan(wearScore(novice));
    expect(avatarDescription(veteran)).toBe('Scarred Veteran of the Arena');
  });

  it('maps fighting styles to thematic clothing tags', () => {
    expect(clothingCategoryForStyle(FightingStyle.BashingAttack)).toBe('heavy');
    expect(clothingCategoryForStyle(FightingStyle.TotalParry)).toBe('defensive');
    expect(clothingCategoryForStyle(FightingStyle.AimedBlow)).toBe('light');
  });

  it('orders layers by ascending z value', () => {
    const avatar = generateAvatar(baseConfig());
    const zs = avatar.layers.map((l) => l.z);
    expect(zs).toEqual([...zs].sort((a, b) => a - b));
  });
});

describe('avatarGenerator — portraits path (V32)', () => {
  const pool = createTestPortraitCatalog();
  const entryBySrc = (src: string): AvatarCatalogEntry | undefined =>
    (pool.categories.portraits ?? []).find((e) => e.src === src);
  const tagsOf = (avatar: ReturnType<typeof generateAvatar>): string[] =>
    entryBySrc(avatar.layers[0]?.src ?? '')?.tags ?? [];

  beforeEach(() => {
    setAvatarCatalog(pool);
  });

  it('emits exactly one portraits layer at z=0', () => {
    const avatar = generateAvatar(baseConfig());
    expect(avatar.layers).toHaveLength(1);
    expect(avatar.layers[0]?.category).toBe('portraits');
    expect(avatar.layers[0]?.z).toBe(0);
    expect(avatar.layers[0]?.src).toContain('/avatars/portraits/');
  });

  it('is deterministic for the same seed and varies across seeds', () => {
    const a = generateAvatar(baseConfig({ seed: 111 }));
    const b = generateAvatar(baseConfig({ seed: 111 }));
    expect(a.layers[0]?.src).toBe(b.layers[0]?.src);

    const picks = new Set(
      Array.from({ length: 20 }, (_, i) => generateAvatar(baseConfig({ seed: 5000 + i })).layers[0]?.src)
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it('hard-filters on forcedGender', () => {
    const fem = generateAvatar(baseConfig({ forcedGender: 'fem', seed: 1 }));
    expect(tagsOf(fem)).toContain('fem');
    const masc = generateAvatar(baseConfig({ forcedGender: 'masc', seed: 2 }));
    expect(tagsOf(masc)).toContain('masc');
  });

  it('hard-filters on forcedAgeGroup', () => {
    const elder = generateAvatar(baseConfig({ forcedAgeGroup: 'elder', seed: 3 }));
    expect(tagsOf(elder)).toContain('elder');
  });

  it('prefers entries whose tags match gender and age group', () => {
    const avatar = generateAvatar(
      baseConfig({ forcedGender: 'masc', forcedAgeGroup: 'middle', seed: 9 })
    );
    expect(tagsOf(avatar)).toEqual(expect.arrayContaining(['masc', 'middle']));
  });

  it('only allows scar/eyepatch portraits when wear exceeds the threshold', () => {
    const clean = new Set(
      Array.from(
        { length: 20 },
        (_, i) =>
          generateAvatar(baseConfig({ age: 18, kills: 0, injuries: [], seed: 7000 + i }))
            .layers[0]?.src
      )
    );
    for (const src of clean) {
      const tags = entryBySrc(src ?? '')?.tags ?? [];
      expect(tags).not.toContain('scar');
      expect(tags).not.toContain('eyepatch');
    }

    const veteranPicks = new Set(
      Array.from(
        { length: 30 },
        (_, i) =>
          generateAvatar(
            baseConfig({ age: 45, kills: 10, injuries: ['a', 'b', 'c', 'd'], seed: 8000 + i })
          ).layers[0]?.src
      )
    );
    const scarred = [...veteranPicks].filter((src) =>
      entryBySrc(src ?? '')?.tags.includes('scar')
    );
    expect(scarred.length).toBeGreaterThan(0);
  });

  it('prefers gray/balding hair for elders', () => {
    const avatar = generateAvatar(
      baseConfig({ forcedGender: 'masc', forcedAgeGroup: 'elder', seed: 11 })
    );
    expect(tagsOf(avatar)).toEqual(expect.arrayContaining(['gray']));
  });

  it('prefers the build tag matching the fighting style', () => {
    const heavy = generateAvatar(
      baseConfig({ style: FightingStyle.BashingAttack, forcedGender: 'masc', seed: 13 })
    );
    expect(tagsOf(heavy)).toContain('heavy');
  });

  it('falls back to layered generation when the catalog has no portraits', () => {
    setAvatarCatalog(createTestAvatarCatalog());
    const avatar = generateAvatar(baseConfig());
    expect(avatar.layers.length).toBeGreaterThan(1);
    expect(avatar.layers.some((l) => l.category === 'base')).toBe(true);
  });
});
