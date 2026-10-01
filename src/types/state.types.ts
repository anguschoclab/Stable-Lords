// Public state-type surface — barrel re-exporting the types/state/* shards.
// (Split per MEGAPLAN I6; keep this file a pure barrel.)

export type { Warrior, DeathEvent } from './warrior.types';
export type {
  WeatherType,
  Season,
  CrowdMoodType,
  NewsletterItem,
  TrainerTier,
  TrainerFocus,
  Trainer,
  ScoutQuality,
} from './shared.types';
export type { CrestData } from './crest.types';
export type { FightSummary, FightOutcomeBy } from './combat.types';
export type { PoolWarrior } from '@/engine/recruitment/recruitment';

export * from './state/rankings';
export * from './state/championship';
export * from './state/owner';
export * from './state/game';
export * from './state/simulation';
export * from './state/gameState';
