import type { GameState, TournamentBout, TournamentEntry } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import { updateEntityInList } from '@/utils/stateUtils';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { findCurrentRoundBouts } from '../../tournament/bracketUtils';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import { awardTournamentPrizes } from '../awards';
import { resolveRoundBouts, type BracketWarrior } from './bouts';
import { resolveChampion, seedNextRound } from './seeding';

export { applyBoutResults } from './results';

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

  // Clone the bout objects: resolution writes `winner`/`by`/`fightId` in
  // place, and a shared shallow copy would leak those writes back into the
  // caller's state (manufacturing torn all-resolved-but-unflagged brackets).
  const bracket = resolvedTournament.bracket.map((b) => ({ ...b }));
  const { currentRound, roundBouts } = findCurrentRoundBouts(bracket);
  const winners: BracketWarrior[] = [];
  const losers: BracketWarrior[] = [];

  // A null currentRound means no unresolved bouts remain — an emitted-empty
  // or fully-resolved-but-unflagged bracket. Seal it below instead of
  // returning isComplete:false, which left such entries unfinished and
  // re-scanned at every week boundary forever.
  if (currentRound !== null) {
    updatedState = resolveRoundBouts(
      { updatedState: updatedState, resolvedTournament: resolvedTournament, roundBouts: roundBouts, rng: rng, headless: headless, winners: winners, losers: losers }
    );

    seedNextRound(bracket, currentRound, winners, losers);
  }

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

  return finalizeRound(
    { updatedState: updatedState, resolvedTournament: resolvedTournament, tournamentId: tournamentId, bracket: bracket, isComplete: isComplete, championWarrior: championWarrior }
  );
}

interface FinalizeRoundArgs {
  updatedState: GameState;
  resolvedTournament: TournamentEntry;
  tournamentId: string;
  bracket: TournamentBout[];
  isComplete: boolean;
  championWarrior: { name: string; epithet?: string } | undefined;
}

/**
 * Seal a resolved round: stamp the bracket/champion onto the tournament
 * entry, award placement prizes (except the 'Champions' tier, whose
 * purse/fame/accolade is awarded by ArenaChampionshipPass.recordGrandChampions
 * — the single award home), and emit the champion banner.
 */
function finalizeRound(args: FinalizeRoundArgs): {
  updatedState: GameState;
  roundResults: string[];
  isComplete: boolean;
  updatedTournament?: TournamentEntry;
} {
  const { resolvedTournament, tournamentId, bracket, isComplete } = args;
  let { updatedState } = args;
  const { championWarrior } = args;
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

  if (isComplete && champion && resolvedTournament.tierId !== CHAMPIONS_TOURNEY.TIER_ID) {
    updatedState = awardTournamentPrizes(updatedTournament ?? resolvedTournament, updatedState);
  }

  return {
    updatedState,
    roundResults:
      isComplete && championWarrior
        ? [
            `🏆 CHAMPION: ${warriorDisplayName(championWarrior)} has won the ${resolvedTournament.name}!`,
          ]
        : [],
    isComplete,
    updatedTournament,
  };
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
 * Resolve every unfinished tournament in state — the shared "emitted ⇒
 * resolved" guarantee. Runs at each week boundary (advanceWeek) and inside
 * terminal batch results (autosim, quarter/year advance) where no following
 * week boundary is guaranteed to run.
 *
 * The index stride exceeds the round counter inside resolveCompleteTournament
 * (safety < 10): a `+ i` stride would make tournament i's round s+1 share a
 * seed with tournament i+1's round s — identical RNG streams, identical bout
 * ids and correlated fight draws.
 */
export function sweepUnfinishedTournaments(
  state: GameState,
  headless?: boolean
): GameState {
  const list = state.tournaments ?? [];
  let current = state;

  // Corrupted/legacy saves can carry two entries sharing one id — resolution
  // and write-back both target the FIRST id match, which would strand every
  // later duplicate unfinished forever. Rename later occurrences so each
  // becomes individually resolvable. The first occurrence keeps the canonical
  // id (and any activeTournamentId reference).
  const seenIds = new Set<string>();
  let hasDuplicateId = false;
  for (const t of list) {
    if (seenIds.has(t.id)) {
      hasDuplicateId = true;
      break;
    }
    seenIds.add(t.id);
  }
  if (hasDuplicateId) {
    const taken = new Set<string>();
    current = {
      ...current,
      tournaments: list.map((t, i) => {
        if (taken.has(t.id)) return { ...t, id: `${t.id}-dup${i}` as TournamentId };
        taken.add(t.id);
        return t;
      }),
    };
  }

  const unfinished = (current.tournaments ?? []).filter((t) => !t.completed);
  for (let i = 0; i < unfinished.length; i++) {
    const tour = unfinished[i];
    if (!tour) continue;
    current = resolveCompleteTournament(
      current,
      tour.id,
      current.year * 10000 + current.week * 100 + 7 + i * 16,
      headless
    );
  }
  return current;
}
