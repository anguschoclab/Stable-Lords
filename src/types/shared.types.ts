// ─── Branded IDs ───────────────────────────────────────────────────────────
/** Branded ID pattern to prevent mixing different ID types at compile time. */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

import type { EquipmentLoadout } from '@/data/equipment'; /**
                                                           * Warrior id type.
                                                           */

/**
 * Warrior id type.
 */
export type WarriorId = Brand<string, 'WarriorId'>; /**
                                                     * Stable id type.
                                                     */

/**
 * Stable id type.
 */
export type StableId = Brand<string, 'StableId'>; /**
                                                   * Promoter id type.
                                                   */

/**
 * Promoter id type.
 */
export type PromoterId = Brand<string, 'PromoterId'>; /**
                                                       * Trainer id type.
                                                       */

/**
 * Trainer id type.
 */
export type TrainerId = Brand<string, 'TrainerId'>; /**
                                                     * Fight id type.
                                                     */

/**
 * Fight id type.
 */
export type FightId = Brand<string, 'FightId'>; /**
                                                 * Tournament id type.
                                                 */

/**
 * Tournament id type.
 */
export type TournamentId = Brand<string, 'TournamentId'>; /**
                                                           * Bout offer id type.
                                                           */

/**
 * Bout offer id type.
 */
export type BoutOfferId = Brand<string, 'BoutOfferId'>; /**
                                                         * Injury id type.
                                                         */

/**
 * Injury id type.
 */
export type InjuryId = Brand<string, 'InjuryId'>; /**
                                                   * Ledger entry id type.
                                                   */

/**
 * Ledger entry id type.
 */
export type LedgerEntryId = Brand<string, 'LedgerEntryId'>; /**
                                                             * Scout report id type.
                                                             */

/**
 * Scout report id type.
 */
export type ScoutReportId = Brand<string, 'ScoutReportId'>; /**
                                                             * News id type.
                                                             */

/**
 * News id type.
 */
export type NewsId = Brand<string, 'NewsId'>; /**
                                               * Grudge id type.
                                               */

/**
 * Grudge id type.
 */
export type GrudgeId = Brand<string, 'GrudgeId'>; /**
                                                   * Rivalry id type.
                                                   */

/**
 * Rivalry id type.
 */
export type RivalryId = Brand<string, 'RivalryId'>; /**
                                                     * Insight id type.
                                                     */

/**
 * Insight id type.
 */
export type InsightId = Brand<string, 'InsightId'>; /**
                                                     * Hall entry id type.
                                                     */

/**
 * Hall entry id type.
 */
export type HallEntryId = Brand<string, 'HallEntryId'>; /**
                                                         * Simulation report id type.
                                                         */

/**
 * Simulation report id type.
 */
export type SimulationReportId = Brand<string, 'SimulationReportId'>; /**
                                                                       * FightingStyle enumeration.
                                                                       */

// ─── Fighting Styles ────────────────────────────────────────────────────────

/**
 * FightingStyle enumeration.
 */
export enum FightingStyle {
  AimedBlow = 'AIMED BLOW',
  BashingAttack = 'BASHING ATTACK',
  LungingAttack = 'LUNGING ATTACK',
  ParryLunge = 'PARRY-LUNGE',
  ParryRiposte = 'PARRY-RIPOSTE',
  ParryStrike = 'PARRY-STRIKE',
  SlashingAttack = 'SLASHING ATTACK',
  StrikingAttack = 'STRIKING ATTACK',
  TotalParry = 'TOTAL PARRY',
  WallOfSteel = 'WALL OF STEEL',
} /**
   * Style_display_names.
   */

/**
 * Style_display_names.
 */
export const STYLE_DISPLAY_NAMES: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: 'Aimed-Blow',
  [FightingStyle.BashingAttack]: 'Basher',
  [FightingStyle.LungingAttack]: 'Lunger',
  [FightingStyle.ParryLunge]: 'Parry-Lunger',
  [FightingStyle.ParryRiposte]: 'Parry-Riposte',
  [FightingStyle.ParryStrike]: 'Parry-Striker',
  [FightingStyle.SlashingAttack]: 'Slasher',
  [FightingStyle.StrikingAttack]: 'Striker',
  [FightingStyle.TotalParry]: 'Total-Parry',
  [FightingStyle.WallOfSteel]: 'Wall of Steel',
}; /**
    * Style_abbrev.
    */

/**
 * Style_abbrev.
 */
