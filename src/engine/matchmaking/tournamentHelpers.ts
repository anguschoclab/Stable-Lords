import type { TournamentBout } from '@/types/game';

/**
 * Flag-first bronze check. When `isBronzeMatch` is set (all brackets built by
 * the current engine) it is authoritative. For brackets serialized before the
 * flag existed, the positional (round 6, matchIndex 1) slot only counts when
 * it actually sits in the championship round — in a larger bracket that slot
 * is an ordinary bout (M6). Callers with bracket context should pass
 * `finalsRound` (= max round); without it the check is flag-only.
 */
export function isBronzeMatch(bout: TournamentBout, finalsRound?: number): boolean {
  if (bout.isBronzeMatch !== undefined) return bout.isBronzeMatch;
  return (
    bout.round === 6 &&
    bout.matchIndex === 1 &&
    bout.round === finalsRound &&
    (bout.warriorIdD as unknown as string) !== 'bye'
  );
}

/**
 *
 */
export function isChampionshipFinal(bout: TournamentBout, totalRounds: number): boolean {
  return bout.round === totalRounds && bout.round >= 6;
}

/**
 *
 */
export function getRoundName(round: number, totalRounds: number): string {
  const roundNames: Record<number, string> = {
    1: 'Round of 64',
    2: 'Round of 32',
    3: 'Round of 16',
    4: 'Quarter-finals',
    5: 'Semi-finals',
    6: 'Finals & Bronze',
    7: 'Championship',
  };

  if (round === totalRounds && round === 7) return 'Championship';
  if (round === totalRounds && round === 6) return 'Finals';

  return roundNames[round] || `Round ${round}`;
}

/**
 *
 */
export function isByeMatch(bout: TournamentBout): boolean {
  return bout.warriorIdD === 'bye';
}

/**
 *
 */
export function getEstimatedWeek(baseWeek: number, round: number): number {
  return baseWeek + (round - 1);
}
