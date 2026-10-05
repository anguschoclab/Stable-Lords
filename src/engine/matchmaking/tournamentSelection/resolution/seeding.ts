import type { GameState, TournamentBout, TournamentEntry } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { findWarriorById } from '@/engine/core/warriorLookup';
import type { BracketWarrior } from './bouts';

/**
 * Seeds the next bracket round from this round's winners (bye on odd count)
 * and injects the bronze playoff when the semi-finals just resolved.
 */
export function seedNextRound(
  bracket: TournamentBout[],
  currentRound: number,
  winners: BracketWarrior[],
  losers: BracketWarrior[]
): void {
  if (winners.length <= 1) return;
  const nextRound = currentRound + 1;

  // Standard Bracket progression
  for (let i = 0; i < winners.length; i += 2) {
    const wA = winners[i];
    if (!wA) continue;
    if (i + 1 < winners.length) {
      const wD = winners[i + 1];
      if (!wD) continue;
      bracket.push({
        round: nextRound,
        matchIndex: i / 2,
        warriorIdA: wA.id,
        warriorIdD: wD.id,
        stableIdA: wA.stableId,
        stableIdD: wD.stableId,
      });
    } else {
      // The bye stays unresolved until its round runs — a preset winner is
      // skipped by findCurrentRoundBouts, so the recipient never entered the
      // next winners list and was silently eliminated instead of advancing.
      bracket.push({
        round: nextRound,
        matchIndex: i / 2,
        warriorIdA: wA.id,
        warriorIdD: 'bye' as unknown as WarriorId,
      });
    }
  }

  // 🥉 Bronze Match Injection: the just-resolved round was the semi-final iff
  // it produced exactly 2 winners (who meet in the final) AND 2 losers (who
  // playoff for third). Works for any bracket size — 64-man (semis at round
  // 5), 8-man (round 2), 4-man (round 1) — and byes never reach `losers`, so
  // an irregular 3-man "semifinal" yields one loser and no playoff.
  if (winners.length === 2 && losers.length === 2) {
    const bA = losers[0];
    const bD = losers[1];
    if (bA && bD) {
      const bronzeBout: TournamentBout = {
        round: nextRound, // Bronze Match happens alongside the Finals
        matchIndex: 1, // Finals is index 0
        warriorIdA: bA.id,
        warriorIdD: bD.id,
        stableIdA: bA.stableId,
        stableIdD: bD.stableId,
        isBronzeMatch: true,
      };
      bracket.push(bronzeBout);
    }
  }
}

/**
 * Champion = winner of the championship bout (latest non-bronze bout).
 * Resolved only when the bracket is complete. Returns the warrior (or
 * bracket stub) so the canonical `name` stays a snapshot field while
 * news strings can decorate with the earned epithet.
 */
export function resolveChampion(
  bracket: TournamentBout[],
  isComplete: boolean,
  winners: BracketWarrior[],
  state: GameState,
  tournament: TournamentEntry
): { name: string; epithet?: string } | undefined {
  const finalsBout = [...bracket]
    .filter((b) => !b.isBronzeMatch)
    .sort((a, b) => b.round - a.round || a.matchIndex - b.matchIndex)[0];
  const championId =
    isComplete && finalsBout?.winner
      ? finalsBout.winner === 'A'
        ? finalsBout.warriorIdA
        : finalsBout.warriorIdD
      : undefined;
  return championId
    ? (findWarriorById(state, championId, tournament) ?? winners.find((w) => w.id === championId))
    : undefined;
}
