/**
 * Gap 1 — NPC warriors fight with defaultPlanForWarrior instead of aiPlanForWarrior.
 * These tests verify that runBoutSimulation uses aiPlanForWarrior for NPC warriors
 * (with personality, philosophy, intent, matchup awareness) while preserving
 * player warrior plans and tournament bout behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { GameState, RivalStableData } from '@/types/state.types';
import { computeWarriorStats } from '@/engine/skillCalc';
import { defaultPlanForWarrior } from '@/engine/simulate';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarrior(
  name: string,
  style: FightingStyle,
  stableId: string,
  overrides: Partial<Warrior> = {}
): Warrior {
  const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: `test_${name}` as any,
    name,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    stableId: stableId as any,
    ...overrides,
  } as Warrior;
}

function makeRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Rival Owner',
      stableName: 'Rival Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Aggressive',
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    philosophy: 'Brute Force',
    ...overrides,
  } as RivalStableData;
}

function makeBaseState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
    week: 5,
    year: 1,
    treasury: 1000,
    fame: 0,
    roster: [],
    rivals: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    graveyard: [],
    trainers: [],
    hiringPool: [],
    recruitPool: [],
    scoutReports: [],
    hallOfFame: [],
    retired: [],
    player: {
      id: 'player-1' as any,
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    } as any,
    crowdMood: 'Calm',
    moodHistory: [],
    tournaments: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    ownerGrudges: [],
    insightTokens: [],
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    ledger: [],
    popularity: 0,
    rosterBonus: 0,
    ftueComplete: true,
    ftueStep: 0,
    coachDismissed: [],
    isFTUE: false,
    ...overrides,
  } as unknown as GameState;
}

function setupStateWithOffer(
  playerWarrior: Warrior,
  npcWarrior: Warrior,
  rival: RivalStableData
): GameState {
  const state = makeBaseState({ roster: [playerWarrior], rivals: [rival] });

  const warriorMap = new Map<string, Warrior>();
  warriorMap.set(playerWarrior.id, playerWarrior);
  warriorMap.set(npcWarrior.id, npcWarrior);
  state.warriorMap = warriorMap as any;

  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  warriorToStableMap.set(playerWarrior.id, { stableId: 'player-1', isPlayer: true });
  warriorToStableMap.set(npcWarrior.id, { stableId: 'rival-1', isPlayer: false });
  state.warriorToStableMap = warriorToStableMap as any;

  const rivalMap = new Map<string, RivalStableData>();
  rivalMap.set('rival-1', rival);
  state.rivalMap = rivalMap as any;

  const offerId = 'test-offer' as any;
  state.boutOffers = {
    [offerId]: {
      id: offerId,
      promoterId: 'prom-1' as any,
      warriorIds: [playerWarrior.id, npcWarrior.id],
      boutWeek: 5,
      expirationWeek: 6,
      purse: 500,
      hype: 100,
      status: 'Signed',
      responses: {},
      arenaId: 'standard_arena',
    } as any,
  };

  return state;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gap 1: runBoutSimulation uses aiPlanForWarrior for NPC warriors', () => {
  let simulateSpy: any;

  beforeEach(() => {
    vi.resetModules();
  });

  it('NPC warrior gets aiPlanForWarrior plan with personality mods, not defaultPlanForWarrior', async () => {
    const mod = await import('@/engine/bout/services/boutProcessorService');
    const simMod = await import('@/engine/simulate');
    simulateSpy = vi.spyOn(simMod, 'simulateFight');

    const npcWarrior = makeWarrior('NPCFighter', FightingStyle.StrikingAttack, 'rival-1');
    const playerWarrior = makeWarrior('PlayerFighter', FightingStyle.ParryRiposte, 'player-1');

    const rival = makeRival({
      owner: {
        id: 'owner-1' as any,
        name: 'Aggressive Owner',
        stableName: 'Aggressive Stable',
        fame: 100,
        renown: 50,
        titles: 0,
        personality: 'Aggressive',
      },
      roster: [npcWarrior],
      philosophy: 'Brute Force',
    });

    const state = setupStateWithOffer(playerWarrior, npcWarrior, rival);

    mod.resolveBout(state, {
      warrior: playerWarrior,
      opponent: npcWarrior,
      isRivalry: false,
      moodMods: { fameMod: 1, popMod: 1 } as any,
      week: 5,
      playerId: 'player-1',
      warriorMap: state.warriorMap!,
      contract: state.boutOffers['test-offer' as any],
    });

    expect(simulateSpy).toHaveBeenCalledOnce();
    const args = simulateSpy.mock.calls[0]!;
    const planA = args[0] as any;
    const planD = args[1] as any;

    // NPC plan should have aiPlanForWarrior features:
    // - phases (only aiPlanForWarrior adds these)
    expect(planD.phases).toBeDefined();
    expect(planD.phases).toBeTruthy();

    // - conditions (personality adaptations)
    expect(planD.conditions).toBeDefined();
    expect(planD.conditions.length).toBeGreaterThan(0);

    // - desperatePlan
    expect(planD.desperatePlan).toBeDefined();

    // - strategic levers (target, protect, aggressionBias)
    expect(planD.target).toBeDefined();
    expect(planD.aggressionBias).toBeDefined();

    // Player plan should use defaultPlanForWarrior (no phases, no conditions)
    expect(planA.phases).toBeUndefined();
  });

  it('player warrior uses w.plan when set', async () => {
    const mod = await import('@/engine/bout/services/boutProcessorService');
    const simMod = await import('@/engine/simulate');
    simulateSpy = vi.spyOn(simMod, 'simulateFight');

    const customPlan = {
      style: FightingStyle.ParryRiposte,
      OE: 3,
      AL: 8,
      killDesire: 2,
      target: 'Head',
      protect: 'Body',
      offensiveTactic: 'none',
      defensiveTactic: 'Parry',
    };

    const playerWarrior = makeWarrior('PlayerFighter', FightingStyle.ParryRiposte, 'player-1', {
      plan: customPlan as any,
    });
    const npcWarrior = makeWarrior('NPCFighter', FightingStyle.StrikingAttack, 'rival-1');

    const rival = makeRival({ roster: [npcWarrior] });
    const state = setupStateWithOffer(playerWarrior, npcWarrior, rival);

    mod.resolveBout(state, {
      warrior: playerWarrior,
      opponent: npcWarrior,
      isRivalry: false,
      moodMods: { fameMod: 1, popMod: 1 } as any,
      week: 5,
      playerId: 'player-1',
      warriorMap: state.warriorMap!,
      contract: state.boutOffers['test-offer' as any],
    });

    expect(simulateSpy).toHaveBeenCalledOnce();
    const planA = simulateSpy.mock.calls[0]![0] as any;

    // Player plan should be the custom plan, not defaultPlanForWarrior
    expect(planA.OE).toBe(3);
    expect(planA.AL).toBe(8);
    expect(planA.target).toBe('Head');
  });

  it('player warrior falls back to defaultPlanForWarrior when no plan set', async () => {
    const mod = await import('@/engine/bout/services/boutProcessorService');
    const simMod = await import('@/engine/simulate');
    simulateSpy = vi.spyOn(simMod, 'simulateFight');

    const playerWarrior = makeWarrior('PlayerFighter', FightingStyle.StrikingAttack, 'player-1');
    const npcWarrior = makeWarrior('NPCFighter', FightingStyle.ParryRiposte, 'rival-1');

    const rival = makeRival({ roster: [npcWarrior] });
    const state = setupStateWithOffer(playerWarrior, npcWarrior, rival);

    mod.resolveBout(state, {
      warrior: playerWarrior,
      opponent: npcWarrior,
      isRivalry: false,
      moodMods: { fameMod: 1, popMod: 1 } as any,
      week: 5,
      playerId: 'player-1',
      warriorMap: state.warriorMap!,
      contract: state.boutOffers['test-offer' as any],
    });

    expect(simulateSpy).toHaveBeenCalledOnce();
    const planA = simulateSpy.mock.calls[0]![0] as any;

    // Player plan should be defaultPlanForWarrior (no phases, no conditions)
    const expectedDefault = defaultPlanForWarrior(playerWarrior);
    expect(planA.OE).toBe(expectedDefault.OE);
    expect(planA.AL).toBe(expectedDefault.AL);
    expect(planA.phases).toBeUndefined();
  });

  it('NPC plan includes opponent-style matchup mods', async () => {
    const mod = await import('@/engine/bout/services/boutProcessorService');
    const simMod = await import('@/engine/simulate');
    simulateSpy = vi.spyOn(simMod, 'simulateFight');

    // BashingAttack vs LungingAttack: known matchup gives oe+2, al+1, kd+1
    const npcWarrior = makeWarrior('NPCBasher', FightingStyle.BashingAttack, 'rival-1');
    const playerWarrior = makeWarrior('PlayerLunger', FightingStyle.LungingAttack, 'player-1');

    const rival = makeRival({
      owner: {
        id: 'owner-1' as any,
        name: 'Owner',
        stableName: 'Stable',
        fame: 100,
        renown: 50,
        titles: 0,
        personality: 'Pragmatic',
      },
      roster: [npcWarrior],
      philosophy: 'Opportunist',
    });

    const state = setupStateWithOffer(playerWarrior, npcWarrior, rival);

    mod.resolveBout(state, {
      warrior: playerWarrior,
      opponent: npcWarrior,
      isRivalry: false,
      moodMods: { fameMod: 1, popMod: 1 } as any,
      week: 5,
      playerId: 'player-1',
      warriorMap: state.warriorMap!,
      contract: state.boutOffers['test-offer' as any],
    });

    expect(simulateSpy).toHaveBeenCalledOnce();
    const npcPlan = simulateSpy.mock.calls[0]![1] as any;

    // BashingAttack base OE=7, Pragmatic adds OE+0, Opportunist adds OE+0,
    // matchup vs LungingAttack gives oe+2 → OE=9
    // Without aiPlanForWarrior, defaultPlanForWarrior gives OE=7
    expect(npcPlan.OE).toBe(9);
  });
});
