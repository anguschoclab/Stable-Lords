import type { EventType } from '@/types/eventLog';

/** The live EventType union as a literal list — shared by event-log coverage pins. */
export const ALL_EVENT_TYPES: readonly EventType[] = [
  'fight',
  'kill',
  'death',
  'tournament',
  'news',
  'injury',
  'retirement',
  'training',
  'event',
  'recovery',
];
