import type { GameState } from '@/types/state.types';
import { resolveImpacts, StateImpact } from '@/engine/impacts';
import type { WeekPassSpec } from '@/engine/pipeline/pipelineStages';
import { computeMetaDrift } from '@/engine/analytics/metaDrift';
import { loadCombatNarrative } from '@/data/narrative';
import { runBoutSimulationPass } from '../../passes/BoutSimulationPass';
import { WEEK_PIPELINE_PASSES } from './passes';
import { isPipelineProfiling, recordPassTiming } from './profiling';
import { buildWeekCaches, impactsAffectWeekCaches } from './caches';
import type { WeekContext } from './context';
import type { WeekAdvanceOptions } from '../weekPipelineService';
/**
 * Loads combat narrative data, resolves the week's scheduled bouts, applies
 * the bout impact, and resyncs week caches (impact handlers replace warrior
 * objects, so maps must point at post-impact identities).
 */
export async function runBoutPhase(state: GameState, ctx: WeekContext): Promise<GameState> {
  // Safety net: ensure combat narrative data is loaded before bout resolution
  // (memoized promise — a resolved-promise no-op after first load).
  await loadCombatNarrative();
  const metaDrift = computeMetaDrift(state.arenaHistory || []);
  const {
    impact: boutImpact,
    results,
    summary,
  } = await runBoutSimulationPass(state, ctx.rootRng, ctx.headless, ctx.pool);
  const settledState = resolveImpacts(state, [boutImpact]);
  settledState.cachedMetaDrift = metaDrift;

  // Stash bout display data for the main thread to build pendingResolutionData
  settledState.lastWeekBoutDisplay = {
    results,
    deathNames: summary.deathNames,
    injuryNames: summary.injuryNames,
  };

  // Resync all week caches only when the bout impact could have replaced
  // warrior/rival identities — a quiet week (no pairings) leaves every map
  // still accurate. (Supersedes the old invalidateDeadWarriors + manual
  // rivalMap rebuild — NF2 fix.)
  if (impactsAffectWeekCaches([boutImpact])) buildWeekCaches(settledState);

  return settledState;
}

/**
 * Runs every pass in a resolution stage against the same snapshot, then
 * applies the merged impacts and resyncs the week caches. Passes run in
 * declaration order and are awaited individually — intra-pass sharding may
 * parallelize work inside a pass, but stage semantics stay sequential.
 */
export async function runStage(
  stage: WeekPassSpec['stage'],
  state: GameState,
  ctx: WeekContext,
  opts?: WeekAdvanceOptions
): Promise<GameState> {
  const profiling = isPipelineProfiling();
  const impacts: StateImpact[] = [];
  for (const spec of WEEK_PIPELINE_PASSES) {
    if (spec.stage !== stage) continue;
    if (spec.playerFacing && (opts?.headless || opts?.playerStopped)) continue;
    const started = profiling ? performance.now() : 0;
    impacts.push(await spec.run(state, ctx));
    if (profiling) recordPassTiming(spec.id, stage, performance.now() - started);
  }
  const resolved = resolveImpacts(state, impacts);
  if (impactsAffectWeekCaches(impacts)) buildWeekCaches(resolved);
  return resolved;
}
/**
 * Preview the core-stage impacts without applying them. The bankruptcy gate
 * needs the projected treasury delta before commit.
 */
export async function collectCoreImpacts(
  state: GameState,
  ctx: WeekContext
): Promise<StateImpact[]> {
  const impacts: StateImpact[] = [];
  const profiling = isPipelineProfiling();
  for (const spec of WEEK_PIPELINE_PASSES) {
    if (spec.stage !== 'core') continue;
    const started = profiling ? performance.now() : 0;
    impacts.push(await spec.run(state, ctx));
    if (profiling) recordPassTiming(spec.id, 'core', performance.now() - started);
  }
  return impacts;
}
