/**
 * Bout processor types and interfaces.
 * Extracted from boutProcessorService.ts for SRP separation.
 */
import type { Warrior, BoutOffer } from '@/types/state.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WeatherType } from '@/types/shared.types';
import type { StateImpact } from '@/engine/impacts';
import type { getMoodModifiers } from '@/engine/bout/crowdMood';

/**
 * Defines the shape of bout result.
 */
export interface BoutResult {
  a: Warrior;
  d: Warrior;
  outcome: FightOutcome;
  announcement?: string;
  isRivalry: boolean;
  rivalStable?: string;
  contractId?: string;
  arenaId?: string;
  weather?: WeatherType;
}

/**
 * Defines the shape of bout impact.
 */
export interface BoutImpact {
  impact: StateImpact;
  /**
   * `null` when the bout could not be fought (invalid/missing/dead
   * combatant) — the bout is skipped, not recorded as a phantom Draw.
   */
  result: BoutResult | null;
  /**
   * The contract to cancel when this bout was skipped for invalid
   * combatants — closes the offer rather than leaving a Signed ghost.
   */
  voidedOffer?: BoutOffer;
  stats: {
    death: boolean;
    playerDeath: boolean;
    injured: boolean;
    deathNames: string[];
    injuredNames: string[];
  };
}

/**
 * Defines the shape of week bout summary.
 */
export interface WeekBoutSummary {
  bouts: number;
  deaths: number;
  injuries: number;
  deathNames: string[];
  injuryNames: string[];
  hadPlayerDeath: boolean;
  hadRivalryEscalation: boolean;
}

/**
 * Defines the shape of bout context.
 */
export interface BoutContext {
  warriorMap: Map<string, Warrior>;
  warrior: Warrior;
  opponent: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  moodMods: ReturnType<typeof getMoodModifiers>;
  week: number;
  displayWeek?: number;
  playerId: string;
  contract?: BoutOffer;
  headless?: boolean;
  isTournamentBout?: boolean;
  /** Owning tournament id for `tour_*` pairings — stamped on kill events. */
  tournamentId?: string;
}
