import type { TournamentBout } from '@/types/game';

export function isBronzeMatch(bout: TournamentBout): boolean {
  return bout.round === 6 && bout.matchIndex === 1;
}

export function isChampionshipFinal(bout: TournamentBout, totalRounds: number): boolean {
  return bout.round === totalRounds && bout.round >= 6;
}

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

export function isByeMatch(bout: TournamentBout): boolean {
  return bout.warriorIdD === 'bye';
}

export function getEstimatedWeek(baseWeek: number, round: number): number {
  return baseWeek + (round - 1);
}
