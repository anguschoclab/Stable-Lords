import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { findWarrior, type NameResolutionState } from '@/engine/core/historyResolver';
import { useGameStore } from '@/state/useGameStore';
import { AvatarForEntity } from './AvatarForEntity';
import type { AvatarProps } from './Avatar';

interface WarriorNameAvatarProps {
  /** Warrior id; resolves across roster, graveyard, retired, and rival rosters. */
  warriorId?: string;
  /** Fallback display-name lookup when no id is available. */
  name?: string;
  size?: AvatarProps['size'];
  className?: string;
}

/**
 * Renders a warrior portrait from just an id and/or name. Resolves the full
 * Warrior object from game state (including dead/retired/rival warriors), so
 * name-only surfaces like bout logs and memorials can show portraits without
 * threading entity objects through every prop layer. Renders nothing when the
 * warrior cannot be resolved.
 */
export function WarriorNameAvatar({
  warriorId,
  name,
  size = 'xs',
  className,
}: WarriorNameAvatarProps) {
  // Null-safe: mocked or uninitialized stores may pass undefined state.
  const nameState = useGameStore(
    useShallow((s): NameResolutionState | null =>
      s == null
        ? null
        : {
            player: s.player,
            roster: s.roster,
            graveyard: s.graveyard,
            retired: s.retired,
            rivals: s.rivals,
          }
    )
  );
  const warrior = useMemo(
    () => (nameState ? findWarrior(nameState, warriorId, name) : undefined),
    [nameState, warriorId, name]
  );
  if (!warrior) return null;
  return (
    <AvatarForEntity
      entityId={warrior.id}
      entityType="warrior"
      source={warrior}
      size={size}
      className={className}
    />
  );
}
