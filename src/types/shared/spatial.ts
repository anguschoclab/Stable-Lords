import type { WeatherType } from './weather';



/**
 * Distance range type.
 */
export type DistanceRange = 'Grapple' | 'Tight' | 'Striking' | 'Extended';



/**
 * Arena zone type.
 */
export type ArenaZone = 'Center' | 'Edge' | 'Corner' | 'Obstacle';



/**
 * Commit level type.
 */
export type CommitLevel = 'Cautious' | 'Standard' | 'Full';



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
  | 'cursed';



/**
 * Defines the shape of surface mod.
 */
export interface SurfaceMod {
  initiativeMod: number; // flat bonus/penalty to INI rolls each exchange
  enduranceMult: number; // multiplier on endurance costs (1.0 = baseline)
  riposteMod: number; // flat bonus/penalty to riposte checks
}



/**
 * Defines the shape of arena weather mod.
 */
export interface ArenaWeatherMod {
  weatherType: WeatherType;
  zoneDef?: Partial<Record<ArenaZone, number>>;
  surfaceMod?: Partial<SurfaceMod>;
}



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
}
