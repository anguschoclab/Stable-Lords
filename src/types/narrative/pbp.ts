import type { PersonaDescriptor } from './personas';


/**
 * Defines the shape of hit locations.
 */
export interface HitLocations {
  head: string[];
  chest: string[];
  abdomen: string[];
  'right arm': string[];
  'left arm': string[];
  'right leg': string[];
  'left leg': string[];
}


/**
 * Defines the shape of damage severity.
 */
export interface DamageSeverity {
  deadly: string[];
  terrific: string[];
  powerful: string[];
  glancing: string[];
}


/**
 * Defines the shape of status changes.
 */
export interface StatusChanges {
  severe: string[];
  desperate: string[];
  serious: string[];
  panic: string[];
}


/**
 * Defines the shape of defenses.
 */
export interface DodgeTiers {
  tier1_low: string[];
  tier2_medium: string[];
  tier3_high: string[];
  tier4_supernatural: string[];
  desperate?: (string | PersonaDescriptor)[];
  confident?: string[];
  theatrical?: string[];
  grim?: string[];
}


/**
 * Defense narrative strings for counterstrike, dodge, parry, and shield actions.
 */
export interface Defenses {
  counterstrike: { success: string[] };
  dodge: DodgeTiers;
  parry: {
    success: string[];
    desperate?: string[];
    confident?: string[];
    theatrical?: string[];
    grim?: string[];
  };
  shield: { success: string[] };
  parry_break: string[];
}


/**
 * Defines the shape of pacing.
 */
export interface Tempo {
  ahead: string[];
  equal: string[];
  movement: string[];
}


/**
 * Pacing narrative strings for stalemate, trading blows, and pressing phases.
 */
export interface Pacing {
  stalemate: string[];
  trading_blows: string[];
  pressing: string[];
  tempo: Tempo;
}


/**
 * Defines the shape of reactions.
 */
export interface Reactions {
  positive: string[];
  negative: string[];
  encourage: string[];
  gasp: string[];
  cheer: string[];
  boo: string[];
}


/**
 * Defines the shape of taunts.
 */
export interface Taunts {
  winner: string[];
  loser: string[];
  rivalry_winner: string[];
  rivalry_loser: string[];
}


/**
 * Defines the shape of insights.
 */
export interface Insights {
  ST: string[];
  SP: string[];
  DF: string[];
  WL: string[];
  CN: string[];
  CT: string[];
}


/**
 * Defines the shape of pbp narratives.
 */
export interface Attacks {
  piercing: string[];
  slashing: string[];
  bashing: string[];
  fist: string[];
}


/**
 * Knockdown narrative strings for fall and recovery.
 */
export interface Knockdown {
  fall: string[];
  recovery: string[];
}


/**
 * Epithet narrative strings by origin, race, and style.
 */
export interface Epithets {
  origin: string[];
  race: string[];
  style: string[];
}


/**
 * Style matchup narrative strings keyed by style pair.
 */
export interface StyleMatchups {
  [key: string]: string[];
}


/**
 * Contextual narrative strings for rivalry and fame-based commentary.
 */
export interface Context {
  rivalry: string[];
  fame_great: string[];
  fame_unknown: string[];
  style_matchups: StyleMatchups;
}


/**
 * Play-by-play narrative strings for openers, attacks, and fight events.
 */
export interface PbpNarratives {
  openers: string[];
  attacks: Attacks;
  hit_locations: HitLocations;
  damage_severity: DamageSeverity;
  status_changes: StatusChanges;
  defenses: Defenses;
  knockdown: Knockdown;
  epithets: Epithets;
  pacing: Pacing;
  reactions: Reactions;
  taunts: Taunts;
  initiative: string[];
  feints: string[];
  insights: Insights;
  context: Context;
  executions: string[];
  fatal_damage: string[];
  hits: { generic: string[] };
  meta: {
    popularity: { great: string[]; normal: string[] };
    skill_learns: string[];
  };
}

// ─── Conclusions ──────────────────────────────────────────────────────────
