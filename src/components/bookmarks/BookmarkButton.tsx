import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { BookmarkEntityType } from '@/types/bookmark.types';

const ENTITY_LABEL: Record<BookmarkEntityType, string> = {
  warrior: 'Warrior',
  rival: 'Rival Stable',
  promoter: 'Promoter',
  trainer: 'Trainer',
  tournament: 'Tournament',
  boutOffer: 'Bout Offer',
  scoutReport: 'Scout Report',
};

interface BookmarkButtonProps {
  entityType: BookmarkEntityType;
  entityId: string;
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
}

export function BookmarkButton({
  entityType,
  entityId,
  size = 'sm',
  className,
  label,
}: BookmarkButtonProps) {
  const isBookmarked = useGameStore((s) => s.isBookmarked(entityType, entityId));
  const toggleBookmark = useGameStore((s) => s.toggleBookmark);

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const entityLabel = label || ENTITY_LABEL[entityType];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(entityType, entityId);
        toast.success(
          isBookmarked ? `Removed ${entityLabel} from watchlist` : `Added ${entityLabel} to watchlist`,
          { duration: 1500 }
        );
      }}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(
        'p-1.5 rounded-none border transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        isBookmarked
          ? 'text-arena-gold border-arena-gold/30 bg-arena-gold/5'
          : 'text-muted-foreground/40 border-white/5 hover:text-arena-gold hover:border-arena-gold/20',
        className
      )}
    >
      {isBookmarked ? <BookmarkCheck className={iconSize} /> : <Bookmark className={iconSize} />}
    </button>
  );
}
