import type { AvatarGender } from '@/types/avatar.types';

/**
 * Derive an avatar gender from an entity's avatarSeed without consuming any
 * engine RNG draws — bit-for-bit safe for determinism. Distribution matches
 * pickGender in avatarGenerator: ~45% masc / ~45% fem / ~10% neutral.
 */
export function genderFromAvatarSeed(avatarSeed: number): AvatarGender {
  const bucket = Math.abs(Math.trunc(avatarSeed)) % 100;
  if (bucket < 45) return 'masc';
  if (bucket < 90) return 'fem';
  return 'neutral';
}
