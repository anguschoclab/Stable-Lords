/**
 * Narrative Content Types
 * Comprehensive TypeScript interfaces for narrativeContent.json
 */

import type { CrowdMoodType } from './shared.types';/**
                                                     * Defines the shape of mood tone record.
                                                     */


// ─── UX Metadata ────────────────────────────────────────────────────────

/**
 * Defines the shape of mood tone record.
 */
export interface MoodToneRecord {
  adjectives: string[];
  opener: string[];
  closer: string[];
}/**
  * Defines the shape of ux metadata.
  */


/**
 * Defines the shape of ux metadata.
 */
export interface UxMetadata {
  version: string;
  description: string;
  mood_tone: Record<CrowdMoodType, MoodToneRecord>;
}/**
  * Defines the shape of persona descriptor.
  */


// ─── Persona Descriptors ─────────────────────────────────────────────────

/**
 * Defines the shape of persona descriptor.
 */
export interface PersonaDescriptor {
  min: number;
  text: string;
}/**
  * Defines the shape of persona skill.
  */


/**
 * Defines the shape of persona skill.
 */
export interface PersonaSkill {
  high: PersonaDescriptor[];
  low: PersonaDescriptor[];
}/**
  * Defines the shape of persona good.
  */


/**
 * Defines the shape of persona good.
 */
export interface PersonaGood {
  initiative: PersonaSkill;
  riposte: PersonaSkill;
  attack: PersonaSkill;
  parry: PersonaSkill;
  defense: PersonaSkill;
  endurance: PersonaSkill;
}/**
  * Defines the shape of persona bad.
  */


/**
 * Defines the shape of persona bad.
 */
export interface PersonaBad {
  initiative: PersonaSkill;
  attack: PersonaSkill;
}/**
  * Defines the shape of persona descriptors.
  */


/**
 * Defines the shape of persona descriptors.
 */
export interface PersonaDescriptors {
  coordination: Record<string, string>;
  activity: Record<string, string>;
}/**
  * Defines the shape of persona.
  */


/**
 * Defines the shape of persona.
 */
export interface Persona {
  good: PersonaGood;
  bad: PersonaBad;
  descriptors: PersonaDescriptors;
}/**
  * Defines the shape of strike category.
  */


// ─── Strike Narratives ────────────────────────────────────────────────────

/**
 * Defines the shape of strike category.
 */
export interface StrikeCategory {
  glancing: string[];
  solid: string[];
  mastery: string[];
  critical_human: string[];
  critical_supernatural: string[];
  fatal: string[];
}/**
  * Defines the shape of strikes collection.
  */


/**
 * Defines the shape of strikes collection.
 */
export interface StrikesCollection {
  generic: string[];
  slashing: StrikeCategory;
  bashing: StrikeCategory;
  piercing: StrikeCategory;
  fist: StrikeCategory;
}/**
  * Defines the shape of hit locations.
  */


// ─── Play-by-Play Narratives ─────────────────────────────────────────────

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
}/**
  * Defines the shape of damage severity.
  */


/**
 * Defines the shape of damage severity.
 */
export interface DamageSeverity {
  deadly: string[];
  terrific: string[];
  powerful: string[];
  glancing: string[];
}/**
  * Defines the shape of status changes.
  */


/**
 * Defines the shape of status changes.
 */
export interface StatusChanges {
  severe: string[];
  desperate: string[];
  serious: string[];
  panic: string[];
}/**
  * Defines the shape of defenses.
  */


/**
 * Defines the shape of defenses.
 */
export interface DodgeTiers {
  tier1_low: string[];
  tier2_medium: string[];
  tier3_high: string[];
  tier4_supernatural: string[];
}

export interface Defenses {
  counterstrike: { success: string[] };
  dodge: DodgeTiers;
  parry: { success: string[] };
  shield: { success: string[] };
  parry_break: string[];
}/**
  * Defines the shape of pacing.
  */


/**
 * Defines the shape of pacing.
 */
export interface Tempo {
  ahead: string[];
  equal: string[];
  movement: string[];
}

export interface Pacing {
  stalemate: string[];
  trading_blows: string[];
  pressing: string[];
  tempo: Tempo;
}/**
  * Defines the shape of reactions.
  */


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
}/**
  * Defines the shape of taunts.
  */


/**
 * Defines the shape of taunts.
 */
export interface Taunts {
  winner: string[];
  loser: string[];
  rivalry_winner: string[];
  rivalry_loser: string[];
}/**
  * Defines the shape of insights.
  */


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
}/**
  * Defines the shape of pbp narratives.
  */


/**
 * Defines the shape of pbp narratives.
 */
export interface Attacks {
  piercing: string[];
  slashing: string[];
  bashing: string[];
  fist: string[];
}

export interface Knockdown {
  fall: string[];
  recovery: string[];
}

export interface Epithets {
  origin: string[];
  race: string[];
  style: string[];
}

export interface StyleMatchups {
  [key: string]: string[];
}

export interface Context {
  rivalry: string[];
  fame_great: string[];
  fame_unknown: string[];
  style_matchups: StyleMatchups;
}

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
}/**
  * Defines the shape of conclusions.
  */


