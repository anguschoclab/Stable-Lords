/**
 * Bout resolution logic — validation, simulation, impact collection.
 * Extracted from boutProcessorService.ts for SRP separation.
 */
import { GameState, Warrior } from '@/types/state.types';
import type { FightingStyle } from '@/types/shared.types';
import { type FightOutcome, type FightPlan, type FightSummary } from '@/types/combat.types';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { engineEventBus } from '@/engine/core/EventBus';
import { SeededRNGService } from '@/utils/random';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { selectArenaForTournamentBout } from '@/engine/matchmaking/tournament/tournamentArenaSelection';
import { ARENA_SELECTION } from '@/constants/arena';
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
import { isPlayerOwned } from '../warriorRouting';
import { deadIdSet } from '@/engine/warrior/warriorStatus';
import { handleInjuries } from '../injuryHandler';
import { handleProgressions } from '../progressionHandler';
import { handleReporting } from '../reportingHandler';
import { getPairKey } from '@/utils/keyUtils';
import type { BoutContext, BoutImpact } from './boutProcessorTypes';

function getValidatedCombatants(
  state: GameState,
  ctx: BoutContext
): { cW: Warrior; cO: Warrior } | null {
  const cW = ctx.warriorMap.get(ctx.warrior.id);
  const cO = ctx.warriorMap.get(ctx.opponent.id);
  if (!cW || !cO) {
    return null;
  }
  const deadIds = deadIdSet(state);
  if (!validateBoutCombatants(cW, cO, deadIds)) {
    return null;
  }
  return { cW, cO };
}

/**
 * An invalid bout is skipped — no phantom Draw summary, no payout, and the
 * associated contract is returned for cancellation (a Signed offer left
 * dangling would never resolve, pay out, or penalize).
 */
function handleInvalidBout(ctx: BoutContext): BoutImpact {
  return {
    impact: {},
    result: null,
    voidedOffer: ctx.contract,
    stats: { death: false, playerDeath: false, injured: false, deathNames: [], injuredNames: [] },
  };
}

/**
 * Resolve the fight plan an NPC warrior runs this bout: a fresh persisted
 * plan written for this opponent this week is honored verbatim; anything
 * stale or opponent-mismatched is recomputed through `aiPlanForWarrior`.
 */
export function getNPCPlan(
  state: GameState,
  w: Warrior,
  opponentStyle: FightingStyle,
  opponentOwnerId?: string,
  opponentStableId?: string
): FightPlan {
  const rival = state.rivalMap?.get(w.stableId as string);
  if (!rival) return { ...defaultPlanForWarrior(w), killDesire: 7 };

  // E.2 — a committed plan written for THIS opponent THIS week is honored
  // verbatim; a stale or opponent-mismatched plan is recomputed (G8).
  const week = state.absoluteWeek ?? state.week;
  if (
    w.plan &&
    !w.planMasked &&
    w.planWeek === week &&
    (opponentStableId === undefined || w.planForStableId === opponentStableId)
  ) {
    return w.plan;
  }

  let grudgeIntensity = 0;
  if (opponentOwnerId) {
    const grudge = state.grudgeMap?.get(getPairKey(rival.owner.id, opponentOwnerId));
    grudgeIntensity = grudge?.intensity ?? 0;
  }

  return aiPlanForWarrior(
    w,
    rival.owner.personality || 'Pragmatic',
    rival.philosophy || 'Opportunist',
    opponentStyle,
    rival.strategy?.intent,
    grudgeIntensity,
    opponentStableId ? rival.agentMemory?.opponentDossiers?.[opponentStableId] : undefined,
    week
  );
}

function isNPCWarrior(state: GameState, w: Warrior): boolean {
  return !!state.rivalMap?.get(w.stableId as string);
}

/**
 * Tournament pairings carry a synthetic `tour_*` contractId, not a real
 * BoutOffer — so `contract.arenaId` is unavailable. Pick the venue
 * deterministically from the bout seed so the simulation, career records,
 * and persisted summary all agree even across shard-worker boundaries.
 */
function resolveBoutArenaId(ctx: BoutContext, boutSeed: number): string | undefined {
  if (!ctx.isTournamentBout) return ctx.contract?.arenaId ?? undefined;
  const arenaRng = new SeededRNGService(boutSeed + ARENA_SELECTION.TOURNAMENT_BOUT_SEED_OFFSET);
  return selectArenaForTournamentBout(() => arenaRng.next());
}

function runBoutSimulation(
  state: GameState,
  _ctx: BoutContext,
  validCW: Warrior,
  validCO: Warrior,
  boutSeed: number
) {
  const weather = _ctx.isTournamentBout ? 'Clear' : state.weather;
  const arenaId = resolveBoutArenaId(_ctx, boutSeed);

  const planA = isNPCWarrior(state, validCW)
    ? getNPCPlan(state, validCW, validCO.style, _ctx.playerId, validCO.stableId as string)
    : getDefaultPlan(validCW, defaultPlanForWarrior);
  const planD = isNPCWarrior(state, validCO)
    ? getNPCPlan(state, validCO, validCW.style, _ctx.playerId, validCW.stableId as string)
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
    _ctx.headless,
    state.houseRules?.deathRateMult
  );
}

