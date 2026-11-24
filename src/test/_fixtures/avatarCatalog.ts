import type { AvatarCatalog, AvatarLayerCategory } from '@/types/avatar.types';

function entry(
  category: AvatarLayerCategory,
  name: string,
  tags: string[] = []
): {
  src: string;
  category: AvatarLayerCategory;
  tags: string[];
} {
  return { src: `/avatars/layers/${category}/${name}.png`, category, tags };
}

/**
 * Minimal avatar catalog for unit tests. Covers every required category with
 * enough variety to exercise the generator's deterministic selection.
 */
export function createTestAvatarCatalog(): AvatarCatalog {
  return {
    categories: {
      base: [
        entry('base', 'young_masc_01', ['young', 'masc']),
        entry('base', 'young_fem_01', ['young', 'fem']),
        entry('base', 'adult_masc_01', ['adult', 'masc']),
        entry('base', 'adult_fem_01', ['adult', 'fem']),
        entry('base', 'elder_masc_01', ['elder', 'masc']),
      ],
      skinTone: [
        entry('skinTone', 'light_01'),
        entry('skinTone', 'medium_01'),
        entry('skinTone', 'dark_01'),
      ],
      eyes: [entry('eyes', 'brown_01'), entry('eyes', 'blue_01')],
      mouth: [entry('mouth', 'neutral_01'), entry('mouth', 'grim_01')],
      hair: [
        entry('hair', 'black_short_01', ['black', 'short']),
        entry('hair', 'blonde_braids_01', ['blonde', 'braids']),
        entry('hair', 'gray_balding_01', ['gray', 'balding']),
      ],
      facialHair: [entry('facialHair', 'stubble_01'), entry('facialHair', 'beard_black_01')],
      markings: [
        entry('markings', 'scar_cheek_01', ['scar']),
        entry('markings', 'eyepatch_left_01', ['eyepatch']),
        entry('markings', 'wrinkles_01', ['wrinkles']),
        entry('markings', 'warpaint_black_01', ['warpaint']),
      ],
      accessories: [
        entry('accessories', 'glasses_round_01'),
        entry('accessories', 'headband_red_01'),
      ],
      clothing: [
        entry('clothing', 'tunic_blue_01', ['light']),
        entry('clothing', 'armor_plate_01', ['heavy']),
        entry('clothing', 'robe_blue_01', ['defensive']),
      ],
      shoulders: [
        entry('shoulders', 'bare_01'),
        entry('shoulders', 'pauldron_steel_01', ['heavy']),
      ],
    },
  };
}

function portrait(id: string, tags: string[]): { src: string; category: 'portraits'; tags: string[] } {
  return { src: `/avatars/portraits/${id}.webp`, category: 'portraits', tags };
}

/**
 * Portrait-pool catalog for the V32 whole-portrait path. One entry per
 * gender×age row plus marking/headgear variants so scoring specs can assert
 * deterministic tag preferences. Entries live under `categories.portraits`.
 */
export function createTestPortraitCatalog(): AvatarCatalog {
  return {
    categories: {
      portraits: [
        portrait('p-young-masc-clean', ['masc', 'young', 'light', 'black', 'short', 'warrior']),
        portrait('p-young-fem-clean', ['fem', 'young', 'light', 'brown', 'long', 'warrior']),
        portrait('p-adult-masc-heavy', ['masc', 'adult', 'heavy', 'brown', 'short', 'beard', 'warrior']),
        portrait('p-adult-fem-light', ['fem', 'adult', 'light', 'blonde', 'braids', 'warrior']),
        portrait('p-adult-neutral-def', ['neutral', 'adult', 'defensive', 'bald', 'warrior']),
        portrait('p-adult-neutral-trainer', ['neutral', 'adult', 'light', 'brown', 'short', 'trainer']),
        portrait('p-middle-masc-scar', ['masc', 'middle', 'heavy', 'black', 'short', 'beard', 'scar', 'warrior']),
        portrait('p-middle-fem-warpaint', ['fem', 'middle', 'light', 'red', 'long', 'warpaint', 'warrior']),
        portrait('p-elder-masc-gray', ['masc', 'elder', 'defensive', 'gray', 'balding', 'wrinkles', 'beard', 'trainer']),
        portrait('p-elder-fem-gray', ['fem', 'elder', 'light', 'gray', 'long', 'wrinkles', 'trainer']),
        portrait('p-adult-masc-scar2', ['masc', 'adult', 'heavy', 'bald', 'scar', 'eyepatch', 'warrior']),
      ],
    },
  };
}

/** Legacy categories plus the portrait pool — exercises the both-modes catalog. */
export function createMixedAvatarCatalog(): AvatarCatalog {
  const legacy = createTestAvatarCatalog();
  const pool = createTestPortraitCatalog();
  return { categories: { ...legacy.categories, ...pool.categories } };
}
