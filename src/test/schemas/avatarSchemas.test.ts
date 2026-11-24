import { describe, it, expect } from 'vitest';
import { AvatarDataSchema } from '@/schemas/avatarSchemas';

const base = {
  seed: 1,
  entityType: 'warrior',
  gender: 'masc',
  ageGroup: 'adult',
  primaryColor: '#6b7280',
};

describe('AvatarDataSchema', () => {
  it('round-trips a whole-portrait avatar (V32)', () => {
    const data = {
      ...base,
      layers: [{ category: 'portraits', src: '/avatars/portraits/p-1.webp', z: 0 }],
    };
    expect(AvatarDataSchema.parse(data).layers[0]?.category).toBe('portraits');
  });

  it('round-trips a legacy multi-layer avatar', () => {
    const data = {
      ...base,
      layers: [
        { category: 'base', src: '/avatars/layers/base/adult_masc_01.png', z: 0 },
        { category: 'hair', src: '/avatars/layers/hair/black_short_01.png', z: 1, tint: '#112233' },
      ],
    };
    expect(AvatarDataSchema.parse(data).layers).toHaveLength(2);
  });
});
