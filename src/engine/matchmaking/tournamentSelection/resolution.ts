import type {
  GameState,
  Warrior,
  TournamentBout,
  TournamentEntry,
  FightSummary,
} from '@/types/state.types';
import type { FightId, WarriorId, StableId, TournamentId } from '@/types/shared.types';
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
import { isActive, deadIdSet } from '@/engine/warrior/warriorStatus';

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
interface BracketWarrior {
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
function resolveRoundBouts(args: ResolveRoundBoutsArgs): GameState {
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
    ? (findWarriorById(state, championId, tournament) ?? winners.find((w) => w.id === championId))
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

/**
 *
 */
export interface ApplyBoutResultsArgs {
  state: GameState;
  wA: Warrior;
  wD: Warrior;
  outcome: FightOutcome;
  tId: string;
  tName: string;
  rng: SeededRNG;
  skipFatigue?: boolean;
  arenaId?: string;
}

/**
 * Apply bout results.
 * @param args.state -
 * @param args.wA -
 * @param args.wD -
 * @param args.outcome -
 * @param args.tId -
 * @param args.tName -
 * @param args.rng -
 * @param args.skipFatigue - If true, skip fatigue accrual (tournament bouts during tournament week)
 */
export function applyBoutResults(args: ApplyBoutResultsArgs): GameState {
  const { state, wA, wD, outcome, tId } = args;
  const { tName, rng, skipFatigue, arenaId } = args;
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

  // Mid-tick appends never truncate — truncateState owns arenaHistory
  // retention. The old inline .slice(-500) dropped bout summaries before the
  // cumulative tracker could see them.
  updatedState.arenaHistory = [...(updatedState.arenaHistory || []), summary];

  // 🔒 Tournament fatigue exemption: No fatigue accrual for tournament participants during tournament week
  const shouldSkipFatigue = skipFatigue ?? state.isTournamentWeek;

  updatedState.roster = updateEntityInList(updatedState.roster, wA.id, (w) =>
    updateWarriorFromBoutOutcome({ warrior: w, isAttacker: true, winnerSide: winnerSide, isKill: isKill, skipFatigue: shouldSkipFatigue, arenaId: arenaId })
  );
  updatedState.roster = updateEntityInList(updatedState.roster, wD.id, (w) =>
    updateWarriorFromBoutOutcome({ warrior: w, isAttacker: false, winnerSide: winnerSide, isKill: isKill, skipFatigue: shouldSkipFatigue, arenaId: arenaId })
  );

  if (wA.stableId || wD.stableId) {
    updatedState.rivals = updatedState.rivals.map((r) => {
      let rRoster = r.roster;
      if (r.id === wA.stableId)
        rRoster = updateEntityInList(rRoster, wA.id, (w) =>
          updateWarriorFromBoutOutcome({ warrior: w, isAttacker: true, winnerSide: winnerSide, isKill: isKill, skipFatigue: shouldSkipFatigue, arenaId: arenaId })
        );
      if (r.id === wD.stableId)
        rRoster = updateEntityInList(rRoster, wD.id, (w) =>
          updateWarriorFromBoutOutcome({ warrior: w, isAttacker: false, winnerSide: winnerSide, isKill: isKill, skipFatigue: shouldSkipFatigue, arenaId: arenaId })
        );
      return rRoster !== r.roster ? { ...r, roster: rRoster } : r;
    });
  }

  if (isKill) {
    const victim = winnerSide === 'D' ? wA : wD;
    const killer = winnerSide === 'D' ? wD : wA;
    applyTournamentKill(updatedState, victim, killer, tId);
  }

  return updatedState;
}

/**
 * Record a tournament kill: graveyard + persistent registry (each deduped —
 * a repeat outcome against an already-dead id never doubles the entry), one
 * kill event per outcome (the oracle's divergence tripwire sees repeats),
 * roster purge, and a 'Dead' stamp on the victim's participant snapshot so
 * the bracket record stays self-describing after the roster entry is gone.
 */
function applyTournamentKill(
  updatedState: GameState,
  victim: Warrior,
  killer: Warrior,
  tId: string
): void {
  const week = updatedState.absoluteWeek ?? updatedState.week;
  const alreadyDead =
    (updatedState.deadWarriorIds ?? []).includes(victim.id) ||
    (updatedState.graveyard ?? []).some((g) => g.id === victim.id);

  if (!alreadyDead) {
    updatedState.graveyard = [
      ...(updatedState.graveyard || []),
      { ...victim, status: 'Dead', isDead: true, deathWeek: week },
    ];
    updatedState.deadWarriorIds = [...(updatedState.deadWarriorIds ?? []), victim.id];
  }
  const killEventId = `kill_${week}_${victim.id}_${tId}`;
  if (!(updatedState.killEvents ?? []).some((e) => e.id === killEventId)) {
    updatedState.killEvents = [
      ...(updatedState.killEvents ?? []),
      {
        id: killEventId,
        victimId: victim.id,
        killerId: killer.id,
        week,
        tournamentId: tId as TournamentId,
      },
    ];
  }

  updatedState.roster = updatedState.roster.filter((w) => w.id !== victim.id);
  updatedState.rivals = updatedState.rivals.map((r) => ({
    ...r,
    roster: r.roster.filter((w) => w.id !== victim.id),
  }));

  updatedState.tournaments = (updatedState.tournaments || []).map((t) => ({
    ...t,
    participants: (t.participants || []).map((p) =>
      p.id === victim.id && p.status !== 'Dead' ? { ...p, status: 'Dead' as const, isDead: true } : p
    ),
  }));
}
