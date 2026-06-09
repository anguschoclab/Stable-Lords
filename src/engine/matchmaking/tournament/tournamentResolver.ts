import type { GameState, Warrior, FightSummary, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { FightId, WarriorId, StableId } from '@/types/shared.types';
import type { FightOutcome } from '@/types/combat.types';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ownerAI';
import { FightingStyle } from '@/types/shared.types';
import { findWarriorById } from './tournamentStateMutator';
import { StateImpact, mergeImpacts, resolveImpacts } from '@/engine/impacts';
import { createFightSummary } from '@/engine/core/fightSummaryFactory';
import { updateWarriorFromBoutOutcome } from '@/engine/warrior/careerUpdate';
import { selectArenaForTournamentBout } from './tournamentArenaSelection';

/**
 * Defines the shape of round resolution result.
 */
export interface RoundResolutionResult {
  impact: StateImpact;
  roundResults: string[];
}

/**
 * Resolves a single round of a tournament.
 * Processes all unresolved bouts for the current round and advances the bracket.
 */
export function resolveRound(
  state: GameState,
  tournamentId: string,
  seed: number,
  rng?: IRNGService
): RoundResolutionResult {
  const rngService = rng || new SeededRNGService(seed);
  const tournament = (state.tournaments || []).find((t) => t.id === tournamentId);
  if (!tournament || tournament.completed) return { impact: {}, roundResults: [] };

  const bracket = [...tournament.bracket];
  const currentRound = bracket.reduce<number | null>((min, b) => {
    if (b.winner !== undefined) return min;
    return min === null || b.round < min ? b.round : min;
  }, null);
  if (currentRound === null) return { impact: {}, roundResults: [] };

  const roundBouts = bracket.filter((b) => b.winner === undefined && b.round === currentRound);
  const winners: { id: WarriorId; name: string; stableId?: StableId }[] = [];
  const losers: { id: WarriorId; name: string; stableId?: StableId }[] = [];
  const impacts: StateImpact[] = [];

  for (const bout of roundBouts) {
    if (bout.warriorIdD === 'bye') {
      bout.winner = 'A';
      const wABye = findWarriorById(state, bout.warriorIdA, tournament);
      winners.push({
        id: bout.warriorIdA,
        name: wABye?.name ?? 'Unknown',
        stableId: bout.stableIdA,
      });
      continue;
    }

    const wA = findWarriorById(state, bout.warriorIdA, tournament);
    const wD = findWarriorById(state, bout.warriorIdD, tournament);

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

    const planA = wA.plan || getAIPlan(state, wA, wD.style, wD.stableId);
    const planD = wD.plan || getAIPlan(state, wD, wA.style, wA.stableId);

    // Select arena dynamically for tournament bout
    const bracketSize = tournament.bracket.length;
    const tournamentArenaId = selectArenaForTournamentBout(
      () => rngService.next(),
      { bracketSize }
    );

    const outcome = simulateFight(
      planA,
      planD,
      wA,
      wD,
      Math.floor(rngService.next() * 1000000),
      state.trainers,
      'Clear',
      tournamentArenaId,
      state.crowdMood
    );

    bout.winner = outcome.winner;
    bout.by = outcome.by;
    bout.fightId = rngService.uuid() as FightId;

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
    const boutImpact = applyBoutResultsToImpact(
      state,
      wA,
      wD,
      outcome,
      tournament.id,
      tournament.name,
      rngService
    );
    impacts.push(boutImpact);
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
        const bronzeBout = {
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

  const isComplete = winners.length <= 1;
  const champion = isComplete && winners.length > 0 ? winners[0]?.name : undefined;

  const updatedTournaments = (state.tournaments || []).map((t) =>
    t.id === tournamentId ? { ...t, bracket, completed: isComplete, champion } : t
  );
  impacts.push({ tournaments: updatedTournaments });

  const mergedImpact = mergeImpacts(impacts);
  return {
    impact: mergedImpact,
    roundResults:
      isComplete && champion ? [`🏆 CHAMPION: ${champion} has won the ${tournament.name}!`] : [],
  };
}

/**
 * Resolves an entire tournament deterministically.
 * Continues resolving rounds until the tournament is complete.
 */
export function resolveCompleteTournament(
  state: GameState,
  tournamentId: string,
  seed: number
): StateImpact {
  const impacts: StateImpact[] = [];
  let currentState = state;
  let safety = 0;

  while (safety < 10) {
    const tour = (currentState.tournaments || []).find((t) => t.id === tournamentId);
    if (!tour || tour.completed) break;

    const result = resolveRound(currentState, tournamentId, seed + safety);
    impacts.push(result.impact);

    // Apply impact to state for next round
    currentState = resolveImpacts(currentState, [result.impact]);

    safety++;
  }

  return mergeImpacts(impacts);
}

// Helper functions

function getAIPlan(
  state: GameState,
  w: Warrior,
  opponentStyle?: FightingStyle,
  opponentOwnerId?: string
) {
  // warrior.stableId is rival.id (StableId), not owner.id — see warriorFactory + recruitmentWorker fixes
  const rival = state.rivalMap?.get(w.stableId as string);
  if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };

  let grudgeIntensity = 0;
  if (opponentOwnerId) {
    const grudge = state.ownerGrudges?.find(
      (g) =>
        (g.ownerIdA === rival.owner.id && g.ownerIdB === opponentOwnerId) ||
        (g.ownerIdB === rival.owner.id && g.ownerIdA === opponentOwnerId)
    );
    grudgeIntensity = grudge?.intensity ?? 0;
  }

  return aiPlanForWarrior(
    w,
    rival.owner.personality || 'Pragmatic',
    rival.philosophy || 'Opportunist',
    opponentStyle,
    rival.strategy?.intent,
    grudgeIntensity
  );
}

function applyBoutResultsToImpact(
  state: GameState,
  wA: Warrior,
  wD: Warrior,
  outcome: FightOutcome,
  tId: string,
  tName: string,
  rng: IRNGService
): StateImpact {
  const isKill = outcome.by === 'Kill';
  const winnerSide = outcome.winner;
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<RivalStableData>>();

  const summary: FightSummary = createFightSummary({
    warriorA: wA,
    warriorD: wD,
    outcome,
    week: state.week,
    tournamentId: tId,
    tournamentName: tName,
    rng,
  });

  rosterUpdates.set(wA.id, updateWarriorFromBoutOutcome(wA, true, winnerSide, isKill));
  rosterUpdates.set(wD.id, updateWarriorFromBoutOutcome(wD, false, winnerSide, isKill));

  state.rivals.forEach((r) => {
    const rosterChanges: Warrior[] = [];
    r.roster.forEach((w) => {
      if (w.id === wA.id)
        rosterChanges.push(updateWarriorFromBoutOutcome(w, true, winnerSide, isKill));
      else if (w.id === wD.id)
        rosterChanges.push(updateWarriorFromBoutOutcome(w, false, winnerSide, isKill));
      else rosterChanges.push(w);
    });
    if (rosterChanges.some((c) => c.id === wA.id || c.id === wD.id)) {
      // Key by rival.id (StableId), not owner.id
      rivalsUpdates.set(r.id, { roster: rosterChanges });
    }
  });

  const impact: StateImpact = {
    arenaHistory: [summary],
    rosterUpdates,
    rivalsUpdates,
  };

  if (isKill) {
    const victim = winnerSide === 'D' ? wA : wD;
    impact.graveyard = [{ ...victim, status: 'Dead', deathWeek: state.week }];
    // Mark as dead in roster updates
    const deadUpdate: Partial<Warrior> = { status: 'Dead' as const };
    rosterUpdates.set(victim.id, deadUpdate);
  }

  return impact;
}
