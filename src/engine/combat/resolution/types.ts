/**
 * Resolution Types - FighterState and ResolutionContext definitions
 */
import { FightingStyle } from '@/types/shared.types';
import type { WarriorFavorites } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type {
  BaseSkills,
  Attributes,
  DerivedStats,
  WeatherType,
  PsychState,
  DistanceRange,
  ArenaZone,
  ArenaConfig,
  SurfaceMod,
} from '@/types/shared.types';
import type { WeatherEffect } from '../mechanics/weatherEffects';

/**
 * Defines the shape of fighter state.
 */
export interface FighterState {
  label: 'A' | 'D';
  style: FightingStyle;
  attributes: Attributes;
  skills: BaseSkills;
  derived: DerivedStats;
  plan: FightPlan;
  /** Current effective plan — may diverge from plan when a PlanCondition fires */
  activePlan: FightPlan;
  /** Psychological state derived each exchange from fight metrics */
  psychState: PsychState;
  hp: number;
  maxHp: number;
  endurance: number;
  maxEndurance: number;
  hitsLanded: number;
  hitsTaken: number;
  ripostes: number;
  consecutiveHits: number;
  armHits: number;
  legHits: number;
  favorites?: WarriorFavorites;
  /** Inherent traits — Berserker, Patient, etc. Static mods are baked into
   *  `skills`; conditional ones are evaluated each exchange in `resolveExchange`. */
  traits?: string[];
  /** Static endurance multiplier (e.g. Iron Lung trait). Multiplied into the
   *  per-exchange endurance cost in applyEnduranceCosts. Defaults to 1. */
  staticEnduranceMult?: number;
  totalFights: number;
  encumbrancePenalty?: { iniPenalty: number; enduranceMult: number };
  weaponId?: string;
  armorId?: string;
  shieldId?: string;
  desperate?: boolean;
  /** Momentum counter: −3 to +3. Builds on hits/parries, swings on ripostes. Gates kill window. */
  momentum: number;
  /** True when fighter has committed (HP < 35%, high killDesire): +20% ATT/DMG, fully open. */
  committed: boolean;
  /** True when fighter survived a commit attack — grants a free riposte on next exchange. */
  survivalStrike: boolean;
  /**
   * Recovery debt from CommitLevel. 0–3.
   * Penalises the Approach sub-phase roll by 2 per point. Decays by 1 each exchange.
   * Set via: recoveryDebt = Math.min(3, Math.max(existing, toWrite))
   */
  recoveryDebt: number;
  /** True when fighter was knocked down by a heavy hit — cleared on RECOVERY next exchange. */
  knockedDown?: boolean;
}

/**
 * Defines the shape of resolution context.
 */
export interface ResolutionContext {
  rng: () => number;
  phase: 'OPENING' | 'MID' | 'LATE';
  exchange: number;
  weather: WeatherType;
  weatherEffect: WeatherEffect;
  matchupA: number;
  matchupD: number;
  trainerModsA: Record<string, number>;
  trainerModsD: Record<string, number>;
  /** Raw trainer list — used for per-exchange specialty recalculation */
  trainers?: import('@/types/state.types').Trainer[];
  /** Snapshot of base trainer mods (without specialties) — preserved so per-exchange specialty deltas stay additive */
  baseTrainerModsA?: Record<string, number>;
  baseTrainerModsD?: Record<string, number>;
  weaponReqA: { endurancePenalty: number; attPenalty: number };
  weaponReqD: { endurancePenalty: number; attPenalty: number };
  tacticStreakA: number;
  tacticStreakD: number;
  lastOffTacticA?: string;
  lastOffTacticD?: string;
  /** Current distance range between fighters */
  range: DistanceRange;
  /** Current zone of the pushed-back fighter */
  zone: ArenaZone;
  /** Arena configuration (zone penalties, surface mods) */
  arenaConfig: ArenaConfig;
  /** Which fighter is currently in the disadvantaged zone position */
  pushedFighter?: 'A' | 'D';
  /** Surface modifiers from arenaConfig, unpacked for convenience */
  surfaceMod: SurfaceMod;
  /**
   * Furthest range reachable in this arena (from arena size profile).
   * Standard/open = 'Extended'; cramped = 'Striking'.
   */
  maxRange: DistanceRange;
  /**
   * Extra outward zone steps per hit in this arena (from arena size profile).
   * 0 = standard (Corner in 2 hits); 1 = cramped (Corner in 1 hit).
   */
  zoneStepBias: number;
  /** Crowd-mood lethality delta injected by simulate.ts. */
  crowdKillBonus?: number;
}