export const STYLE_ABBREV: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]: 'AB',
  [FightingStyle.BashingAttack]: 'BA',
  [FightingStyle.LungingAttack]: 'LU',
  [FightingStyle.ParryLunge]: 'PL',
  [FightingStyle.ParryRiposte]: 'PR',
  [FightingStyle.ParryStrike]: 'PS',
  [FightingStyle.SlashingAttack]: 'SL',
  [FightingStyle.StrikingAttack]: 'ST',
  [FightingStyle.TotalParry]: 'TP',
  [FightingStyle.WallOfSteel]: 'WS',
}; /**
    * Defines the shape of attributes.
    */

// ─── Attributes ─────────────────────────────────────────────────────────────

/**
 * Defines the shape of attributes.
 */
export interface Attributes {
  ST: number; // Strength (3-25)
  CN: number; // Constitution (3-25)
  SZ: number; // Size (3-25)
  WT: number; // Wit (3-25)
  WL: number; // Will (3-25)
  SP: number; // Speed (3-25)
  DF: number; // Deftness (3-25)
} /**
   * Attribute_keys.
   */

/**
 * Attribute_keys.
 */
export const ATTRIBUTE_KEYS: (keyof Attributes)[] = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF']; /**
                                                                                                 * Attribute_labels.
                                                                                                 */

/**
 * Attribute_labels.
 */
export const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  ST: 'Strength',
  CN: 'Constitution',
  SZ: 'Size',
  WT: 'Wit',
  WL: 'Will',
  SP: 'Speed',
  DF: 'Deftness',
}; /**
    * Attribute_min.
    */

/**
 * Attribute_min.
 */
export const ATTRIBUTE_MIN = 3; /**
                                 * Attribute_max.
                                 */

/**
 * Attribute_max.
 */
export const ATTRIBUTE_MAX = 25; /**
                                  * Attribute_total.
                                  */

/**
 * Attribute_total.
 */
export const ATTRIBUTE_TOTAL = 70; /**
                                    * Defines the shape of base skills.
                                    */

// ─── Base Skills ────────────────────────────────────────────────────────────

/**
 * Defines the shape of base skills.
 */
export interface BaseSkills {
  ATT: number; // Attack
  PAR: number; // Parry
  DEF: number; // Defense
  INI: number; // Initiative
  RIP: number; // Riposte
  DEC: number; // Decisiveness
} /**
   * Defines the shape of derived stats.
   */

// ─── Derived Stats ──────────────────────────────────────────────────────────

/**
 * Defines the shape of derived stats.
 */
export interface DerivedStats {
  hp: number;
  endurance: number;
  damage: number;
  encumbrance: number;
} /**
   * Season type.
   */

// ─── Global Enums/Constants ─────────────────────────────────────────────────

/**
 * Season type.
 */
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'; /**
                                                               * Crowd mood type type.
                                                               */

/**
 * Crowd mood type type.
 */
export type CrowdMoodType = 'Calm' | 'Bloodthirsty' | 'Theatrical' | 'Solemn' | 'Festive'; /**
                                                                                            * Defines the shape of newsletter item.
                                                                                            */

/**
 * Defines the shape of newsletter item.
 */
export interface NewsletterItem {
  id: string; // Could be branded but loosely used in many places for now
  week: number;
  title: string;
  items: string[];
  category?: 'event' | 'news' | 'newsletter';
} /**
   * Shield size type.
   */

// ─── Equipment ──────────────────────────────────────────────────────────────
/**
 * Defines the shape of weapon.
 */

/**
 * Attack target type.
 */

// ─── Fight Plan ─────────────────────────────────────────────────────────────

/**
 * Attack target type.
 */
export type AttackTarget =
  | 'Head'
  | 'Chest'
  | 'Abdomen'
  | 'Right Arm'
  | 'Left Arm'
  | 'Right Leg'
  | 'Left Leg'
  | 'Any'; /**
            * Protect target type.
            */

/**
 * Protect target type.
 */
export type ProtectTarget = 'Head' | 'Body' | 'Arms' | 'Legs' | 'Any'; /**
                                                                        * Offensive tactic type.
                                                                        */

/**
 * Offensive tactic type.
 */
export type OffensiveTactic = 'Lunge' | 'Slash' | 'Bash' | 'Decisiveness' | 'none'; /**
                                                                                     * Defensive tactic type.
                                                                                     */

/**
 * Defensive tactic type.
 */
export type DefensiveTactic = 'Dodge' | 'Parry' | 'Riposte' | 'Responsiveness' | 'none'; /**
                                                                                          * Defines the shape of phase strategy.
                                                                                          */

/**
 * Defines the shape of phase strategy.
 */
