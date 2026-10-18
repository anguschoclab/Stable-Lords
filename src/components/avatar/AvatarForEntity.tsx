import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { Avatar, type AvatarProps } from './Avatar';
import { AVATAR_SIZE_MAP } from './avatarSizes';
import { useAvatarCatalog } from './useAvatarCatalog';
import type {
  AvatarConfig,
  AvatarData,
  AvatarEntityType,
} from '@/types/avatar.types';
import type { Warrior } from '@/types/warrior.types';
import type { Trainer } from '@/types/shared.types';
import type { Owner, Promoter, RivalStableData } from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import { FightingStyle } from '@/types/shared.types';

/** Props for the entity-bound avatar wrapper. */
export interface AvatarForEntityProps {
  entityId: string;
  entityType: AvatarEntityType;
  source: Warrior | Trainer | PoolWarrior | Owner | Promoter;
  size?: AvatarProps['size'];
  className?: string;
}

function isWarriorLike(source: unknown): source is { style?: FightingStyle; career?: { kills?: number } } {
  return typeof source === 'object' && source !== null;
}

function resolveEntityColors(
  entityType: AvatarEntityType,
  entityId: string,
  source: AvatarForEntityProps['source'],
  player: Owner | undefined,
  rivals: RivalStableData[] | undefined
): { primary?: string; secondary?: string } {
  if (entityType === 'owner') {
    const owner = source as Owner;
    return { primary: owner.crest?.primaryColor, secondary: owner.crest?.secondaryColor };
  }
  if (entityType === 'warrior' || entityType === 'poolWarrior') {
    const rival = (rivals ?? []).find((r) => r.roster?.some((w) => w.id === entityId));
    const crest = rival?.crest ?? player?.crest;
    return { primary: crest?.primaryColor, secondary: crest?.secondaryColor };
  }
  if (entityType === 'trainer') {
    return { primary: player?.crest?.primaryColor, secondary: player?.crest?.secondaryColor };
  }
  return {};
}

function buildAvatarConfig(
  entityId: string,
  entityType: AvatarEntityType,
  source: AvatarForEntityProps['source'],
  player: Owner | undefined,
  rivals: RivalStableData[] | undefined
): AvatarConfig {
  const colors = resolveEntityColors(entityType, entityId, source, player, rivals);
  const warriorLike = isWarriorLike(source);
  const injuries = Array.isArray((source as { injuries?: unknown }).injuries)
    ? (source as { injuries?: { name?: string }[] }).injuries?.map((i) =>
        typeof i === 'string' ? i : i.name ?? ''
      )
    : undefined;
  return {
    entityId,
    entityType,
    seed: (source as { avatarSeed?: number }).avatarSeed,
    name: (source as { name: string }).name ?? 'Unknown',
    age: (source as { age?: number }).age,
    style: warriorLike ? source.style : undefined,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    kills: warriorLike ? source.career?.kills : undefined,
    fame: (source as { fame?: number }).fame,
    injuries,
  };
}

function AvatarPlaceholder({ size, className }: { size: AvatarProps['size']; className?: string }) {
  const pixels = typeof size === 'number' ? size : AVATAR_SIZE_MAP[size ?? 'md'];
  return <div className={className} style={{ width: pixels, height: pixels }} />;
}

/**
 * Convenience wrapper that reads from avatarCache, generates if missing,
 * and renders the portrait. Derives stable colors from player/rival crests.
 */
export function AvatarForEntity({
  entityId,
  entityType,
  source,
  size = 'md',
  className,
}: AvatarForEntityProps) {
  const catalogReady = useAvatarCatalog();
  const { player, rivals, ensureAvatar } = useGameStore(
    useShallow((s) => ({
      player: s.player,
      rivals: s.rivals,
      ensureAvatar: s.ensureAvatar,
    }))
  );

  const config = useMemo<AvatarConfig>(
    () => buildAvatarConfig(entityId, entityType, source, player, rivals),
    [entityId, entityType, source, player, rivals]
  );

  const portrait = useMemo<AvatarData | null>(() => {
    if (!catalogReady) return null;
    try {
      return ensureAvatar(config);
    } catch {
      return null;
    }
  }, [catalogReady, config, ensureAvatar]);

  if (!portrait) return <AvatarPlaceholder size={size} className={className} />;
  return <Avatar portrait={portrait} size={size} className={className} />;
}
