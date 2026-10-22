import type { AvatarData } from '@/types/avatar.types';

/** Build a deterministic AvatarData fixture for component/store tests. */
export function createTestAvatarData(overrides?: Partial<AvatarData>): AvatarData {
  return {
    seed: 12345,
    entityType: 'warrior',
    gender: 'masc',
    ageGroup: 'adult',
    primaryColor: '#6b7280',
    secondaryColor: '#9ca3af',
    description: 'Test Warrior',
    layers: [
      { category: 'shoulders', src: '/avatars/layers/shoulders/bare_01.png', z: 0 },
      { category: 'clothing', src: '/avatars/layers/clothing/tunic_blue_01.png', z: 1 },
      { category: 'base', src: '/avatars/layers/base/adult_masc_01.png', z: 2 },
      { category: 'skinTone', src: '/avatars/layers/skinTone/medium_01.png', z: 3 },
      { category: 'eyes', src: '/avatars/layers/eyes/brown_01.png', z: 4 },
      { category: 'mouth', src: '/avatars/layers/mouth/neutral_01.png', z: 5 },
      { category: 'hair', src: '/avatars/layers/hair/black_short_01.png', z: 6 },
    ],
    ...overrides,
  };
}

/** Shared AvatarConfig for store/component avatar specs. */
export const TEST_AVATAR_CONFIG = {
  entityId: 'w-1',
  entityType: 'warrior',
  seed: 12345,
  name: 'Aulus',
  age: 25,
} as const;
