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
import { findWarriorById } from '@/engine/core/warriorLookup';
import { getAIPlan } from './utils';
import { awardTournamentPrizes } from './awards';
import type { FightOutcome } from '@/types/combat.types';
import { createFightSummary } from '@/engine/core/fightSummaryFactory';
import { updateWarriorFromBoutOutcome } from '@/engine/warrior/careerUpdate';
import { updateEntityInList } from '@/utils/stateUtils';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { findCurrentRoundBouts } from '../tournament/bracketUtils';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { selectArenaForTournamentBout } from '../tournament/tournamentArenaSelection';
interface BracketWarrior {
  id: WarriorId;
  name: string;
  stableId?: StableId;
}

/**
 * Simulate one live bracket bout: pick plans, draw the venue, run the fight,
 * force a winner via sudden-death overtime on draws (tournament bouts cannot
 * end drawn).
 */
function simulateTournamentBout(
  updatedState: GameState,
  resolvedTournament: TournamentEntry,
  wA: Warrior,
  wD: Warrior,
  rng: SeededRNG,
  headless: boolean | undefined
): { outcome: FightOutcome; arenaId: string } {
  const planA = wA.plan || getAIPlan(updatedState, wA, wD.style, wD.stableId);
  const planD = wD.plan || getAIPlan(updatedState, wD, wA.style, wA.stableId);

  // The Grand Championship is always fought at Bloodsands — the realm's
  // neutral championship ground; seasonals keep the weighted venue draw.
  const arenaId =
    resolvedTournament.tierId === CHAMPIONS_TOURNEY.TIER_ID
      ? 'bloodsands_arena'
      : selectArenaForTournamentBout(() => rng.next());
  const outcome = simulateFight(
    planA,
    planD,
    wA,
    wD,
    rng.roll(0, 1000000),
    updatedState.trainers,
    updatedState.weather ?? 'Clear',
    arenaId,
    updatedState.crowdMood,
    headless,
    updatedState.houseRules?.deathRateMult
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

/**
 * Resolve one bracket bout: bye/forfeit short-circuits, live simulate with
 * sudden-death overtime for draws, then apply results into state.
 */
function resolveBout(
  bout: TournamentBout,
  updatedState: GameState,
  resolvedTournament: TournamentEntry,
  rng: SeededRNG,
  headless: boolean | undefined,
  winners: BracketWarrior[],
  losers: BracketWarrior[]
): GameState {
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

  if (!wA || !wD) {
    bout.winner = wA ? 'A' : 'D';
    const winnerObj = wA
      ? { id: wA.id, name: wA.name, stableId: wA.stableId }
      : wD
        ? { id: wD.id, name: wD.name, stableId: wD.stableId }
        : undefined;
    if (winnerObj && advancesWinner) winners.push(winnerObj);
    return updatedState;
  }

  const { outcome, arenaId } = simulateTournamentBout(
    updatedState,
    resolvedTournament,
    wA,
    wD,
    rng,
    headless
  );

  bout.winner = outcome.winner;
  bout.by = outcome.by;
  bout.fightId = rng.uuid('bout') as FightId;

  if (advancesWinner) {
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
  }
  return applyBoutResults(
    updatedState,
    wA,
    wD,
    outcome,
    resolvedTournament.id,
    resolvedTournament.name,
    rng,
    undefined,
    arenaId
  );
}

/**
 * Resolves every bout in the current round: byes advance, missing warriors
 * forfeit, live bouts simulate (with sudden-death overtime for draws —
 * tournament bouts cannot end drawn), and results apply into state.
 * Bronze-match winners medal but do not advance.
 */
function resolveRoundBouts(
  updatedState: GameState,
  resolvedTournament: TournamentEntry,
  roundBouts: TournamentBout[],
  rng: SeededRNG,
  headless: boolean | undefined,
  winners: BracketWarrior[],
  losers: BracketWarrior[]
): GameState {
  for (const bout of roundBouts) {
    updatedState = resolveBout(
      bout,
      updatedState,
      resolvedTournament,
      rng,
      headless,
      winners,
      losers
    );
  }
  return updatedState;
}

/**
 * Seeds the next bracket round from this round's winners (bye on odd count)
 * and injects the bronze playoff when the semi-finals just resolved.
 */
function seedNextRound(
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
        isBronzeMatch: true,
      };
      bracket.push(bronzeBout);
    }
  }
}

/**
 * Resolve round.
 */
