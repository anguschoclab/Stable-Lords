import type { TournamentBout } from '@/types/state.types';

export function findCurrentRoundBouts(bracket: TournamentBout[]): {
  currentRound: number | null;
  roundBouts: TournamentBout[];
} {
  let currentRound: number | null = null;
  let roundBouts: TournamentBout[] = [];
  for (const b of bracket) {
    if (b.winner !== undefined) continue;
    if (currentRound === null || b.round < currentRound) {
      currentRound = b.round;
      roundBouts = [b];
    } else if (b.round === currentRound) {
      roundBouts.push(b);
    }
  }
  return { currentRound, roundBouts };
}
