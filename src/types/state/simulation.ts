import type { SimulationReportId, StableId, WarriorId } from '../shared.types';
import type { Attributes, FightingStyle } from '../warrior.types';




/**
 * Defines the shape of simulation report.
 */
export interface SimulationReport {
  absoluteWeek?: number;
  id: SimulationReportId;
  week: number;
  treasuryChange: number;
  trainingGains: {
    warriorId: WarriorId;
    warriorName: string;
    attr: keyof Attributes;
    gain: number;
  }[];
  agingEvents: string[];
  healthEvents: string[];
  bouts?: import('@/types/combat.types').FightSummary[];
}



/**
 * Annual award type type.
 */
export type AnnualAwardType =
  'WARRIOR_OF_YEAR' | 'KILLER_OF_YEAR' | 'STABLE_OF_YEAR' | 'CLASS_MVP' | 'TOURNAMENT_RANK';



/**
 * Defines the shape of annual award.
 */
export interface AnnualAward {
  year: number;
  type: AnnualAwardType;
  warriorId?: WarriorId;
  warriorName?: string;
  stableId?: StableId;
  stableName?: string;
  style?: FightingStyle;
  value: number; // e.g. 15 wins, 5 kills
  reason: string;
}



/**
 * Identifier for a progression objective.
 */
export type ObjectiveId =
  | 'TOP_10_STABLE'
  | 'TOP_3_STABLE'
  | 'FIRST_TOURNAMENT_WIN'
  | 'HALL_OF_FAMER'
  | 'REALM_CHAMPION'
  | 'ARENA_TITLE'
  | 'CIRCUIT_LORD'
  | 'GRAND_CHAMPION';



/**
 * Defines the shape of a progression objective.
 */
export interface ProgressionObjective {
  id: ObjectiveId;
  label: string;
  description: string;
  completed: boolean;
  completedWeek?: number;
  completedYear?: number;
}



/**
 * Status of the overall progression campaign.
 */
export type ProgressionStatus = 'active' | 'won' | 'continued';



/**
 * Defines the shape of progression state.
 */
export interface ProgressionState {
  status: ProgressionStatus;
  stableStanding: number;
  totalStables: number;
  objectives: ProgressionObjective[];
  wonYear?: number;
  wonWeek?: number;
  acknowledgedWin?: boolean;
}


/**
 * Defines the shape of deferred bout log.
 */

/**
 * Defines the shape of deferred bout log.
 */
export interface DeferredBoutLog {
  year: number;
  season: number;
  boutId: string;
  transcript: string[];
}



/** Player-configurable house rules (non-canonical variants). */
export interface HouseRules {
  /** Kill-window probability multiplier applied to every bout. 1 = canonical. */
  deathRateMult: number;
  /** When true, fatal blows become career-threatening injuries, never deaths. */
  severeInjuryInsteadOfDeath: boolean;
}



/** Canonical (full permadeath) house rules — the default game. */
export const CANONICAL_HOUSE_RULES: HouseRules = {
  deathRateMult: 1,
  severeInjuryInsteadOfDeath: false,
};



/**
 * All-time world counters. Unlike `arenaHistory`/`graveyard` (which truncate),
 * these accumulate forever — the production counterpart of the harness-only
 * cumulativeTracker (register F3).
 */
export interface LifetimeStats {
  bouts: number;
  kills: number;
  retirements: number;
}
