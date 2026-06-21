import { GameState, Warrior, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, FightingStyle } from '@/types/shared.types';
import { type FightOutcome, type FightPlan } from '@/types/combat.types';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { getMoodModifiers } from '@/engine/crowdMood';
import { engineEventBus } from '@/engine/core/EventBus';
import { SeededRNGService } from '@/utils/random';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { hashStr } from '@/utils/random';
import {
  validateBoutCombatants,
  calculateBoutFame,
  processContractPayouts,
  getWinnerId,
  getDefaultPlan,
} from '../core/resolveHelpers';
import { applyRecords } from '../recordHandler';
import { handleDeath } from '../mortalityHandler';
import { handleInjuries } from '../injuryHandler';
import { handleProgressions } from '../progressionHandler';
import { handleReporting } from '../reportingHandler';
import { generatePairings } from '../core/pairings';
import { finalizeWeekSideEffectsToImpact } from './WeekFinalizationService';
import { accumulateWeekStats, createWeekBoutSummary } from './WeekStatsService';
import { buildWarriorMap } from '@/utils/roster';

import { isFightReady } from '@/engine/warriorStatus';

/**
 * Defines the shape of bout result.
 */
export interface BoutResult {
  a: Warrior;
  d: Warrior;
  outcome: FightOutcome;
  announcement?: string;
  isRivalry: boolean;
  rivalStable?: string;
  contractId?: string;
  arenaId?: string;
  weather?: import('@/types/shared.types').WeatherType;
}

/**
 * Defines the shape of bout impact.
 */
export interface BoutImpact {
  impact: StateImpact;
  result: BoutResult;
  stats: {
    death: boolean;
    playerDeath: boolean;
    injured: boolean;
    deathNames: string[];
    injuredNames: string[];
  };
}

/**
 * Defines the shape of week bout summary.
 */
export interface WeekBoutSummary {
  bouts: number;
  deaths: number;
  injuries: number;
  deathNames: string[];
  injuryNames: string[];
  hadPlayerDeath: boolean;
  hadRivalryEscalation: boolean;
}

/**
 * Defines the shape of bout context.
 */
export interface BoutContext {
  warriorMap: Map<string, Warrior>;
  warrior: Warrior;
  opponent: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  moodMods: ReturnType<typeof getMoodModifiers>;
  week: number;
  playerId: string;
  contract?: BoutOffer;
  headless?: boolean;
  isTournamentBout?: boolean;
}

function getValidatedCombatants(ctx: BoutContext): { cW: Warrior; cO: Warrior } | null {
  const cW = ctx.warriorMap.get(ctx.warrior.id);
  const cO = ctx.warriorMap.get(ctx.opponent.id);
  if (!cW || !cO) {
    // console.log(`[BoutValidation] FAILED: Missing warriors (${ctx.warrior.id} vs ${ctx.opponent.id})`);
    return null;
  }
  if (!validateBoutCombatants(cW, cO)) {
    // console.log(`[BoutValidation] FAILED: validateBoutCombatants check`);
    return null;
  }
  return { cW, cO };
}

function handleInvalidBout(ctx: BoutContext): BoutImpact {
  return {
    impact: {},
    result: {
      a: ctx.warrior,
      d: ctx.opponent,
      outcome: { winner: null, by: 'Draw', minutes: 0, log: [] } as FightOutcome,
      isRivalry: ctx.isRivalry,
      rivalStable: ctx.rivalStable,
      contractId: ctx.contract?.id,
    },
    stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] },
  };
}

