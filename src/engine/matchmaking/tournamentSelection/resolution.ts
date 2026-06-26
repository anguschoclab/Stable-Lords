import type {
  GameState,
  Warrior,
  TournamentBout,
  TournamentEntry,
  FightSummary,
} from '@/types/state.types';
import type { FightId, WarriorId, StableId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { simulateFight } from '@/engine/simulate';
import { findWarriorById, getAIPlan } from './utils';
import { awardTournamentPrizes } from './awards';
import type { FightOutcome } from '@/types/combat.types';
import { createFightSummary } from '@/engine/core/fightSummaryFactory';
import { updateWarriorFromBoutOutcome } from '@/engine/warrior/careerUpdate';
import { findCurrentRoundBouts } from '../tournament/bracketUtils'; /**
 * Resolve round.
 */

/**
 * Resolve round.
 */
export function resolveRound(
  state: GameState,
  tournamentId: string,
  seed: number,
  headless?: boolean,
  tournament?: TournamentEntry
): { updatedState: GameState; roundResults: string[]; isComplete: boolean } {
  const rng = new SeededRNG(seed);
  let updatedState = { ...state };
  const resolvedTournament =
    tournament ?? (updatedState.tournaments || []).find((t) => t.id === tournamentId);
  if (!resolvedTournament || resolvedTournament.completed)
    return { updatedState, roundResults: [], isComplete: false };

  const bracket = [...resolvedTournament.bracket];
  const { currentRound, roundBouts } = findCurrentRoundBouts(bracket);
  if (currentRound === null) return { updatedState, roundResults: [], isComplete: false };
  const winners: { id: WarriorId; name: string; stableId?: StableId }[] = [];
  const losers: { id: WarriorId; name: string; stableId?: StableId }[] = [];

  for (const bout of roundBouts) {
    if (bout.warriorIdD === 'bye') {
      bout.winner = 'A';
      const wABye = findWarriorById(updatedState, bout.warriorIdA, resolvedTournament);
      winners.push({
        id: bout.warriorIdA,
        name: wABye?.name ?? 'Unknown',
        stableId: bout.stableIdA,
      });
      continue;
    }

    const wA = findWarriorById(updatedState, bout.warriorIdA, resolvedTournament);
    const wD = findWarriorById(updatedState, bout.warriorIdD, resolvedTournament);

    if (!wA || !wD) {
      bout.winner = wA ? 'A' : 'D';
      const winnerObj = wA
        ? { id: wA.id, name: wA.name, stableId: wA.stableId }
        : wD
          ? { id: wD.id, name: wD.name, stableId: wD.stableId }
          : undefined;
      if (winnerObj) winners.push(winnerObj);
      continue;
    }

    const planA = wA.plan || getAIPlan(updatedState, wA, wD.style, wD.stableId);
    const planD = wD.plan || getAIPlan(updatedState, wD, wA.style, wA.stableId);

    const outcome = simulateFight(
      planA,
      planD,
      wA,
      wD,
      rng.roll(0, 1000000),
      updatedState.trainers,
      'Clear',
      'bloodsands_arena',
      updatedState.crowdMood,
      headless
    );

    bout.winner = outcome.winner;
    bout.by = outcome.by;
    bout.fightId = rng.uuid('bout') as FightId;

    winners.push(
      outcome.winner === 'A'
        ? { id: wA.id, name: wA.name, stableId: wA.stableId }
        : { id: wD.id, name: wD.name, stableId: wD.stableId }
    );
    losers.push(
      outcome.winner === 'A'
        ? { id: wD.id, name: wD.name, stableId: wD.stableId }
        : { id: wA.id, name: wA.name, stableId: wA.stableId }
    );
    updatedState = applyBoutResults(
      updatedState,
      wA,
      wD,
      outcome,
      resolvedTournament.id,
      resolvedTournament.name,
      rng
    );
  }

  // Generate next round pairings
  if (winners.length > 1) {
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
        bracket.push({
          round: nextRound,
          matchIndex: i / 2,
          warriorIdA: wA.id,
          warriorIdD: 'bye' as unknown as WarriorId,
          winner: 'A',
        });
      }
    }

    // 🥉 Bronze Match Injection: If we just finished Semi-Finals (Round 5, winners.length === 2)
    if (currentRound === 5 && losers.length === 2) {
      const bA = losers[0];
      const bD = losers[1];
      if (bA && bD) {
        const bronzeBout: TournamentBout = {
          round: 6, // Bronze Match happens alongside the Finals
          matchIndex: 1, // Finals is index 0
          warriorIdA: bA.id,
          warriorIdD: bD.id,
          stableIdA: bA.stableId,
          stableIdD: bD.stableId,
        };
        bracket.push(bronzeBout);
      }
    }
  }

  // 🏆 7-round tournament: R1(32) → R2(16) → R3(8) → QF(4) → SF(2) → 3rd(1) → Finals(1)
  const isComplete = winners.length <= 1 && currentRound >= 7;
  const champion = isComplete ? winners[0]?.name : undefined;

  updatedState.tournaments = (updatedState.tournaments || []).map((t) =>
    t.id === tournamentId ? { ...t, bracket, completed: isComplete, champion } : t
  );

  if (isComplete && champion) {
    updatedState = awardTournamentPrizes(resolvedTournament, updatedState);
  }

  return {
    updatedState,
    roundResults:
      isComplete && champion
        ? [`🏆 CHAMPION: ${champion} has won the ${resolvedTournament.name}!`]
        : [],
    isComplete,
  };
} /**
 * Resolve complete tournament.
 */

