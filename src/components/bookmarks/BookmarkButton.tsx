import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { BookmarkEntityType } from '@/types/bookmark.types';

interface BookmarkButtonProps {
  entityType: BookmarkEntityType;
  entityId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function BookmarkButton({
  entityType,
  entityId,
  size = 'sm',
  className,
}: BookmarkButtonProps) {
  const isBookmarked = useGameStore((s) =>
    s.isBookmarked(entityType, entityId)
  );
  const toggleBookmark = useGameStore((s) => s.toggleBookmark);

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(entityType, entityId);
      }}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(
        'p-1.5 rounded-none border transition-all duration-200 shrink-0',
        isBookmarked
          ? 'text-arena-gold border-arena-gold/30 bg-arena-gold/5'
          : 'text-muted-foreground/40 border-white/5 hover:text-arena-gold hover:border-arena-gold/20',
        className
      )}
    >
      {isBookmarked ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
    </button>
  );
}