function getNPCPlan(
  state: GameState,
  w: Warrior,
  opponentStyle: FightingStyle,
  opponentOwnerId?: string
): FightPlan {
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

function isNPCWarrior(state: GameState, w: Warrior): boolean {
  return !!state.rivalMap?.get(w.stableId as string);
}

function runBoutSimulation(
  state: GameState,
  _ctx: BoutContext,
  validCW: Warrior,
  validCO: Warrior,
  boutSeed: number
) {
  // Tournament bouts always run in perfect 'Clear' conditions at the Bloodsands.
  // Non-tournament bouts use the arena selected at offer time (contract.arenaId).
  const weather = _ctx.isTournamentBout ? 'Clear' : state.weather;
  const arenaId = _ctx.isTournamentBout
    ? 'bloodsands_arena'
    : (_ctx.contract?.arenaId ?? undefined);

  // Determine plans: player warriors use w.plan or defaultPlanForWarrior;
  // NPC warriors use aiPlanForWarrior with personality, philosophy, and matchup awareness.
  const planA = isNPCWarrior(state, validCW)
    ? getNPCPlan(state, validCW, validCO.style, _ctx.playerId)
    : getDefaultPlan(validCW, defaultPlanForWarrior);
  const planD = isNPCWarrior(state, validCO)
    ? getNPCPlan(state, validCO, validCW.style, _ctx.playerId)
    : getDefaultPlan(validCO, defaultPlanForWarrior);

  return simulateFight(
    planA,
    planD,
    validCW,
    validCO,
    boutSeed,
    state.trainers,
    weather,
    arenaId,
    state.crowdMood,
    _ctx.headless
  );
}

function collectBoutImpacts(
  state: GameState,
  ctx: BoutContext,
  validCW: Warrior,
  validCO: Warrior,
  outcome: FightOutcome,
  boutSeed: number
) {
  const tags = outcome.post?.tags ?? [];
  const rng = new SeededRNGService(boutSeed);
  const { fameA, popA, fameD, popD } = calculateBoutFame(
    outcome,
    tags,
    ctx.moodMods,
    ctx.isRivalry
  );

  const impacts: StateImpact[] = processContractPayouts(
    state,
    ctx.contract,
    getWinnerId(outcome, validCW.id, validCO.id),
    validCW.id,
    validCO.id
  );
  const boutArenaId = ctx.isTournamentBout
    ? 'bloodsands_arena'
    : (ctx.contract?.arenaId ?? undefined);
  impacts.push(
    applyRecords(
      state,
      validCW,
      validCO,
      outcome,
      tags,
      fameA,
      popA,
      fameD,
      popD,
      ctx.rivalStableId,
      boutArenaId
    )
  );

  const deathRes = handleDeath(
    state,
    validCW,
    validCO,
    outcome,
    ctx.week,
    tags,
    ctx.rivalStableId,
    rng
  );
  const injuryRes = handleInjuries(
    state,
    validCW,
    validCO,
    outcome,
    ctx.week,
    ctx.rivalStableId,
    boutSeed
  );
  impacts.push(
    deathRes.impact,
    injuryRes.impact,
    handleProgressions(state, validCW, validCO, outcome, tags, ctx.week, ctx.rivalStableId, rng)
  );

  const resolvedArenaId = ctx.isTournamentBout
    ? 'bloodsands_arena'
    : (ctx.contract?.arenaId ?? undefined);
  const { summary, announcement } = handleReporting(
    validCW,
    validCO,
    outcome,
    tags,
    fameA,
    popA,
    fameD,
    popD,
    ctx.week,
    ctx.rivalStableId,
    ctx.isRivalry,
    0,
    rng,
    resolvedArenaId,
    state.weather
  );
  impacts.push({ arenaHistory: [summary] });

  // Only emit events in non-headless mode (UI context)
  if (!ctx.headless) {
    engineEventBus.emit({
      type: 'BOUT_COMPLETED',
      payload: { summary, transcript: summary.transcript },
    });
  }

  return { impacts, deathRes, injuryRes, announcement, summary };
}

/**
 * Resolve bout.
 */
export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const combatants = getValidatedCombatants(ctx);
  if (!combatants) return handleInvalidBout(ctx);

  const { cW, cO } = combatants;
  const boutSeed = hashStr(`${ctx.week}|${cW.id}|${cO.id}`);

  const outcome = runBoutSimulation(state, ctx, cW, cO, boutSeed);
  const { impacts, deathRes, injuryRes, announcement } = collectBoutImpacts(
    state,
    ctx,
    cW,
    cO,
    outcome,
    boutSeed
  );

  return {
    impact: mergeImpacts(impacts),
    result: {
      a: ctx.warrior,
      d: ctx.opponent,
      outcome,
      announcement,
      isRivalry: ctx.isRivalry,
      rivalStable: ctx.rivalStable,
      contractId: ctx.contract?.id,
      weather: state.weather,
    },
    stats: {
      death: deathRes.death,
      playerDeath: deathRes.playerDeath,
      injured: injuryRes.injured,
      deathNames: deathRes.deathNames,
      injuredNames: injuryRes.injuredNames,
    },
  };
}

/**
 * Process week bouts.
 */
export function processWeekBouts(
  state: GameState,
  headless?: boolean
): {
  impact: StateImpact;
  results: BoutResult[];
  summary: WeekBoutSummary;
} {
  const warriorMap = state.warriorMap || buildWarriorMap(state);

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
      week: state.week,
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

  impacts.push(finalizeWeekSideEffectsToImpact(state, results));
  return { impact: mergeImpacts(impacts), results, summary };
}
