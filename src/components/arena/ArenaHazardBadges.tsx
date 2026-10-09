import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ArenaTag } from '@/types/shared.types';

interface ArenaHazardBadgesProps {
  tags: ArenaTag[];
  size?: 'sm' | 'md';
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'text-[6px] py-0 px-1',
  md: 'text-[9px] font-black tracking-widest',
};

/** Renders WATER HAZARD / CURSED GROUND badges for tagged arenas. */
export function ArenaHazardBadges({ tags, size = 'md' }: ArenaHazardBadgesProps) {
  return (
    <>
      {tags.includes('water') && (
        <Badge
          variant="outline"
          className={cn(sizeClasses[size], 'border-primary/30 text-primary')}
        >
          WATER HAZARD
        </Badge>
      )}
      {tags.includes('cursed') && (
        <Badge
          variant="outline"
          className={cn(sizeClasses[size], 'border-destructive/30 text-destructive')}
        >
          CURSED GROUND
        </Badge>
      )}
    </>
  );
}
