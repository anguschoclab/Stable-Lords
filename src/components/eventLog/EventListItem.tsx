import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import type { GameEvent } from '@/types/eventLog';

interface EventListItemProps {
  event: GameEvent;
  allWarriorNames: string[];
  onClick: () => void;
}

/**
 *
 */
export function EventListItem({ event, allWarriorNames, onClick }: EventListItemProps) {
  const Icon = event.icon;

  return (
    <button
      aria-label={`View event details: ${event.title}${event.subtitle ? `. ${event.subtitle}` : ''}`}
      key={event.id}
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors border-b border-border/30',
        'hover:bg-secondary/60 cursor-pointer group'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', event.iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-foreground leading-tight truncate">
          <LinkifiedText text={event.title} names={event.entityNames ?? allWarriorNames} />
        </div>
        {event.subtitle && (
          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
            <LinkifiedText text={event.subtitle} names={event.entityNames ?? allWarriorNames} />
          </div>
        )}
      </div>
      <ChevronRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors mt-0.5 shrink-0" />
    </button>
  );
}
