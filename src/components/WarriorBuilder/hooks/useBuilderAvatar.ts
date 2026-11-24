import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useAvatarCatalog } from '@/components/avatar/useAvatarCatalog';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { generateAvatar } from '@/engine/avatar/avatarGenerator';
import type { FightingStyle } from '@/types/game';
import type { AvatarGender } from '@/types/avatar.types';

/** Live avatar preview for the warrior under construction. */
export function useBuilderAvatar(
  avatarSeed: number,
  name: string,
  style: FightingStyle,
  gender?: AvatarGender | 'auto'
) {
  const catalogReady = useAvatarCatalog();
  const crest = useGameStore((state) => state.player.crest);
  return useMemo(
    () =>
      catalogReady
        ? generateAvatar({
            entityId: 'warrior-builder-preview',
            entityType: 'warrior',
            seed: avatarSeed,
            name: name || 'New Warrior',
            style,
            forcedGender: gender === 'auto' ? undefined : gender,
            primaryColor: crest?.primaryColor,
            secondaryColor: crest?.secondaryColor,
          })
        : null,
    [avatarSeed, catalogReady, crest?.primaryColor, crest?.secondaryColor, name, style, gender]
  );
}
