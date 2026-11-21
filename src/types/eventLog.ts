/** Categories of event shown in the event log. */
export type EventType =
  | 'fight'
  | 'kill'
  | 'death'
  | 'tournament'
  | 'news'
  | 'injury'
  | 'retirement'
  | 'training'
  | 'event'
  | 'recovery';

/** A single event-log entry — display fields plus a navigation link. */
export interface GameEvent {
  id: string;
  week: number;
  type: EventType;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  linkTo: string;
  /** Names to linkify in title/subtitle */
  entityNames?: string[];
}
