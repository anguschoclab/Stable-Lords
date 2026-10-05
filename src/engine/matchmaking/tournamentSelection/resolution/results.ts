import type { GameState, Warrior, FightSummary } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import type { FightOutcome } from '@/types/combat.types';
import { createFightSummary } from '@/engine/core/fightSummaryFactory';
import { updateWarriorFromBoutOutcome } from '@/engine/warrior/careerUpdate';
import { updateEntityInList } from '@/utils/stateUtils';

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
