/**
 * Bout processor service — week bout orchestration.
 * Types extracted to boutProcessorTypes.ts, resolution logic to boutResolution.ts.
 * Re-exports for backward compatibility.
 */
import { GameState } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import { getMoodModifiers } from '@/engine/crowdMood';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { generatePairings } from '../core/pairings';
import { finalizeWeekSideEffectsToImpact } from './WeekFinalizationService';
import { accumulateWeekStats, createWeekBoutSummary } from './WeekStatsService';
import { buildActiveWarriorMap } from '@/utils/roster';
import { isFightReady } from '@/engine/warriorStatus';
import { resolveBout } from './boutResolution';
import { addMatchRecord } from '@/engine/matchmaking/historyLogic';
import { engineEventBus } from '@/engine/core/EventBus';
import type { BoutResult, WeekBoutSummary } from './boutProcessorTypes';
import type { EnginePool } from '@/engine/pool/enginePool';

// Re-export types and resolveBout for backward compatibility
export type { BoutResult, BoutImpact, WeekBoutSummary, BoutContext } from './boutProcessorTypes';
export { resolveBout } from './boutResolution';

interface WeekBoutsOutput {
  impact: StateImpact;
  results: BoutResult[];
  summary: WeekBoutSummary;
}

/**
 * Stitch post-bout combatant mutations into the merged rival-roster updates.
 *
 * `resolveBout` performs a small amount of in-place post-bout writing on the
 * validated combatants (favorites discovery in `handleProgressions` mutates
 * `w.favorites.discovered`). In sequential execution those combatants ARE the
 * state.rivals roster objects, so the writes are visible to every later
 * roster rebuild — including a *later* bout's `lastBoutWeek` roster, which
 * wholesale-replaces a rival's `roster` partial (last-writer-wins) and would
 * otherwise drop an earlier bout's mutations. Shard workers hold separate
 * clones, so the coordinator replays the accumulated combatant state here:
 * for every rival containing a combatant, the winning roster partial is
 * patched with each combatant's post-bout object (lastBoutWeek stamps set by
 * impact partials are preserved). In sequential execution this is a
 * content-identical rewrite.
 */
function stitchCombatantMutations(
  state: GameState,
  results: BoutResult[],
  merged: StateImpact
): void {
  if (results.length === 0) return;
  const overlay = new Map<string, BoutResult['a']>();
  for (const res of results) {
    overlay.set(res.a.id, res.a);
    overlay.set(res.d.id, res.d);
  }
  const rivalsUpdates =
    merged.rivalsUpdates ??
    (merged.rivalsUpdates = new Map<
      import('@/types/shared.types').StableId,
      Partial<import('@/types/state.types').RivalStableData>
    >());
  for (const rival of state.rivals || []) {
    if (!rival.roster.some((w) => overlay.has(w.id))) continue;
    const existing = rivalsUpdates.get(rival.id);
    const base = (existing?.roster as BoutResult['a'][] | undefined) ?? rival.roster;
    rivalsUpdates.set(rival.id, {
      ...existing,
      roster: base.map((w) => {
        const m = overlay.get(w.id);
        if (!m) return w;
        return w.lastBoutWeek !== undefined ? { ...m, lastBoutWeek: w.lastBoutWeek } : m;
      }),
    });
  }
}

/**
 * Shared post-resolution tail: side-effect impact + player match-history
 * records, applied in pairing order. Identical for sequential and sharded
 * execution.
 */
function finalizeBoutResults(
  state: GameState,
  results: BoutResult[],
  impacts: StateImpact[]
): void {
  impacts.push(finalizeWeekSideEffectsToImpact(state, results));

  // Build match records for player warriors for repeat-opponent avoidance
  const playerWarriorIds = new Set((state.roster || []).map((w) => w.id));
  let updatedMatchHistory = state.matchHistory || [];
  for (const res of results) {
    const aIsPlayer = playerWarriorIds.has(res.a.id);
    const dIsPlayer = playerWarriorIds.has(res.d.id);
    if (aIsPlayer && !dIsPlayer) {
      const stableInfo = state.warriorToStableMap?.get(res.d.id);
      updatedMatchHistory = addMatchRecord(
        updatedMatchHistory,
        res.a.id,
        res.d.id,
        stableInfo?.stableId || '',
        state.absoluteWeek
      );
    } else if (dIsPlayer && !aIsPlayer) {
      const stableInfo = state.warriorToStableMap?.get(res.a.id);
      updatedMatchHistory = addMatchRecord(
        updatedMatchHistory,
        res.d.id,
        res.a.id,
        stableInfo?.stableId || '',
        state.absoluteWeek
      );
    }
  }
  if (results.length > 0) {
    impacts.push({ matchHistory: updatedMatchHistory });
  }
}