/**
 * Resolve complete tournament.
 */
export function resolveCompleteTournament(
  state: GameState,
  tournamentId: string,
  seed: number,
  headless?: boolean
): GameState {
  let current = { ...state };
  let safety = 0;
  while (safety < 10) {
    const tour = (current.tournaments || []).find((t) => t.id === tournamentId);
    if (!tour || tour.completed) break;
    const result = resolveRound(current, tournamentId, seed + safety, headless, tour);
    current = result.updatedState;
    if (result.isComplete) break;
    safety++;
  }
  return current;
} /**
 * Apply bout results.
 * @param skipFatigue - Skip fatigue. (optional)
 */

/**
 * Apply bout results.
 * @param skipFatigue - Skip fatigue. (optional)
 */
export function applyBoutResults(
  state: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  tId: string,
  tName: string,
  rng: SeededRNG,
  /** If true, skip fatigue accrual (tournament bouts during tournament week) */
  skipFatigue?: boolean
): GameState {
  const isKill = outcome.by === 'Kill';
  const winnerSide = outcome.winner;
  const updatedState = { ...state };

  const summary: FightSummary = createFightSummary({
    warriorA: wA,
    warriorD: wD,
    outcome,
    week: state.week,
    tournamentId: tId,
    tournamentName: tName,
    rng,
  });

  updatedState.arenaHistory = [...(updatedState.arenaHistory || []), summary].slice(-500);

  // 🔒 Tournament fatigue exemption: No fatigue accrual for tournament participants during tournament week
  const shouldSkipFatigue = skipFatigue ?? state.isTournamentWeek;

  updatedState.roster = updatedState.roster.map((w) => {
    if (w.id === wA.id)
      return updateWarriorFromBoutOutcome(w, true, winnerSide, isKill, shouldSkipFatigue);
    if (w.id === wD.id)
      return updateWarriorFromBoutOutcome(w, false, winnerSide, isKill, shouldSkipFatigue);
    return w;
  });

  updatedState.rivals = updatedState.rivals.map((r) => ({
    ...r,
    roster: r.roster.map((w) => {
      if (w.id === wA.id)
        return updateWarriorFromBoutOutcome(w, true, winnerSide, isKill, shouldSkipFatigue);
      if (w.id === wD.id)
        return updateWarriorFromBoutOutcome(w, false, winnerSide, isKill, shouldSkipFatigue);
      return w;
    }),
  }));

  if (isKill) {
    const victim = winnerSide === 'D' ? wA : wD;
    updatedState.graveyard = [
      ...(updatedState.graveyard || []),
      { ...victim, status: 'Dead', deathWeek: state.week },
    ];
    updatedState.roster = updatedState.roster.filter((w) => w.id !== victim.id);
    updatedState.rivals = updatedState.rivals.map((r) => ({
      ...r,
      roster: r.roster.filter((w) => w.id !== victim.id),
    }));
  }

  return updatedState;
}
