import { findWarrior } from '@/engine/core/historyResolver';
import { EVENT_ICONS } from './constants';
import type { GameEvent, EventType } from '@/types/eventLog';
import type {
  FightSummary,
  Warrior,
  GazetteStory,
  NewsletterItem,
  TrainingAssignment,
  TournamentEntry,
} from '@/types/state.types';
import type { GameStore } from '@/state/useGameStore';

/**
 *
 */
export function processFightEvents(arenaHistory: FightSummary[]): GameEvent[] {
  return arenaHistory.map((f) => {
    const isKill = f.by === 'Kill';
    const n = (f.title.split(' (')[0] ?? '').split(' vs ');
    const nameA = n[0] || 'Unknown';
    const nameD = n[1] || 'Unknown';
    const winnerName = f.winner === 'A' ? nameA : f.winner === 'D' ? nameD : null;
    const eventType: EventType = isKill ? 'kill' : 'fight';
    return {
      id: `fight-${f.id}`,
      week: f.week,
      type: eventType,
      title: winnerName
        ? `${winnerName} defeats ${f.winner === 'A' ? nameD : nameA}`
        : `${nameA} vs ${nameD} — Draw`,
      subtitle: isKill ? `Killed in combat` : `Victory by ${f.by ?? 'decision'}`,
      icon: EVENT_ICONS[eventType].icon,
      iconColor: EVENT_ICONS[eventType].color,
      linkTo: '/world/chronicle',
      entityNames: [nameA, nameD],
    } as GameEvent;
  });
}

/**
 *
 */
export function processDeathEvents(graveyard: Warrior[]): GameEvent[] {
  return graveyard.map((w) => {
    const names = [w.name];
    if (w.killedBy) names.push(w.killedBy);
    return {
      id: `death-${w.id}`,
      week: w.deathWeek ?? 0,
      type: 'death' as EventType,
      title: `${w.name} Slain`,
      subtitle: w.killedBy ? `Killed by ${w.killedBy}` : (w.deathCause ?? 'Died in combat'),
      icon: EVENT_ICONS.death.icon,
      iconColor: EVENT_ICONS.death.color,
      linkTo: `/warrior/${w.id}`,
      entityNames: names,
    } as GameEvent;
  });
}

/**
 *
 */
export function processRetirementEvents(retired: Warrior[]): GameEvent[] {
  return retired.map(
    (w) =>
      ({
        id: `retire-${w.id}`,
        week: w.retiredWeek ?? 0,
        type: 'retirement' as EventType,
        title: `${w.name} Retired`,
        subtitle: `${w.career.wins}W-${w.career.losses}L career`,
        icon: EVENT_ICONS.retirement.icon,
        iconColor: EVENT_ICONS.retirement.color,
        linkTo: `/warrior/${w.id}`,
        entityNames: [w.name],
      }) as GameEvent
  );
}

/**
 *
 */
export function processInjuryEvents(roster: Warrior[], week: number): GameEvent[] {
  const events: GameEvent[] = [];
  roster.forEach((w) => {
    if (!w.injuries || w.injuries.length === 0) return;
    w.injuries.forEach((inj, idx) => {
      if (typeof inj === 'string') return;
      events.push({
        id: `injury-${w.id}-${inj.id ?? idx}`,
        week,
        type: 'injury' as EventType,
        title: `${w.name} — ${inj.name}`,
        subtitle: `${inj.severity} · ${inj.weeksRemaining}w recovery`,
        icon: EVENT_ICONS.injury.icon,
        iconColor: EVENT_ICONS.injury.color,
        linkTo: `/warrior/${w.id}`,
        entityNames: [w.name],
      } as GameEvent);
    });
  });
  return events;
}

/**
 *
 */
export function processTrainingEvents(
  assignments: TrainingAssignment[],
  state: Pick<GameStore, 'player' | 'roster' | 'graveyard' | 'retired' | 'rivals'>,
  week: number
): GameEvent[] {
  return assignments
    .map((a) => {
      const w = findWarrior(state, a.warriorId);
      if (!w) return null;
      const isRecovery = a.type === 'recovery';
      const eventType: EventType = isRecovery ? 'recovery' : 'training';
      return {
        id: `train-${a.warriorId}`,
        week,
        type: eventType,
        title: isRecovery
          ? `${w.name} recovering`
          : `${w.name} training${a.attribute ? ` ${a.attribute}` : ''}`,
        subtitle: isRecovery ? 'Active recovery from injuries' : 'Assigned to training grounds',
        icon: EVENT_ICONS[eventType].icon,
        iconColor: EVENT_ICONS[eventType].color,
        linkTo: '/stable/training',
        entityNames: [w.name],
      } as GameEvent;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

/**
 *
 */
export function processNewsletterEvents(newsletter: NewsletterItem[]): GameEvent[] {
  return newsletter.map((n) => {
    const isEvent = n.category === 'event';
    const eventType: EventType = isEvent ? 'event' : 'news';
    return {
      id: `news-${n.id || n.title}`,
      week: n.week,
      type: eventType,
      title: n.title,
      subtitle: n.items[0]?.slice(0, 60) ?? '',
      icon: EVENT_ICONS[eventType].icon,
      iconColor: EVENT_ICONS[eventType].color,
      linkTo: isEvent ? '/stable/roster' : '/world/chronicle',
    } as GameEvent;
  });
}

/**
 *
 */
export function processTournamentEvents(tournaments: TournamentEntry[]): GameEvent[] {
  return tournaments
    .filter((t) => t.completed)
    .map((t) => {
      const names: string[] = [];
      if (t.champion) names.push(t.champion);
      return {
        id: `tourney-${t.id}`,
        week: t.week,
        type: 'tournament' as EventType,
        title: t.name,
        subtitle: t.champion ? `Champion: ${t.champion}` : 'Tournament completed',
        icon: EVENT_ICONS.tournament.icon,
        iconColor: EVENT_ICONS.tournament.color,
        linkTo: '/world/tournaments',
        entityNames: names,
      } as GameEvent;
    });
}

/**
 *
 */
export function processGazetteEvents(gazettes: GazetteStory[]): GameEvent[] {
  return gazettes.map(
    (g) =>
      ({
        id: `gazette-${g.id}`,
        week: g.week,
        type: 'news' as EventType,
        title: g.headline,
        subtitle: g.body.slice(0, 80) + '...',
        icon: EVENT_ICONS.news.icon,
        iconColor: 'text-arena-gold',
        linkTo: '/world/chronicle',
      }) as GameEvent
  );
}

/**
 *
 */
export function groupEventsByWeek(events: GameEvent[]): Array<[number, GameEvent[]]> {
  const map = new Map<number, GameEvent[]>();
  events.forEach((e) => {
    const group = map.get(e.week) || [];
    if (!map.has(e.week)) map.set(e.week, group);
    group.push(e);
  });
  return Array.from(map.entries()).sort(([a], [b]) => b - a);
}