// ─── Conclusions ──────────────────────────────────────────────────────────

/**
 * Defines the shape of conclusions.
 */
export interface Conclusions {
  Kill: string | string[];
  KO: string | string[];
  Stoppage: string | string[];
  Exhaustion: string | string[];
  Surrender: string | string[];
  Incapacitated: string | string[];
}/**
  * Defines the shape of event narrative.
  */


// ─── Events ────────────────────────────────────────────────────────────────

/**
 * Defines the shape of event narrative.
 */
export interface EventNarrative {
  title: string;
  newsletter: string[];
  injury_name?: string;
  injury_desc?: string;
}/**
  * Defines the shape of events.
  */


/**
 * Defines the shape of events.
 */
export interface Events {
  tavern_brawl: EventNarrative;
  celestial_blessing: EventNarrative;
}/**
  * Defines the shape of gazette fights.
  */


// ─── Gazette Narratives ───────────────────────────────────────────────────

/**
 * Defines the shape of gazette fights.
 */
export interface GazetteFights {
  Kill: string[];
  KO: string[];
  Stoppage: string[];
  Exhaustion: string[];
  Draw: string[];
  Default: string[];
}/**
  * Defines the shape of gazette headlines.
  */


/**
 * Defines the shape of gazette headlines.
 */
export interface GazetteHeadlines {
  LegendaryStreak: string[];
  HotStreak: string[];
  Streak: string[];
  win_streak?: string[];
  LegacyRivalry: string[];
  Rivalry: string[];
  RisingStar: string[];
  Upset: string[];
  major_upset?: string[];
  MultipleKills: string[];
  Kill: string[];
  MultipleKOs: string[];
  Standard: string[];
  Empty: string[];
  Graveyard: string[];
}/**
  * Defines the shape of gazette featured.
  */


/**
 * Defines the shape of gazette featured.
 */
export interface GazetteFeatured {
  LegendaryStreak: string[];
  HotStreak: string[];
  Streak: string[];
  LegacyRivalry: string[];
  Rivalry: string[];
  RisingStar: string[];
  Upset: string[];
  Graveyard: string[];
}/**
  * Defines the shape of season summary.
  */


/**
 * Defines the shape of season summary.
 */
export interface SeasonSummary {
  headline: string;
  body: string[];
}/**
  * Defines the shape of gazette narratives.
  */


/**
 * Defines the shape of gazette narratives.
 */
export interface GazetteNarratives {
  fights: GazetteFights;
  headlines: GazetteHeadlines;
  featured: GazetteFeatured;
  season_summary: SeasonSummary;
}/**
  * Defines the shape of fanfare.
  */


// ─── Fanfare ─────────────────────────────────────────────────────────────

/**
 * Defines the shape of fanfare.
 */
export interface Fanfare {
  resolution_title: string;
  gazette_empty: string;
  report_medical: string;
  report_combat: string;
  report_combat_empty: string;
  report_math: string;
  memorial_title: string;
  memorial_default: string;
  btn_honor: string;
  btn_planning: string;
  btn_next: string;
  armor_intro_verbs: string[];
  weapon_intro_verbs: string[];
}/**
  * Defines the shape of memorials.
  */


// ─── Memorials ────────────────────────────────────────────────────────────

/**
 * Defines the shape of memorials.
 */
export interface Memorials {
  tributes: string[];
}/**
  * Defines the shape of tier config.
  */


// ─── Recruitment ───────────────────────────────────────────────────────────

/**
 * Defines the shape of tier config.
 */
export interface TierConfig {
  points: number[];
  cost: number;
  stars: number;
}/**
  * Defines the shape of recruitment.
  */


/**
 * Defines the shape of recruitment.
 */
export interface Recruitment {
  names: string[];
  rival_stable_names: string[];
  tiers: Record<string, TierConfig>;
  origin: string[];
  style_blurbs: Record<string, string[]>;
}/**
  * Defines the shape of meta.
  */


// ─── Meta ─────────────────────────────────────────────────────────────────

/**
 * Defines the shape of meta.
 */
export interface Meta {
  flair: Record<string, string>;
  title: Record<string, string>;
  injury: Record<string, string>;
  status: Record<string, string>;
}/**
  * Defines the shape of passives.
  */


// ─── Passives ─────────────────────────────────────────────────────────────

/**
 * Defines the shape of passives.
 */
export interface Passives {
  [key: string]: string[];
}/**
  * Defines the shape of kill text.
  */


// ─── Root Narrative Content Interface ───────────────────────────────────────

/**
 * Defines the shape of kill text.
 */
export interface KillText {
  [key: string]: string[];
}/**
  * Defines the shape of narrative content.
  */


/**
 * Defines the shape of narrative content.
 */
export interface NarrativeContent {
  ux_metadata: UxMetadata;
  persona: Persona;
  strikes: StrikesCollection;
  pbp: PbpNarratives;
  conclusions: Conclusions;
  events: Events;
  gazette: GazetteNarratives;
  fanfare: Fanfare;
  memorials: Memorials;
  recruitment: Recruitment;
  meta: Meta;
  passives: Passives;
  kill_text?: KillText;
}
