/**
 * FM26-inspired Event Log sidebar.
 * Derives events from game state (fights, deaths, recruits, newsletters, training, injuries).
 * Entity names are rendered as clickable links via WarriorLink.
 */
import { useMemo, useState } from 'react';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { collectWarriorNames, collectStableNames } from '@/hooks/useEntityNames';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { ScrollText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  WeekDivider,
  EventListItem,
  processFightEvents,
  processDeathEvents,
  processRetirementEvents,
  processInjuryEvents,
  processTrainingEvents,
  processNewsletterEvents,
  processTournamentEvents,
  processGazetteEvents,
  groupEventsByWeek,
} from './eventLog/index';
import {
  EVENT_FILTER_CATEGORIES,
  filterEventsByCategory,
  type EventFilterCategory,
} from './eventLog/filters';
import { countUnreadEvents } from './eventLog/readState';
import { cn } from '@/lib/utils';
import type { GameEvent } from '@/types/eventLog';

/** Renders the arena feed sidebar of game events derived from state. */
export default function EventLog() {
  const state = useGameStore(
    useShallow((s) => ({
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      arenaHistory: s.arenaHistory,
      roster: s.roster,
      week: s.week,
      trainingAssignments: s.trainingAssignments,
      newsletter: s.newsletter,
      tournaments: s.tournaments,
      gazettes: s.gazettes,
      player: s.player,
      eventLogLastReadId: s.eventLogLastReadId,
      markEventLogRead: s.markEventLogRead,
    }))
  );
  const navigate = useNavigate();

  const { roster, graveyard, retired, rivals, player } = state;
  const { eventLogLastReadId, markEventLogRead } = state;
  const allWarriorNames = useMemo(
    () => collectWarriorNames({ roster, graveyard, retired, rivals }),
    [roster, graveyard, retired, rivals]
  );

  const allStableNames = useMemo(() => collectStableNames({ player, rivals }), [player, rivals]);

  const [category, setCategory] = useState<EventFilterCategory>('all');
  const events = useMemo(() => collectEvents(state), [state]);
  const filteredEvents = useMemo(
    () => filterEventsByCategory(events, category),
    [events, category]
  );

  const grouped = useMemo(() => groupEventsByWeek(filteredEvents), [filteredEvents]);
  const unreadCount = useMemo(
    () => countUnreadEvents(events, eventLogLastReadId),
    [events, eventLogLastReadId]
  );

  return (
    <EventLogPanel
      category={category}
      setCategory={setCategory}
      unreadCount={unreadCount}
      events={events}
      grouped={grouped}
      allWarriorNames={allWarriorNames}
      allStableNames={allStableNames}
      onMarkRead={() => markEventLogRead(events[0]?.id ?? null)}
      onEventClick={(event) => navigate({ to: event.linkTo })}
    />
  );
}

function FilterBar({
  category,
  setCategory,
}: {
  category: EventFilterCategory;
  setCategory: (category: EventFilterCategory) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter arena feed"
      className="grid grid-cols-3 border-b border-border/60"
    >
      {EVENT_FILTER_CATEGORIES.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={category === item.id}
          onClick={() => setCategory(item.id)}
          className={cn(
            'h-9 text-[9px] font-black uppercase tracking-[0.15em] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            category === item.id
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground/60 hover:bg-secondary/50 hover:text-foreground'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function EventLogPanel(props: {
  category: EventFilterCategory;
  setCategory: (category: EventFilterCategory) => void;
  unreadCount: number;
  events: GameEvent[];
  grouped: ReturnType<typeof groupEventsByWeek>;
  allWarriorNames: ReturnType<typeof collectWarriorNames>;
  allStableNames: ReturnType<typeof collectStableNames>;
  onMarkRead: () => void;
  onEventClick: (event: GameEvent) => void;
}) {
  const { category, setCategory, unreadCount, events, grouped } = props;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-arena-gold" />
          <h2 className="font-display text-sm font-semibold tracking-wide">Arena Feed</h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={props.onMarkRead}
              className="h-7 px-2 text-[10px] uppercase tracking-[0.12em]"
            >
              Mark read
            </Button>
          )}
          <Badge
            variant={unreadCount > 0 ? 'default' : 'outline'}
            className="text-[10px] font-mono text-muted-foreground"
          >
            {unreadCount > 0 ? `${unreadCount} unread` : `${events.length}`}
          </Badge>
        </div>
      </div>

      <FilterBar category={category} setCategory={setCategory} />

      <ScrollArea className="flex-1">
        <div className="py-1">
          {grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {events.length === 0
                ? 'No events yet. Run your first round!'
                : 'No entries in this record yet.'}
            </div>
          ) : (
            grouped.map(([week, weekEvents]: [number, GameEvent[]]) => (
              <div key={week}>
                <WeekDivider week={week} />
                {weekEvents.map((event: GameEvent) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    allWarriorNames={props.allWarriorNames}
                    allStableNames={props.allStableNames}
                    onClick={() => props.onEventClick(event)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/** Gather all event streams into a single reverse-chronological feed. */
function collectEvents(
  state: Pick<
    GameStore,
    | 'arenaHistory'
    | 'graveyard'
    | 'retired'
    | 'roster'
    | 'week'
    | 'trainingAssignments'
    | 'newsletter'
    | 'tournaments'
    | 'gazettes'
    | 'player'
    | 'rivals'
    | 'eventLogLastReadId'
    | 'markEventLogRead'
  >
): GameEvent[] {
  const all: GameEvent[] = [
    ...processFightEvents(state.arenaHistory),
    ...processDeathEvents(state.graveyard),
    ...processRetirementEvents(state.retired),
    ...processInjuryEvents(state.roster, state.week),
    ...processTrainingEvents(state.trainingAssignments ?? [], state, state.week),
    ...processNewsletterEvents(state.newsletter),
    ...processTournamentEvents(state.tournaments),
    ...processGazetteEvents(state.gazettes ?? []),
  ];
  all.sort((a, b) => b.week - a.week || b.id.localeCompare(a.id));
  return all;
}
