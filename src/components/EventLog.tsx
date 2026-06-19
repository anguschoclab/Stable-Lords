/**
 * FM26-inspired Event Log sidebar.
 * Derives events from game state (fights, deaths, recruits, newsletters, training, injuries).
 * Entity names are rendered as clickable links via WarriorLink.
 */
import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { ScrollText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
import type { GameEvent } from '@/types/eventLog';
/**
 *
 */
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
    }))
  );
  const navigate = useNavigate();

  // Collect all known warrior names for linkification
  const allWarriorNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of state.roster ?? []) names.add(w.name);
    for (const w of state.graveyard) names.add(w.name);
    for (const w of state.retired ?? []) names.add(w.name);
    for (const r of state.rivals ?? []) {
      for (const w of r.roster) names.add(w.name);
    }
    return [...names];
  }, [state.roster, state.graveyard, state.retired, state.rivals]);

  const events = useMemo(() => {
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
  }, [state]);

  const grouped = useMemo(() => groupEventsByWeek(events), [events]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-arena-gold" />
          <h2 className="font-display text-sm font-semibold tracking-wide">Arena Feed</h2>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
          {events.length}
        </Badge>
      </div>

      {/* Event List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {grouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No events yet. Run your first round!
            </div>
          ) : (
            grouped.map(([week, weekEvents]: [number, GameEvent[]]) => (
              <div key={week}>
                <WeekDivider week={week} />
                {weekEvents.map((event: GameEvent) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    allWarriorNames={allWarriorNames}
                    onClick={() => navigate({ to: event.linkTo })}
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