export interface PhaseStrategy {
  OE: number;
  AL: number;
  killDesire: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  aggressionBias?: number; // 0-10
} /**
   * Defines the shape of desperate plan.
   */

/**
 * Defines the shape of desperate plan.
 */
export interface DesperatePlan {
  OE: number;
  AL: number;
  killDesire?: number;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  target?: AttackTarget;
  protect?: ProtectTarget;
} /**
   * Defines the shape of fight plan.
   */

/**
 * Defines the shape of fight plan.
 */
export interface FightPlan {
  style: FightingStyle;
  OE: number;
  AL: number;
  killDesire?: number;
  aggressionBias?: number;
  openingMove?: 'Safe' | 'Aggressive' | 'Measured';
  fallbackCondition?: 'FLEE' | 'TURTLE' | 'BERZERK' | 'None';
  target?: AttackTarget;
  protect?: ProtectTarget;
  offensiveTactic?: OffensiveTactic;
  defensiveTactic?: DefensiveTactic;
  equipment?: EquipmentLoadout;
  /** Overrides ALL strategy when fighter is desperate (HP < 30% OR endurance < 20%). Canonical "Desperate" slot. */
  desperatePlan?: DesperatePlan;
  phases?: {
    opening?: PhaseStrategy;
    mid?: PhaseStrategy;
    late?: PhaseStrategy;
  };
  /** Conditional overrides evaluated mid-fight based on fight state. First match wins. */
  conditions?: PlanCondition[];
  /** 0-10 tendency to feint; only triggers when WT ≥ 15 and OE ≥ 4 */
  feintTendency?: number;
  /** Preferred range — influences Approach roll motivation bonus (+2 when contesting toward this range) */
  rangePreference?: DistanceRange;
  /** Stable owner's personality — drives in-bout adaptation conditions (see ownerAI.ts). Undefined for player-authored plans. */
  ownerPersonality?: 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician';
} /**
   * Condition trigger type type.
   */

// ─── Conditional Fight Plans ─────────────────────────────────────────────────

/**
 * Condition trigger type type.
 */
export type ConditionTriggerType =
  | 'HP_BELOW'
  | 'HP_ABOVE'
  | 'MOMENTUM_LEAD'
  | 'MOMENTUM_DEFICIT'
  | 'PHASE_IS'
  | 'ENDURANCE_BELOW'; /**
                        * Defines the shape of plan condition.
                        */

/**
 * Defines the shape of plan condition.
 */
export interface PlanCondition {
  trigger: { type: ConditionTriggerType; value: number | string };
  override: Partial<
    Pick<FightPlan, 'OE' | 'AL' | 'killDesire' | 'offensiveTactic' | 'defensiveTactic'>
  >;
  label?: string;
} /**
   * Psych state type.
   */

/**
 * Psych state type.
 */
export type PsychState =
  | 'Neutral'
  | 'InTheZone'
  | 'Rattled'
  | 'Desperate'
  | 'Cruising'
  | 'FatiguePanic'; /**
                     * Distance range type.
                     */

// ─── Spatial / Distance System ─────────────────────────────────────────────

/**
 * Distance range type.
 */
export type DistanceRange = 'Grapple' | 'Tight' | 'Striking' | 'Extended'; /**
                                                                            * Arena zone type.
                                                                            */

/**
 * Arena zone type.
 */
export type ArenaZone = 'Center' | 'Edge' | 'Corner' | 'Obstacle'; /**
                                                                    * Commit level type.
                                                                    */

/**
 * Commit level type.
 */
export type CommitLevel = 'Cautious' | 'Standard' | 'Full'; /**
                                                             * Arena tag type.
                                                             */

/**
 * Arena tag type.
 */
export type ArenaTag =
  | 'outdoor'
  | 'indoor'
  | 'elevated'
  | 'water'
  | 'cramped'
  | 'open'
  | 'premium'
  | 'uneven'
  | 'ruins'
  | 'magical'
  | 'living'
  | 'cursed'; /**
                * Defines the shape of surface mod.
                */

/**
 * Defines the shape of surface mod.
 */
export interface SurfaceMod {
  initiativeMod: number; // flat bonus/penalty to INI rolls each exchange
  enduranceMult: number; // multiplier on endurance costs (1.0 = baseline)
  riposteMod: number; // flat bonus/penalty to riposte checks
} /**
   * Defines the shape of arena weather mod.
   */

/**
 * Defines the shape of arena weather mod.
 */
export interface ArenaWeatherMod {
  weatherType: WeatherType;
  zoneDef?: Partial<Record<ArenaZone, number>>;
  surfaceMod?: Partial<SurfaceMod>;
} /**
   * Defines the shape of arena config.
   */