export function resolveRound(
  state: GameState,
  tournamentId: string,
  seed: number,
  headless?: boolean,
  tournament?: TournamentEntry
): {
  updatedState: GameState;
  roundResults: string[];
  isComplete: boolean;
  updatedTournament?: TournamentEntry;
} {
  const rng = new SeededRNG(seed);
  let updatedState = { ...state };
  const resolvedTournament =
    tournament ?? (updatedState.tournaments || []).find((t) => t.id === tournamentId);
  if (!resolvedTournament || resolvedTournament.completed)
    return { updatedState, roundResults: [], isComplete: false };

  const bracket = [...resolvedTournament.bracket];
  const { currentRound, roundBouts } = findCurrentRoundBouts(bracket);
  if (currentRound === null) return { updatedState, roundResults: [], isComplete: false };
  const winners: BracketWarrior[] = [];
  const losers: BracketWarrior[] = [];

  updatedState = resolveRoundBouts(
    updatedState,
    resolvedTournament,
    roundBouts,
    rng,
    headless,
    winners,
    losers
  );

  seedNextRound(bracket, currentRound, winners, losers);

  // 🏆 6-round tournament: R1(32) → R2(16) → R3(8) → QF(4) → SF(2) → Finals+3rd(2).
  // Six rounds map onto the six playable days of a tournament week — the
  // week rolls over on day 7, so a seventh bracket round could never resolve
  // before the season (and with it the tournament's UI window) advanced.
  const isComplete = bracket.every((b) => b.winner !== undefined);
  const championWarrior = resolveChampion(
    bracket,
    isComplete,
    winners,
    updatedState,
    resolvedTournament
  );
  const champion = championWarrior?.name;

  let updatedTournament: TournamentEntry | undefined;
  updatedState.tournaments = updateEntityInList(
    updatedState.tournaments || [],
    tournamentId,
    (t) => {
      updatedTournament = { ...t, bracket, completed: isComplete, champion };
      return updatedTournament;
    }
  );

  // The 'Champions' tier's purse/fame/accolade is awarded by
  // ArenaChampionshipPass.recordGrandChampions — the single award home —
  // so the generic placement machinery skips it here.
  if (isComplete && champion && resolvedTournament.tierId !== CHAMPIONS_TOURNEY.TIER_ID) {
    updatedState = awardTournamentPrizes(updatedTournament ?? resolvedTournament, updatedState);
  }

  return {
    updatedState,
    roundResults:
      isComplete && championWarrior
        ? [`🏆 CHAMPION: ${warriorDisplayName(championWarrior)} has won the ${resolvedTournament.name}!`]
        : [],
    isComplete,
    updatedTournament,
  };
}

/**
 * Champion = winner of the championship bout (latest non-bronze bout).
 * Resolved only when the bracket is complete. Returns the warrior (or
 * bracket stub) so the canonical `name` stays a snapshot field while
 * news strings can decorate with the earned epithet.
 */
function resolveChampion(
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
    ? (findWarriorById(state, championId, tournament) ??
        winners.find((w) => w.id === championId))
    : undefined;
}

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
  let tour = (current.tournaments || []).find((t) => t.id === tournamentId);
  while (safety < 10) {
    if (!tour || tour.completed) break;
    const result = resolveRound(current, tournamentId, seed + safety, headless, tour);
    current = result.updatedState;
    tour = result.updatedTournament;
    if (result.isComplete) break;
    safety++;
  }
  return current;
}

/**
 * Apply bout results.
 * @param state -
 * @param wA -
 * @param wD -
 * @param outcome -
 * @param tId -
 * @param tName -
 * @param rng -
 * @param skipFatigue - If true, skip fatigue accrual (tournament bouts during tournament week)
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
  skipFatigue?: boolean,
  /** The venue the bout was simulated in — recorded on the summary. */
  arenaId?: string
): GameState {
  const isKill = outcome.by === 'Kill';
  const winnerSide = outcome.winner;
  const updatedState = { ...state };

  const summary: FightSummary = createFightSummary({
    warriorA: wA,
    warriorD: wD,
    outcome,
    week: state.week,
    absoluteWeek: state.absoluteWeek,
    tournamentId: tId,
    tournamentName: tName,
    arenaId,
    rng,
  });

  updatedState.arenaHistory = [...(updatedState.arenaHistory || []), summary].slice(-500);

  // 🔒 Tournament fatigue exemption: No fatigue accrual for tournament participants during tournament week
  const shouldSkipFatigue = skipFatigue ?? state.isTournamentWeek;

  updatedState.roster = updateEntityInList(updatedState.roster, wA.id, (w) =>
    updateWarriorFromBoutOutcome(w, true, winnerSide, isKill, shouldSkipFatigue, arenaId)
  );
  updatedState.roster = updateEntityInList(updatedState.roster, wD.id, (w) =>
    updateWarriorFromBoutOutcome(w, false, winnerSide, isKill, shouldSkipFatigue, arenaId)
  );

  if (wA.stableId || wD.stableId) {
    updatedState.rivals = updatedState.rivals.map((r) => {
      let rRoster = r.roster;
      if (r.id === wA.stableId)
        rRoster = updateEntityInList(rRoster, wA.id, (w) =>
          updateWarriorFromBoutOutcome(w, true, winnerSide, isKill, shouldSkipFatigue, arenaId)
        );
      if (r.id === wD.stableId)
        rRoster = updateEntityInList(rRoster, wD.id, (w) =>
          updateWarriorFromBoutOutcome(w, false, winnerSide, isKill, shouldSkipFatigue, arenaId)
        );
      return rRoster !== r.roster ? { ...r, roster: rRoster } : r;
    });
  }

  if (isKill) {
    const victim = winnerSide === 'D' ? wA : wD;
    updatedState.graveyard = [
      ...(updatedState.graveyard || []),
      { ...victim, status: 'Dead', deathWeek: state.absoluteWeek ?? state.week },
    ];
    updatedState.roster = updatedState.roster.filter((w) => w.id !== victim.id);
    updatedState.rivals = updatedState.rivals.map((r) => ({
      ...r,
      roster: r.roster.filter((w) => w.id !== victim.id),
    }));
  }

  return updatedState;
}
