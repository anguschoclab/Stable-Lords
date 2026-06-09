/**
 *
 */
export type EventType =
  | 'fight'
  | 'kill'
  | 'death'
  | 'recruit'
  | 'tournament'
  | 'news'
  | 'injury'
  | 'retirement'
  | 'training'
  | 'event'
  | 'recovery';

/**
 *
 */
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