/**
 * Defines the shape of arena config.
 */
export interface ArenaConfig {
  id: string;
  name: string;
  tags: ArenaTag[];
  tier: 1 | 2 | 3; // 1=common, 2=prestigious, 3=special event
  description: string;
  /**
   * Physical size of the arena.
   * Drives starting range, reachable-range cap, and zone-push depth.
   * cramped: fighters open at Tight, Extended is unreachable, hits push faster.
   * standard: default — opens at Striking, full range ladder available.
   * open: same as standard for range/zone; future use for extended motivation bonus.
   */
  size: 'cramped' | 'standard' | 'open';
  /** DEF penalty per zone (negative = penalty). E.g. Edge: -2, Corner: -4 */
  zoneDef: Partial<Record<ArenaZone, number>>;
  surfaceMod: SurfaceMod;
  weatherMods?: ArenaWeatherMod[];
  startingZone?: ArenaZone; // default "Center"
} /**
   * Trainer tier type.
   */

// ─── Trainer Types ────────────────────────────────────────────────────────

/**
 * Trainer tier type.
 */
export type TrainerTier = 'Novice' | 'Seasoned' | 'Master'; /**
                                                             * Trainer focus type.
                                                             */

/**
 * Trainer focus type.
 */
export type TrainerFocus = 'Aggression' | 'Defense' | 'Endurance' | 'Mind' | 'Healing'; /**
                                                                                         * Trainer specialty type.
                                                                                         */

/**
 * Trainer specialty type.
 */
export type TrainerSpecialty =
  | 'KillerInstinct' // Aggression: kill-window bonus when enemy HP < 40%
  | 'IronConditioning' // Endurance: stamina drain −10% in LATE phase
  | 'CounterFighter' // Defense: riposte damage +15% after successful parry
  | 'Footwork' // Defense: initiative +3 in MID/LATE phase
  | 'IronGuard' // Defense: damage taken −10% while endurance > 60%
  | 'Finisher' // Aggression: ATT +10% when momentum >= 2
  | 'RopeADope'; /**
                  * Scout quality type.
                  */
// Endurance: fatigue penalty reduced 30%

// ─── Scouting Types ───────────────────────────────────────────────────────

/**
 * Scout quality type.
 */
export type ScoutQuality = 'Basic' | 'Detailed' | 'Expert'; /**
                                                             * Weather type type.
                                                             */

// ─── Weather Types ────────────────────────────────────────────────────────

/**
 * Weather type type.
 */
export type WeatherType =
  | 'Clear'
  | 'Rainy'
  | 'Sweltering'
  | 'Breezy'
  | 'Overcast'
  | 'Blazing Sun'
  | 'Gale'
  | 'Blood Moon'
  | 'Eclipse'
  | 'Sandstorm'
  | 'Zephyr'
  | 'Tornado'
  | 'Blizzard'
  | 'Dense Fog'
  | 'Mist'
  | 'Thunderstorm'
  | 'Gravity Anomaly'
  | 'Ashfall'
  | 'Acid Rain'
  | 'Mana Surge'
  | 'Rainbow'
  | 'Scorching Wind'
  | 'Spooky Night'
  | 'Meteor Shower'
  | 'Solar Flare'
  | 'Abyssal Gloom'
  | 'Cursed Miasma'
  | 'Hailstorm'
  | 'Arcane Storm'
  | 'Blood Rain'
  | 'Locust Swarm'
  | 'Aurora Borealis'
  | 'Chaotic Winds'
  | 'Aether Storm'
  | 'Mirage'
  | 'Ember Rain'
  | 'Zephyr'
  | 'Wildfire Smoke';

/**
 * Defines the shape of death event.
 */
export interface DeathEvent {
  boutId: string;
  killerId: string;
  deathSummary: string;
  memorialTags: string[];
} /**
   * Defines the shape of trainer.
   */

// ─── Trainer Interface ───────────────────────────────────────────────────────

/**
 * Defines the shape of trainer.
 */
export interface Trainer {
  id: string;
  name: string;
  tier: TrainerTier;
  focus: TrainerFocus;
  fame: number;
  age: number;
  contractWeeksLeft: number; // 0 = expired
  retiredFromWarrior?: string; // warrior name if converted
  retiredFromStyle?: FightingStyle;
  styleBonusStyle?: FightingStyle; // bonus for warriors of this style
  legacyWins?: number;
  legacyKills?: number;
  specialty?: TrainerSpecialty;
}
