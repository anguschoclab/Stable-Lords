import type { GameEvent } from '@/types/eventLog';

/**
 * Count feed entries newer than the latest event the player acknowledged.
 * Events are supplied in reverse-chronological order.
 */
export function countUnreadEvents(
  events: readonly GameEvent[],
  lastReadEventId: string | null
): number {
  if (!lastReadEventId) return events.length;
  const readBoundary = events.findIndex((event) => event.id === lastReadEventId);
  return readBoundary === -1 ? events.length : readBoundary;
}
