/**
 * Bout resolution logic — validation, simulation, impact collection.
 * Extracted from boutProcessorService.ts for SRP separation.
 */
import { GameState, Warrior } from '@/types/state.types';
import type { FightingStyle } from '@/types/shared.types';
import { type FightOutcome, type FightPlan } from '@/types/combat.types';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
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
import { getPairKey } from '@/utils/keyUtils';
import type { BoutContext, BoutImpact } from './boutProcessorTypes';

function getValidatedCombatants(ctx: BoutContext): { cW: Warrior; cO: Warrior } | null {
  const cW = ctx.warriorMap.get(ctx.warrior.id);
  const cO = ctx.warriorMap.get(ctx.opponent.id);
  if (!cW || !cO) {
    return null;
  }
  if (!validateBoutCombatants(cW, cO)) {
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
    const grudge = state.grudgeMap?.get(getPairKey(rival.owner.id, opponentOwnerId));
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
  const weather = _ctx.isTournamentBout ? 'Clear' : state.weather;
  const arenaId = _ctx.isTournamentBout
    ? 'bloodsands_arena'
    : (_ctx.contract?.arenaId ?? undefined);

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
    handleProgressions(state, validCW, validCO, outcome, tags, ctx.week, rng)
  );

  const rosterUpdates = new Map();
  rosterUpdates.set(validCW.id, { lastBoutWeek: ctx.week });
  rosterUpdates.set(validCO.id, { lastBoutWeek: ctx.week });
  impacts.push({ rosterUpdates });
  for (const rival of state.rivals || []) {
    const hasCombatant = rival.roster.some((w) => w.id === validCW.id || w.id === validCO.id);
    if (hasCombatant) {
      const rivalRosterUpdates = new Map();
      rivalRosterUpdates.set(rival.id, {
        roster: rival.roster.map((w) =>
          w.id === validCW.id || w.id === validCO.id ? { ...w, lastBoutWeek: ctx.week } : w
        ),
      });
      impacts.push({ rivalsUpdates: rivalRosterUpdates });
    }
  }

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
  impacts.push({ arenaHistory: [summary] });

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
