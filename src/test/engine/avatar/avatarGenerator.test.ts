import { describe, it, expect } from 'vitest';
import { generateAvatar } from '@/engine/avatar/avatarGenerator';
import { FightingStyle } from '@/types/shared.types';
import type { AvatarConfig } from '@/types/avatar.types';

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
    const veteran = generateAvatar(baseConfig({ age: 50, kills: 10, injuries: Array(5).fill('scar') }));
    const youngMarks = young.layers.filter((l) => l.category === 'markings');
    const vetMarks = veteran.layers.filter((l) => l.category === 'markings');
    expect(vetMarks.length).toBeGreaterThan(youngMarks.length);
  });

  it('orders layers by ascending z value', () => {
    const avatar = generateAvatar(baseConfig());
    const zs = avatar.layers.map((l) => l.z);
    expect(zs).toEqual([...zs].sort((a, b) => a - b));
  });
});
