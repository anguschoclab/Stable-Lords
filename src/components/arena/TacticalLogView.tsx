import { memo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MinuteEvent } from '@/types/combat.types';
import { classifyEvent } from '@/lib/boutUtils';
import {
  Swords,
  Zap,
  Skull,
  Shield,
  Target,
  Activity,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TacticalLogViewProps {
  log: MinuteEvent[];
  visibleCount: number;
  className?: string;
  highlightIndex?: number | null;
  onHighlightChange?: (index: number) => void;
  showStepControls?: boolean;
}

function getEventIcon(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case 'hit':
      return <Swords className="h-3 w-3 text-arena-gold" />;
    case 'crit':
      return <Zap className="h-3.5 w-3.5 text-destructive animate-pulse" />;
    case 'death':
      return <Skull className="h-3.5 w-3.5 text-arena-blood" />;
    case 'ko':
      return <Skull className="h-3 w-3 text-arena-gold" />;
    case 'miss':
      return <Shield className="h-3 w-3 text-arena-steel opacity-40" />;
    case 'riposte':
      return <Swords className="h-3 w-3 text-arena-fame" />;
    case 'initiative':
      return <Zap className="h-3 w-3 text-primary" />;
    case 'exhaust':
      return <Activity className="h-3 w-3 text-muted-foreground/40" />;
    case 'phase':
      return <Target className="h-3 w-3 text-primary/60" />;
    case 'spatial':
      return <MoveHorizontal className="h-3 w-3 text-accent" />;
    default:
      return <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />;
  }
}

function getEventColor(type: ReturnType<typeof classifyEvent>) {
  switch (type) {
    case 'hit':
      return 'border-arena-gold/20 bg-arena-gold/5';
    case 'crit':
      return 'border-destructive/30 bg-destructive/10 shadow-[0_0_15px_rgba(var(--destructive-rgb),0.1)]';
    case 'death':
      return 'border-arena-blood/40 bg-arena-blood/10';
    case 'ko':
      return 'border-arena-gold/30 bg-arena-gold/5';
    case 'riposte':
      return 'border-arena-fame/20 bg-arena-fame/5';
    case 'initiative':
      return 'border-primary/20 bg-primary/5';
    case 'exhaust':
      return 'border-white/5 bg-white/5';
    case 'miss':
      return 'border-white/5 bg-transparent opacity-60';
    case 'phase':
      return 'border-primary/40 bg-primary/10 py-3 my-2';
    case 'spatial':
      return 'border-accent/20 bg-accent/5';
    default:
      return 'border-white/5 bg-transparent';
  }
}

// Optimization: Extracts the individual log entry into a React.memo component.
// Because the log frequently appends new events (changing visibleCount), memoization
// ensures that previously rendered log events do not re-render unnecessarily.
// This changes rendering per tick from O(N) to O(1) during long simulated battles.
const TacticalLogEntry = memo(
  ({
    event,
    index,
    isLatest,
    type,
    isHighlighted,
    entryRef,
  }: {
    event: MinuteEvent;
    index: number;
    isLatest: boolean;
    type: ReturnType<typeof classifyEvent>;
    isHighlighted?: boolean;
    entryRef?: (el: HTMLDivElement | null) => void;
  }) => {
    return (
      <div
        key={index}
        ref={entryRef}
        className={cn(
          'flex items-start gap-2 py-1.5 px-2 border-l-2 text-xs transition-all duration-300 motion-reduce:transition-none',
          getEventColor(type),
          isLatest && 'animate-in slide-in-from-left-2 duration-300',
          isLatest && type === 'crit' && 'animate-pulse',
          isHighlighted && 'ring-1 ring-primary/40 bg-primary/5'
        )}
      >
        <div className="mt-0.5 shrink-0">{getEventIcon(type)}</div>
        <div className="flex-1 leading-relaxed">
          <span
            className={cn(
              'font-display',
              event.emphasis && 'font-bold',
              type === 'crit' && 'text-destructive',
              type === 'ko' && 'text-arena-gold',
              type === 'death' && 'text-arena-blood'
            )}
          >
            {event.text}
          </span>
          {event.phase && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              — {event.phase} Phase
            </span>
          )}
        </div>
      </div>
    );
  }
); /**
 * Tactical log view.
 * @param - { log, visible count, class name }.
 */

/**
 * Tactical log view.
 * @param - { log, visible count, class name }.
 */
export default function TacticalLogView({
  log,
  visibleCount,
  className,
  highlightIndex,
  onHighlightChange,
  showStepControls,
}: TacticalLogViewProps) {
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event (only when not in highlight mode)
  useEffect(() => {
    if (highlightIndex == null) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [visibleCount, highlightIndex]);

  // Scroll highlighted entry into view
  useEffect(() => {
    if (highlightIndex != null && entryRefs.current[highlightIndex]) {
      entryRefs.current[highlightIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightIndex]);

  const visibleEvents = log.slice(0, visibleCount);
  const hasHighlight = highlightIndex != null;
  const currentIndex = highlightIndex ?? 0;
  const isAtStart = currentIndex <= 0;
  const isAtEnd = currentIndex >= log.length - 1;

  const currentMinute = log[currentIndex]?.minute ?? 0;
  const prevPageIndex = (() => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if ((log[i]?.minute ?? currentMinute) < currentMinute) {
        const targetMinute = log[i]?.minute ?? 0;
        const first = log.findIndex((e) => e.minute === targetMinute);
        return first >= 0 ? first : 0;
      }
    }
    return 0;
  })();
  const nextPageIndex = (() => {
    for (let i = currentIndex + 1; i < log.length; i++) {
      if ((log[i]?.minute ?? currentMinute) > currentMinute) return i;
    }
    return log.length - 1;
  })();

  return (
    <>
      <ScrollArea className={cn('h-full min-h-96 w-full', className)}>
        <div className="p-4 space-y-1">
          {visibleEvents.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8 italic">
              The battle is about to begin...
            </div>
          ) : (
            visibleEvents.map((event, index) => {
              const type = classifyEvent(event);
              const isLatest = index === visibleEvents.length - 1;

              return (
                <TacticalLogEntry
                  key={index}
                  event={event}
                  index={index}
                  isLatest={isLatest}
                  type={type}
                  isHighlighted={hasHighlight && index === highlightIndex}
                  entryRef={(el) => {
                    entryRefs.current[index] = el;
                  }}
                />
              );
            })
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {showStepControls && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: '#0A0705',
            border: '1px solid rgba(60,42,22,0.8)',
            borderTop: 'none',
          }}
        >
          <button
            onClick={() => onHighlightChange?.(prevPageIndex)}
            disabled={isAtStart}
            aria-label="Previous"
            className={cn(
              'flex items-center justify-center h-8 w-8 transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isAtStart
                ? 'opacity-30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span className="text-primary">{currentIndex + 1}</span>
            <span className="opacity-20">/</span>
            <span>{log.length}</span>
          </div>

          <button
            onClick={() => onHighlightChange?.(nextPageIndex)}
            disabled={isAtEnd}
            aria-label="Next"
            className={cn(
              'flex items-center justify-center h-8 w-8 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isAtEnd
                ? 'opacity-30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
