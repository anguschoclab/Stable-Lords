import type { UxMetadata } from './uxMetadata';
import type { Persona } from './personas';
import type { StrikesCollection } from './strikes';
import type { PbpNarratives } from './pbp';
import type { Conclusions } from './conclusions';
import type { Events } from './events';
import type { GazetteNarratives } from './gazette';
import type { Fanfare } from './fanfare';
import type { Memorials } from './memorials';
import type { Recruitment } from './recruitment';
import type { Meta } from './meta';
import type { Passives } from './passives';

/**
 * Defines the shape of kill text.
 */
interface KillText {
  [key: string]: string[] | Record<string, string[]>;
}

/**
 * Defines the shape of narrative content.
 */
export interface NarrativeContent {
  ux_metadata: UxMetadata;
  persona: Persona;
  strikes?: StrikesCollection;
  pbp?: PbpNarratives;
  conclusions?: Conclusions;
  events: Events;
  gazette: GazetteNarratives;
  fanfare: Fanfare;
  memorials: Memorials;
  recruitment: Recruitment;
  meta: Meta;
  passives?: Passives;
  kill_text?: KillText;
  crowd_reactions?: Record<string, string[]>;
  blurbs?: Record<string, string[]>;
  commentary?: Record<string, string[]>;
  recap?: string[];
  offseason_events?: Record<string, unknown>;
}
