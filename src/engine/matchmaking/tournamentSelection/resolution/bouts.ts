import type {
  GameState,
  Warrior,
  TournamentBout,
  TournamentEntry,
} from '@/types/state.types';
import type { FightId, WarriorId, StableId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { simulateFight } from '@/engine/simulate';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { getAIPlan } from '../utils';
import type { FightOutcome } from '@/types/combat.types';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { selectArenaForTournamentBout } from '../../tournament/tournamentArenaSelection';
import { isActive, deadIdSet } from '@/engine/warrior/warriorStatus';
import { applyBoutResults } from './results';

/**
 * Ids that can never fight again: the persistent death registry, the
 * (truncating) graveyard, and retirees. Participant snapshots inside
 * `tournaments[].participants` keep their selection-time 'Active' status
 * forever — membership in this set is the liveness authority, not the
 * snapshot's status field.
 */
function inactiveIdSet(state: GameState): Set<string> {
  const ids = deadIdSet(state);
  for (const w of state.retired ?? []) ids.add(w.id as string);
  return ids;
}

/**
 * Bracket warrior.
 */
export interface BracketWarrior {
  id: WarriorId;
  name: string;
  stableId?: StableId;
}

interface SimulateTournamentBoutArgs {
  updatedState: GameState;
  resolvedTournament: TournamentEntry;
  wA: Warrior;
  wD: Warrior;
  rng: SeededRNG;
  headless: boolean | undefined;
}

/**
 * Simulate one live bracket bout: pick plans, draw the venue, run the fight,
 * force a winner via sudden-death overtime on draws (tournament bouts cannot
 * end drawn).
 */
function simulateTournamentBout(args: SimulateTournamentBoutArgs): { outcome: FightOutcome; arenaId: string } {
  const { updatedState, resolvedTournament, wA, wD, rng } = args;
  const { headless } = args;
  const planA = wA.plan || getAIPlan(updatedState, wA, wD.style, wD.stableId);
  const planD = wD.plan || getAIPlan(updatedState, wD, wA.style, wA.stableId);

  // The Grand Championship is always fought at its designated venue — the
  // realm's climactic champions-only stage; seasonals keep the weighted draw.
  const arenaId =
    resolvedTournament.tierId === CHAMPIONS_TOURNEY.TIER_ID
      ? CHAMPIONS_TOURNEY.ARENA_ID
      : selectArenaForTournamentBout(() => rng.next());
  const outcome = simulateFight(
    { planA: planA, planD: planD, warriorA: wA, warriorD: wD, providedRng: rng.roll(0, 1000000), trainers: updatedState.trainers, weather: updatedState.weather ?? 'Clear', arenaId: arenaId, crowdMood: updatedState.crowdMood, headless: headless, deathRateMult: updatedState.houseRules?.deathRateMult }
  );

  // Tournament bouts cannot end in a draw — the bracket needs a winner.
  // Sudden-death overtime: the busier fighter (more hits landed) advances;
  // a true tie falls to a seeded coin flip. Without this, a drawn bout would
  // silently advance the defender via the `winner === 'A'` ternary below.
  if (outcome.winner === null) {
    const hitsA = outcome.post?.hitsA ?? 0;
    const hitsD = outcome.post?.hitsD ?? 0;
    outcome.winner = hitsA === hitsD ? (rng.next() < 0.5 ? 'A' : 'D') : hitsA > hitsD ? 'A' : 'D';
  }

  return { outcome, arenaId };
}

interface ResolveBoutArgs {
  bout: TournamentBout;
  updatedState: GameState;
  resolvedTournament: TournamentEntry;
  rng: SeededRNG;
  headless: boolean | undefined;
  winners: BracketWarrior[];
  losers: BracketWarrior[];
}

/**
 * Resolve one bracket bout: bye/forfeit short-circuits, live simulate with
 * sudden-death overtime for draws, then apply results into state.
 */
function resolveBout(args: ResolveBoutArgs): GameState {
  const { bout, updatedState, resolvedTournament, rng, headless } = args;
  const { winners, losers } = args;
  // The third-place playoff is terminal: its winner medals but does not
  // feed the next round's pairings.
  const advancesWinner = !bout.isBronzeMatch;
  if (bout.warriorIdD === 'bye') {
    bout.winner = 'A';
    const wABye = findWarriorById(updatedState, bout.warriorIdA, resolvedTournament);
    if (advancesWinner) {
      winners.push({
        id: bout.warriorIdA,
        name: wABye?.name ?? 'Unknown',
        stableId: bout.stableIdA,
      });
    }
    return updatedState;
  }

  const wA = findWarriorById(updatedState, bout.warriorIdA, resolvedTournament);
  const wD = findWarriorById(updatedState, bout.warriorIdD, resolvedTournament);

  // Liveness: a stale 'Active' participant snapshot of a dead/retired
  // warrior forfeits to the live side instead of being simulated — the kill
  // that produces a re-kill divergence used to fire exactly here.
  const inactive = inactiveIdSet(updatedState);
  const liveA = wA && isActive(wA) && !inactive.has(wA.id) ? wA : undefined;
  const liveD = wD && isActive(wD) && !inactive.has(wD.id) ? wD : undefined;

  if (!liveA || !liveD) {
    bout.winner = liveA ? 'A' : 'D';
    const winnerObj = liveA
      ? { id: liveA.id, name: liveA.name, stableId: liveA.stableId }
      : liveD
        ? { id: liveD.id, name: liveD.name, stableId: liveD.stableId }
        : undefined;
    if (winnerObj && advancesWinner) winners.push(winnerObj);
    return updatedState;
  }

  const cA = liveA;
  const cD = liveD;

  const { outcome, arenaId } = simulateTournamentBout(
    { updatedState: updatedState, resolvedTournament: resolvedTournament, wA: cA, wD: cD, rng: rng, headless: headless }
  );

  bout.winner = outcome.winner;
  bout.by = outcome.by;
  bout.fightId = rng.uuid('bout') as FightId;

  if (advancesWinner) {
    recordAdvancement(outcome, cA, cD, winners, losers);
  }
  return applyBoutResults(
    { state: updatedState, wA: cA, wD: cD, outcome: outcome, tId: resolvedTournament.id, tName: resolvedTournament.name, rng: rng, skipFatigue: undefined, arenaId: arenaId }
  );
}

/**
 * Push the bout's winner/loser onto the next-round seeding lists.
 */
function recordAdvancement(
  outcome: FightOutcome,
  cA: Warrior,
  cD: Warrior,
  winners: BracketWarrior[],
  losers: BracketWarrior[]
): void {
  winners.push(
    outcome.winner === 'A'
      ? { id: cA.id, name: cA.name, stableId: cA.stableId }
      : { id: cD.id, name: cD.name, stableId: cD.stableId }
  );
  losers.push(
    outcome.winner === 'A'
      ? { id: cD.id, name: cD.name, stableId: cD.stableId }
      : { id: cA.id, name: cA.name, stableId: cA.stableId }
  );
}

interface ResolveRoundBoutsArgs {
  updatedState: GameState;
  resolvedTournament: TournamentEntry;
  roundBouts: TournamentBout[];
  rng: SeededRNG;
  headless: boolean | undefined;
  winners: BracketWarrior[];
  losers: BracketWarrior[];
}

/**
 * Resolves every bout in the current round: byes advance, missing warriors
 * forfeit, live bouts simulate (with sudden-death overtime for draws —
 * tournament bouts cannot end drawn), and results apply into state.
 * Bronze-match winners medal but do not advance.
 */
export function resolveRoundBouts(args: ResolveRoundBoutsArgs): GameState {
  const { resolvedTournament, roundBouts, rng, headless } = args;
  let { updatedState } = args;
  const { winners, losers } = args;
  for (const bout of roundBouts) {
    updatedState = resolveBout(
      { bout: bout, updatedState: updatedState, resolvedTournament: resolvedTournament, rng: rng, headless: headless, winners: winners, losers: losers }
    );
  }
  return updatedState;
}
