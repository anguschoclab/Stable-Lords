import type { Warrior } from '@/types/warrior.types';
import { milestoneEpithet } from '@/data/names/epithets';
import { boutSeasonPoints, flashyFlair, nextCareerRecord } from '@/engine/warrior/careerUpdate';

/**
 * Update a warrior's state after a bout.
 *
 * Shares career/season-points/flair arithmetic with
 * `warrior/careerUpdate.ts`, but keeps bout-path semantics: `wasKilled`
 * means "this warrior scored the kill" (the victim's Dead status is
 * applied by `mortalityHandler`), fame deltas arrive tag-computed from
 * the caller, and a killing winner's fatigue resets.
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
  // Calculate fatigue: reset to 0 on a kill, otherwise +25 (capped at 100)
  // 🔒 Skip fatigue accrual for tournament participants during tournament week
  const fatigue = wasKilled
    ? 0
    : skipFatigue
      ? warrior.fatigue || 0 // Keep current fatigue (no accrual)
      : Math.min(100, (warrior.fatigue || 0) + 25); // Normal +25 fatigue

  const career = nextCareerRecord(warrior.career, { isWinner, didKill: wasKilled, arenaId });

  // Milestone epithet — only a winner upgrades; never downgrades.
  const epithet = isWinner ? milestoneEpithet(warrior.id, career, warrior.epithet) : undefined;
  const flair = flashyFlair(warrior, isWinner, tags);

  return {
    ...warrior,
    fame: Math.max(0, (warrior.fame || 0) + fameDelta),
    popularity: Math.max(0, (warrior.popularity || 0) + popularityDelta),
    career,
    flair: flair ?? warrior.flair,
    fatigue,
    seasonPoints: boutSeasonPoints(warrior.seasonPoints, isWinner, wasKilled),
    ...(epithet ? { epithet } : {}),
  };
}
