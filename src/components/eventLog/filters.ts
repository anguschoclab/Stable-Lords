import type { EventType, GameEvent } from '@/types/eventLog';

/** High-level player-facing feed categories. */
export const EVENT_FILTER_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'consequences', label: 'Consequences' },
  { id: 'reports', label: 'Reports' },
] as const;

/** Union of the player-facing filter ids declared in {@link EVENT_FILTER_CATEGORIES}. */
export type EventFilterCategory = (typeof EVENT_FILTER_CATEGORIES)[number]['id'];

const CATEGORY_TYPES: Record<Exclude<EventFilterCategory, 'all'>, readonly EventType[]> = {
  consequences: ['fight', 'kill', 'death', 'injury', 'retirement', 'tournament'],
  reports: ['news', 'event', 'training', 'recruit', 'recovery'],
};

/** Filter a derived feed without changing its source data. */
export function filterEventsByCategory(
  events: readonly GameEvent[],
  category: EventFilterCategory
): GameEvent[] {
  if (category === 'all') return [...events];
  const allowed = new Set<EventType>(CATEGORY_TYPES[category]);
  return events.filter((event) => allowed.has(event.type));
}
