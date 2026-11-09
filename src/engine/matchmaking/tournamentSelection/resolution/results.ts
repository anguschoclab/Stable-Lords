import type { GameState, Warrior, FightSummary } from '@/types/state.types';
import { hashStr, SeededRNG } from '@/utils/random';
import type { FightOutcome, FightPlan } from '@/types/combat.types';
import { createFightSummary } from '@/engine/core/fightSummaryFactory';
import { resolveImpacts, type StateImpact } from '@/engine/impacts';
import { applyRecords } from '@/engine/bout/recordHandler';
import { handleDeath } from '@/engine/bout/mortalityHandler';
import { handleInjuries } from '@/engine/bout/injuryHandler';
import { handleProgressions } from '@/engine/bout/progressionHandler';
import { getMoodModifiers } from '@/engine/bout/crowdMood';
import { calculateBoutFame } from '@/engine/bout/core/resolveHelpers';
import { isPlayerOwned } from '@/engine/bout/warriorRouting';

/**
 *
 */
interface ApplyBoutResultsArgs {
  state: GameState;
  wA: Warrior;
  wD: Warrior;
  outcome: FightOutcome;
  tId: string;
  tName: string;
  rng: SeededRNG;
  headless?: boolean;
  arenaId?: string;
  /** V27: bracket round this bout fought in — drives odd-round FE accrual. */
  round?: number;
  /** V27: plans the bout actually simulated — graded by handleProgressions. */
  planA?: FightPlan;
  planD?: FightPlan;
}

/**
 * lastBoutWeek stamps for both combatants — mirrors the pipeline path's
 * `rosterUpdateImpacts`: rival-owned combatants get a per-warrior patch so a
 * merged roster write can't clobber the bout's other consequences.
 */
function lastBoutWeekImpact(
  state: GameState,
  wA: Warrior,
  wD: Warrior,
  week: number
): StateImpact {
  const rosterUpdates = new Map([
    [wA.id, { lastBoutWeek: week }],
    [wD.id, { lastBoutWeek: week }],
  ]);
  const rivalWarriorPatches = new Map<Warrior['id'], Partial<Warrior>>();
  for (const w of [wA, wD]) {
    if (!isPlayerOwned(state, w)) rivalWarriorPatches.set(w.id, { lastBoutWeek: week });
  }
  return { rosterUpdates, rivalWarriorPatches };
}

/**
 * Apply bout results.
 *
 * Canonical consequence parity (V27): the day-tick tournament path runs the
 * SAME post-bout stack as the `tour_*` pipeline path — records + computed
 * fame/popularity, mortality (obituary, unacknowledgedDeaths, +5 fame,
 * house rules, diedPostBout), injuries, progressions (XP/learns/favorites),
 * and lastBoutWeek stamps. Consequence draws come from a per-bout seeded rng
 * in the pipeline's draw order (death → injuries → progressions), keeping
 * interactive and batched resolution bit-identical.
 *
 * @param args.state -
 * @param args.wA -
 * @param args.wD -
 * @param args.outcome -
 * @param args.tId -
 * @param args.tName -
 * @param args.rng - shared round rng (fight-summary id only — consequences draw per-bout)
 * @param args.round -
 */
/**
 * The canonical post-bout consequence stack, as StateImpact[] — records +
 * computed fame/popularity, mortality, injuries, progressions, and
 * lastBoutWeek stamps. Draw order is load-bearing (death → injuries →
 * progressions on the per-bout seeded stream), matching the pipeline's
 * `postResolutionImpacts` so interactive and sweep resolution stay
 * bit-identical.
 */
function boutConsequenceImpacts(
  args: ApplyBoutResultsArgs & { s: GameState; week: number }
): StateImpact[] {
  const { s, wA, wD, outcome, tId, week } = args;
  const { headless, arenaId, round, planA, planD } = args;

  const boutSeed = hashStr(`${week}|${wA.id}|${wD.id}`);
  const boutRng = new SeededRNG(boutSeed);
  const tags = outcome.post?.tags ?? [];
  const { fameA, popA, fameD, popD } = calculateBoutFame(
    outcome,
    tags,
    getMoodModifiers(s.crowdMood),
    true // tournaments are always high-stakes
  );

  // Duel2 canon: a tournament bout fought on an odd round accrues 1 FE;
  // even rounds, byes, and forfeits accrue nothing. An unlabeled bout
  // (legacy caller) still fought — default to accrual.
  const feDelta = round === undefined || round % 2 === 1 ? 1 : 0;

  return [
    applyRecords({
      s,
      wA,
      wD,
      outcome,
      tags,
      fameA,
      popA,
      fameD,
      popD,
      arenaId,
      feDelta,
      // This function only resolves bracket bouts — both combatants are
      // tournament participants by construction, so fatigue never accrues.
      extraParticipantIds: [wA.id, wD.id],
    }),
    handleDeath({ s, wA, wD, outcome, week, tags, rng: boutRng, tournamentId: tId }).impact,
    handleInjuries({ s, wA, wD, outcome, week, seed: boutSeed }).impact,
    handleProgressions({
      s,
      wA,
      wD,
      outcome,
      tags,
      week,
      rng: boutRng,
      headless,
      planA: planA!,
      planD: planD!,
    }),
    lastBoutWeekImpact(s, wA, wD, week),
  ];
}

export function applyBoutResults(args: ApplyBoutResultsArgs): GameState {
  const { state, wA, wD, outcome, tId, tName, arenaId, rng } = args;

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
  const next: GameState = {
    ...state,
    arenaHistory: [...(state.arenaHistory || []), summary],
  };

  return resolveImpacts(
    next,
    boutConsequenceImpacts({ ...args, s: next, week: state.absoluteWeek })
  );
}
