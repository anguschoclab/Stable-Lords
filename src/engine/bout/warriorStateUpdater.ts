import type { Warrior } from '@/types/warrior.types';
import { SEASON_POINTS } from '@/constants/core/core';

/**
 * Update a warrior's state after a bout
 * Consolidates fame, popularity, career stats, flair updates, and fatigue
 */
export function updateWarriorAfterBout(
  warrior: Warrior,
  fameDelta: number,
  popularityDelta: number,
  isWinner: boolean,
  wasKilled: boolean,
  tags: string[],
  /** If true, skip fatigue accrual (for tournament participants during tournament week) */
  skipFatigue?: boolean,
  /** Arena where the bout took place — used to maintain per-arena career breakdown */
  arenaId?: string
): Warrior {
  // Calculate fatigue: reset to 0 if killed, otherwise +25 (capped at 100)
  // 🔒 Skip fatigue accrual for tournament participants during tournament week
  const fatigue = wasKilled
    ? 0
    : skipFatigue
      ? warrior.fatigue || 0 // Keep current fatigue (no accrual)
      : Math.min(100, (warrior.fatigue || 0) + 25); // Normal +25 fatigue

  const prevByArena = warrior.career.byArena ?? {};
  const arenaRecord = arenaId ? (prevByArena[arenaId] ?? { wins: 0, losses: 0, kills: 0 }) : null;
  const byArena =
    arenaId && arenaRecord
      ? {
          ...prevByArena,
          [arenaId]: {
            wins: arenaRecord.wins + (isWinner ? 1 : 0),
            losses: arenaRecord.losses + (!isWinner ? 1 : 0),
            kills: arenaRecord.kills + (wasKilled ? 1 : 0),
          },
        }
      : prevByArena;

  return {
    ...warrior,
    fame: Math.max(0, (warrior.fame || 0) + fameDelta),
    popularity: Math.max(0, (warrior.popularity || 0) + popularityDelta),
    career: {
      ...warrior.career,
      wins: (warrior.career.wins || 0) + (isWinner ? 1 : 0),
      losses: (warrior.career.losses || 0) + (!isWinner ? 1 : 0),
      kills: (warrior.career.kills || 0) + (wasKilled ? 1 : 0),
      byArena,
    },
    flair:
      isWinner && tags.includes('Flashy')
        ? Array.from(new Set([...(warrior.flair || []), 'Flashy']))
        : warrior.flair,
    fatigue,
    seasonPoints:
      (warrior.seasonPoints ?? 0) +
      (isWinner ? SEASON_POINTS.WIN + (wasKilled ? SEASON_POINTS.KILL_BONUS : 0) : 0),
  };
}