/**
 * Process week bouts — sequential in-line path.
 */
export function processWeekBouts(state: GameState, headless?: boolean): WeekBoutsOutput {
  const warriorMap = state.warriorMap || buildActiveWarriorMap(state);

  // Minimum Viable Arena: skip combat phase if fewer than 2 eligible warriors
  // exist across all stables. Economy, training, and aging still proceed.
  let eligibleCount = 0;
  for (const w of warriorMap.values()) {
    if (isFightReady(w, state.isTournamentWeek)) eligibleCount++;
  }
  if (eligibleCount < 2) {
    const summary = createWeekBoutSummary();
    const quietImpact = finalizeWeekSideEffectsToImpact(state, []);
    return { impact: quietImpact, results: [], summary };
  }

  const moodMods = getMoodModifiers(state.crowdMood);
  const impacts: StateImpact[] = [];
  const results: BoutResult[] = [];
  const summary = createWeekBoutSummary();

  const pairings = generatePairings(state);

  pairings.forEach((p) => {
    const contract = p.contractId ? state.boutOffers[p.contractId as BoutOfferId] : undefined;
    // Tournament bouts have synthetic contractIds starting with 'tour_'
    const isTournamentBout = p.contractId?.startsWith('tour_') ?? false;
    const res = resolveBout(state, {
      warrior: p.a,
      opponent: p.d,
      isRivalry: p.isRivalry,
      rivalStable: p.rivalStable,
      rivalStableId: p.rivalStableId,
      moodMods,
      week: state.absoluteWeek,
      displayWeek: state.week,
      playerId: state.player.id,
      warriorMap,
      contract,
      headless,
      isTournamentBout,
    });
    impacts.push(res.impact);
    results.push(res.result);
    accumulateWeekStats(summary, res);
  });

  finalizeBoutResults(state, results, impacts);
  const merged = mergeImpacts(impacts);
  stitchCombatantMutations(state, results, merged);
  return { impact: merged, results, summary };
}

/**
 * Process week bouts — distributed across the engine pool's shard workers.
 * Pairings are computed centrally; `resolveBout` is position-seeded
 * (hashStr(week|aId|dId)) and read-only w.r.t. state, so shards are
 * independent. Impacts and engine events merge in pairing order, making the
 * result identical to the sequential path.
 */
export async function processWeekBoutsSharded(
  state: GameState,
  headless: boolean | undefined,
  pool: EnginePool
): Promise<WeekBoutsOutput> {
  const warriorMap = state.warriorMap || buildActiveWarriorMap(state);

  let eligibleCount = 0;
  for (const w of warriorMap.values()) {
    if (isFightReady(w, state.isTournamentWeek)) eligibleCount++;
  }
  if (eligibleCount < 2) {
    const summary = createWeekBoutSummary();
    const quietImpact = finalizeWeekSideEffectsToImpact(state, []);
    return { impact: quietImpact, results: [], summary };
  }

  const moodMods = getMoodModifiers(state.crowdMood);
  const pairings = generatePairings(state);

  const outputs = await pool.mapBoutShards(
    pairings.map((pairing) => ({ pairing })),
    { state, warriorMap, moodMods, headless }
  );

  const impacts: StateImpact[] = [];
  const results: BoutResult[] = [];
  const summary = createWeekBoutSummary();
  for (const { bout, events } of outputs) {
    impacts.push(bout.impact);
    results.push(bout.result);
    accumulateWeekStats(summary, bout);
    // Shard workers can't reach this bus — re-emit captured events here,
    // preserving pairing order.
    for (const e of events) engineEventBus.emit(e);
  }

  finalizeBoutResults(state, results, impacts);
  const merged = mergeImpacts(impacts);
  stitchCombatantMutations(state, results, merged);
  return { impact: merged, results, summary };
}
