import { Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/state/useGameStore';
import type { AvatarConfig } from '@/types/avatar.types';

interface AvatarRerollButtonProps {
  config: AvatarConfig;
  size?: 'sm' | 'md';
}

/**
 * Reroll the portrait for an entity and cache the new result.
 */
export function AvatarRerollButton({ config, size = 'sm' }: AvatarRerollButtonProps) {
  const rerollAvatar = useGameStore((s) => s.rerollAvatar);

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'icon' : 'sm'}
      onClick={() => rerollAvatar(config)}
      aria-label="Reroll portrait"
      className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-none"
    >
      <Shuffle className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </Button>
  );
}
