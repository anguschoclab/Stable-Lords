import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkFilterToggleProps {
  active: boolean;
  onToggle: () => void;
  count?: number;
}

export function BookmarkFilterToggle({
  active,
  onToggle,
  count,
}: BookmarkFilterToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-none border text-[10px] font-black uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        active
          ? 'border-arena-gold/40 text-arena-gold bg-arena-gold/5'
          : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
      )}
    >
      <Bookmark className="h-3 w-3" />
      <span>Bookmarked Only</span>
      {count !== undefined && (
        <span
          className={cn(
            'font-mono text-[9px] px-1.5 py-0.5 rounded-none',
            active
              ? 'bg-arena-gold/20 text-arena-gold'
              : 'bg-white/5 text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
