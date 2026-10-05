/**
 * Season plan-of-record (Stage C): one strategic objective per ~quarter
 * that sits ABOVE the weekly intent cascade. `pickSeasonObjective` reads
 * the stable's position and commits to CROWN / TOURNAMENT / TREASURY /
 * REBUILD; `applySeasonPlan` ticks the runway weekly and re-picks on
 * expiry; `objectiveStillViable` feeds the skepticism tier so a disproved
 * objective forces a re-plan rather than limping on.
 *
 * Pure + deterministic — a season objective is a function of world state,
 * never a dice roll, so two shards computing the same stable agree.
 */
import type { GameState, RivalStableData, SeasonObjective } from '@/types/state.types';
import { isActive } from '@/engine/warrior/warriorStatus';
import { projectedWeeklyUpkeep } from '../workers/budgetWorker';
import { deriveAmbitionArc } from '../ambition';

/** A season objective gets ~a quarter of runway before re-evaluation. */
export const SEASON_OBJECTIVE_WEEKS = 13;

/** Below this treasury a stable cannot sustain a campaign — it rebuilds. */
const REBUILD_TREASURY_FLOOR = 400;

const objective = (
  kind: SeasonObjective['kind'],
  reason: string,
  over: Partial<SeasonObjective> = {}
): SeasonObjective => ({
  kind,
  weeksRemaining: SEASON_OBJECTIVE_WEEKS,
  reason,
  ...over,
});

/**
 * Pick the stable's objective for the coming season. REBUILD outranks
 * ambition (a broke stable cannot campaign); CROWN requires the crown
 * worker's live assessment plus the cash to chase it; TREASURY is the
 * default wealth program with a target scaled to the stable's burn.
 */
export function pickSeasonObjective(
  rival: RivalStableData,
  _state: GameState
): SeasonObjective | undefined {
  const arc = deriveAmbitionArc(rival);

  if (rival.treasury < REBUILD_TREASURY_FLOOR || rival.roster.filter(isActive).length === 0) {
    return objective('REBUILD', 'The stable cannot sustain a campaign — rebuild first');
  }

  const crown = rival.agentMemory?.crownAssessment;
  const crownWarrior = crown ? rival.roster.find((w) => w.id === crown.warriorId) : undefined;
  if (crown && crownWarrior && isActive(crownWarrior)) {
    if (arc !== 'DECLINING') {
      return objective(
        'CROWN',
        `Season campaign: ${crown.reason}`,
        { targetArenaId: crown.arenaId }
      );
    }
  }

  // A declining stable banks what it can; an ascendant one still banks when
  // no throne is in reach — TREASURY is the honest default program.
  const runway = Math.max(500, projectedWeeklyUpkeep(rival) * 8);
  const treasuryTarget = rival.treasury + runway;
  return objective(
    'TREASURY',
    `Bank ${runway}g of runway — target ${treasuryTarget}g`,
    { treasuryTarget }
  );
}

/**
 * Is the stable's plan-of-record still feasible? Consumed by the intent
 * engine's skepticism tier — a disproved objective forces a re-pick.
 * Absent an objective, the weekly cascade owns the week (viable).
 */
export function objectiveStillViable(rival: RivalStableData, _state: GameState): boolean {
  const obj = rival.agentMemory?.seasonObjective;
  if (!obj) return true;

  switch (obj.kind) {
    case 'CROWN': {
      const assessment = rival.agentMemory?.crownAssessment;
      if (!assessment || assessment.arenaId !== obj.targetArenaId) return false;
      const w = rival.roster.find((x) => x.id === assessment.warriorId);
      return !!w && isActive(w);
    }
    case 'TREASURY':
      // Complete when the goal is banked — re-pick rather than idle.
      return obj.treasuryTarget === undefined || rival.treasury < obj.treasuryTarget;
    case 'REBUILD': {
      // Viable while either rebuild trigger still holds — a thin roster
      // rebuilds even on a healthy treasury.
      const active = rival.roster.filter(isActive).length;
      return rival.treasury < REBUILD_TREASURY_FLOOR * 2 || active < 3;
    }
    case 'TOURNAMENT':
      return obj.weeksRemaining > 0;
  }
}

/**
 * Weekly tick: decrement the runway on a viable objective; re-pick when it
 * expired or was disproved. Runs once per rival inside the shard.
 */
export function applySeasonPlan(rival: RivalStableData, state: GameState): RivalStableData {
  const memory = rival.agentMemory;
  if (!memory) return rival;
  const obj = memory.seasonObjective;

  if (obj && obj.weeksRemaining > 1 && objectiveStillViable(rival, state)) {
    return {
      ...rival,
      agentMemory: {
        ...memory,
        seasonObjective: { ...obj, weeksRemaining: obj.weeksRemaining - 1 },
      },
    };
  }

  const next = pickSeasonObjective(rival, state);
  return {
    ...rival,
    agentMemory: { ...memory, seasonObjective: next },
  };
}
