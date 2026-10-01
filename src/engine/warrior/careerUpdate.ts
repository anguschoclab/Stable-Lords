/**
 * Warrior Career Update Logic
 * Consolidates career stat updates to eliminate DRY violations across tournament resolvers
 */
import type { Warrior } from '@/types/warrior.types';
import type { WarriorStatus, CareerRecord } from '@/types/warrior.types';
import { SEASON_POINTS } from '@/constants/core/core';
import { milestoneEpithet } from '@/data/names/epithets';

/**
 * Defines the shape of career update input.
 */
export interface CareerUpdateInput {
  isWinner: boolean;
  isKill: boolean;
  isVictim: boolean;
  fameDelta?: number;
  popularityDelta?: number;
  /** If true, skip fatigue accrual (for tournament participants during tournament week) */
  skipFatigue?: boolean;
  /** Arena where the bout took place — used to maintain the per-arena career breakdown */
  arenaId?: string;
}

/**
 * Shared career-record arithmetic for a single bout outcome.
 * `didKill` means "this warrior scored the kill" — victim bookkeeping
 * (status, `killedBy`, graveyard) lives in the mortality path, not here.
 */
export function nextCareerRecord(
  prev: CareerRecord,
  o: { isWinner: boolean; didKill: boolean; arenaId?: string }
): CareerRecord {
  const prevByArena = prev?.byArena ?? {};
  const arenaRecord = o.arenaId
    ? (prevByArena[o.arenaId] ?? { wins: 0, losses: 0, kills: 0 })
    : null;
  return {
    ...prev,
    wins: (prev?.wins || 0) + (o.isWinner ? 1 : 0),
    losses: (prev?.losses || 0) + (o.isWinner ? 0 : 1),
    kills: (prev?.kills || 0) + (o.didKill ? 1 : 0),
    byArena:
      o.arenaId && arenaRecord
        ? {
            ...prevByArena,
            [o.arenaId]: {
              wins: arenaRecord.wins + (o.isWinner ? 1 : 0),
              losses: arenaRecord.losses + (o.isWinner ? 0 : 1),
              kills: arenaRecord.kills + (o.didKill ? 1 : 0),
            },
          }
        : prevByArena,
  };
}

/** Season-points race contribution for a bout result. */
export function boutSeasonPoints(
  prev: number | undefined,
  isWinner: boolean,
  didKill: boolean
): number {
  return (
    (prev ?? 0) + (isWinner ? SEASON_POINTS.WIN + (didKill ? SEASON_POINTS.KILL_BONUS : 0) : 0)
  );
}

/** 'Flashy' flair tag earned on a flashy-tagged win; `undefined` when unchanged. */
export function flashyFlair(
  warrior: Warrior,
  isWinner: boolean,
  tags: string[]
): string[] | undefined {
  return isWinner && tags.includes('Flashy')
    ? Array.from(new Set([...(warrior.flair || []), 'Flashy']))
    : undefined;
}

/**
 * Defines the shape of career update result.
 */
export interface CareerUpdateResult {
  status: WarriorStatus;
  fatigue: number;
  career: CareerRecord;
  fame: number;
  popularity?: number;
  flair?: string[];
  seasonPoints?: number;
  /** Newly-earned milestone epithet — only present on an upgrade. */
  epithet?: string;
}

/**
 * Calculates career updates without modifying the warrior
 * Pure function for testability and predictability
 */
export function calculateCareerUpdate(
  warrior: Warrior,
  input: CareerUpdateInput
): CareerUpdateResult {
  const {
    isWinner,
    isKill,
    isVictim,
    fameDelta = 0,
    popularityDelta = 0,
    skipFatigue = false,
    arenaId,
  } = input;
  const didKill = isWinner && isKill;

  // Calculate new career stats — preserve the full record (byArena, medals, …)
  const career = nextCareerRecord(warrior.career, { isWinner, didKill, arenaId });

  // Calculate fame gain: +1 for win, +3 for kill
  const fameGain = isWinner ? (didKill ? 3 : 1) : 0;
  const fame = Math.max(0, (warrior.fame || 0) + fameGain + fameDelta);

  // Season points race: +WIN per victory, +KILL_BONUS extra for a kill
  const seasonPoints = boutSeasonPoints(warrior.seasonPoints, isWinner, didKill);

  // Calculate new status
  const status: WarriorStatus = isVictim ? 'Dead' : 'Active';

  // Calculate fatigue: reset to 0 if dead, otherwise +25 (capped at 100)
  // 🔒 Skip fatigue accrual for tournament participants during tournament week
  const fatigue = isVictim
    ? 0
    : skipFatigue
      ? warrior.fatigue || 0 // Keep current fatigue (no accrual)
      : Math.min(100, (warrior.fatigue || 0) + 25); // Normal +25 fatigue

  const result: CareerUpdateResult = {
    status,
    fatigue,
    career,
    fame,
    seasonPoints,
  };

  // Milestone epithet — only a living winner can earn one; upgrades only.
  if (!isVictim) {
    const epithet = milestoneEpithet(warrior.id, career, warrior.epithet);
    if (epithet) result.epithet = epithet;
  }

  // Only include optional fields if they have values
  if (popularityDelta !== 0) {
    result.popularity = Math.max(0, (warrior.popularity || 0) + popularityDelta);
  }

  return result;
}

/**
 * Applies a pre-calculated career update to a warrior
 * Returns a new warrior object (immutable update)
 */
export function applyCareerUpdate(warrior: Warrior, result: CareerUpdateResult): Warrior {
  const update: Partial<Warrior> = {
    status: result.status,
    fatigue: result.fatigue,
    career: result.career,
    fame: result.fame,
    seasonPoints: result.seasonPoints,
  };

  if (result.popularity !== undefined) {
    update.popularity = result.popularity;
  }

  if (result.flair !== undefined) {
    update.flair = result.flair;
  }

  if (result.epithet !== undefined) {
    update.epithet = result.epithet;
  }

  return { ...warrior, ...update };
}

/**
 * Legacy-compatible function for bout record handling
 * Matches the signature of the original updateWarriorAfterBout
 */
export function updateWarriorAfterBout(
  warrior: Warrior,
  fameDelta: number,
  popularityDelta: number,
  isWinner: boolean,
  wasKilled: boolean,
  tags: string[]
): Warrior {
  const input: CareerUpdateInput = {
    isWinner,
    isKill: wasKilled,
    isVictim: wasKilled,
    fameDelta,
    popularityDelta,
  };

  const result = calculateCareerUpdate(warrior, input);

  // Add "Flashy" flair tag if applicable
  const flair = flashyFlair(warrior, isWinner, tags);
  if (flair) result.flair = flair;

  return applyCareerUpdate(warrior, result);
}

/**
 * Convenience function for tournament resolution
 * Combines calculation and application in one step
 */
export function updateWarriorFromBoutOutcome(
  warrior: Warrior,
  isAttacker: boolean,
  winnerSide: 'A' | 'D' | null,
  isKill: boolean,
  /** If true, skip fatigue accrual (for tournament participants during tournament week) */
  skipFatigue?: boolean,
  /** Arena where the bout took place — used to maintain the per-arena career breakdown */
  arenaId?: string
): Warrior {
  const isWinner = (isAttacker && winnerSide === 'A') || (!isAttacker && winnerSide === 'D');
  const isVictim = !isWinner && isKill;

  const input: CareerUpdateInput = {
    isWinner,
    isKill,
    isVictim,
    skipFatigue,
    arenaId,
  };

  const result = calculateCareerUpdate(warrior, input);
  return applyCareerUpdate(warrior, result);
}