/**
 * lastBoutWeek stamps for both combatants. Rival-owned combatants get a
 * per-warrior patch; this used to rebuild the owning rival's whole roster
 * from the pre-bout snapshot, which — merged last-wins — discarded that
 * bout's record, injury, XP and death updates for every rival warrior.
 * Favorites discovered in-place are routed explicitly by handleProgressions.
 */
function rosterUpdateImpacts(
  state: GameState,
  validCW: Warrior,
  validCO: Warrior,
  week: number
): StateImpact[] {
  const rosterUpdates = new Map();
  rosterUpdates.set(validCW.id, { lastBoutWeek: week });
  rosterUpdates.set(validCO.id, { lastBoutWeek: week });
  const rivalWarriorPatches = new Map<Warrior['id'], Partial<Warrior>>();
  for (const w of [validCW, validCO]) {
    if (!isPlayerOwned(state, w)) rivalWarriorPatches.set(w.id, { lastBoutWeek: week });
  }
  return [{ rosterUpdates, rivalWarriorPatches }];
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
  const boutArenaId = resolveBoutArenaId(ctx, boutSeed);
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

  const { deathRes, injuryRes } = postResolutionImpacts(
    state,
    ctx,
    validCW,
    validCO,
    outcome,
    tags,
    rng,
    boutSeed,
    impacts
  );

  const { summary, announcement } = reportBout(
    state,
    ctx,
    validCW,
    validCO,
    outcome,
    tags,
    { fameA, popA, fameD, popD },
    rng,
    boutSeed,
    impacts
  );

  return { impacts, deathRes, injuryRes, announcement, summary };
}

/**
 * Death, injury, and progression resolution plus roster-update impacts.
 * RNG draw order (death pass → injury pass → progressions) is load-bearing.
 */
function postResolutionImpacts(
  state: GameState,
  ctx: BoutContext,
  validCW: Warrior,
  validCO: Warrior,
  outcome: FightOutcome,
  tags: string[],
  rng: IRNGService,
  boutSeed: number,
  impacts: StateImpact[]
): { deathRes: ReturnType<typeof handleDeath>; injuryRes: ReturnType<typeof handleInjuries> } {
  const deathRes = handleDeath(
    state,
    validCW,
    validCO,
    outcome,
    ctx.week,
    tags,
    ctx.rivalStableId,
    rng,
    ctx.tournamentId
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
    handleProgressions(state, validCW, validCO, outcome, tags, ctx.week, rng),
    ...rosterUpdateImpacts(state, validCW, validCO, ctx.week)
  );
  return { deathRes, injuryRes };
}

/**
 * Build the fight summary + announcement, stamp the title-bout channel, push
 * the arenaHistory impact, and emit BOUT_COMPLETED when headed.
 */
function reportBout(
  state: GameState,
  ctx: BoutContext,
  validCW: Warrior,
  validCO: Warrior,
  outcome: FightOutcome,
  tags: string[],
  fame: { fameA: number; popA: number; fameD: number; popD: number },
  rng: IRNGService,
  boutSeed: number,
  impacts: StateImpact[]
): { summary: FightSummary; announcement: string } {
  const resolvedArenaId = resolveBoutArenaId(ctx, boutSeed);
  const { summary, announcement } = handleReporting(
    validCW,
    validCO,
    outcome,
    tags,
    fame.fameA,
    fame.popA,
    fame.fameD,
    fame.popD,
    ctx.displayWeek ?? ctx.week,
    ctx.rivalStableId,
    ctx.isRivalry,
    0,
    rng,
    resolvedArenaId,
    state.weather,
    ctx.week,
    ctx.contract?.id
  );
  // Stamp the title-bout channel — ArenaChampionshipPass resolves reigns off
  // this flag, and the UI badges the bout as a defense.
  if (ctx.contract?.titleArenaId) summary.titleArenaId = ctx.contract.titleArenaId;
  impacts.push({ arenaHistory: [summary] });

  if (!ctx.headless) {
    engineEventBus.emit({
      type: 'BOUT_COMPLETED',
      payload: { summary, transcript: summary.transcript },
    });
  }

  return { summary, announcement };
}

/**
 * Resolve bout.
 */
export function resolveBout(state: GameState, ctx: BoutContext): BoutImpact {
  const combatants = getValidatedCombatants(state, ctx);
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
      // cW/cO are the post-resolution combatants — in sequential execution
      // they are identical objects to ctx.warrior/ctx.opponent, but in shard
      // workers they are the clones that received in-place post-bout writes
      // (favorites discovery), so results stay byte-identical across paths.
      a: cW,
      d: cO,
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
