/**
 * Agent Core — exhaustive coverage for createAgentContext, logAgentAction,
 * consolidateAgentMemory, and computePlayerThreatLevel.
 */
import { describe, it, expect } from 'vitest';
import {
  createAgentContext,
  logAgentAction,
  consolidateAgentMemory,
  computePlayerThreatLevel,
} from '@/engine/ai/agentCore';
import type { GameState, RivalStableData, AIAgentMemory, AIEvent, RankingEntry } from '@/types/state.types';

function createMockRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival_1' as any,
    owner: {
      id: 'owner_1' as any,
      name: 'Test Owner',
      stableName: 'Test Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    fame: 100,
    roster: [],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    ...overrides,
  } as RivalStableData;
}

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    meta: { gameName: 'test', version: '1.0', createdAt: '2025-01-01' },
    ftueComplete: true,
    coachDismissed: [],
    player: { id: 'p1', name: 'Player', stableName: 'Player Stable', fame: 0, renown: 0, titles: 0 },
    fame: 0,
    popularity: 0,
    treasury: 1000,
    ledger: [],
    week: 1,
    year: 1,
    phase: 'planning',
    season: 'Spring',
    weather: 'Clear',
    roster: [],
    graveyard: [],
    retired: [],
    arenaHistory: [],
    newsletter: [],
    gazettes: [],
    hallOfFame: [],
    crowdMood: 'Calm',
    tournaments: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    seasonalGrowth: [],
    rivals: [],
    scoutReports: [],
    restStates: [],
    rivalries: [],
    matchHistory: [],
    playerChallenges: [],
    playerAvoids: [],
    recruitPool: [],
    rosterBonus: 0,
    ownerGrudges: [],
    insightTokens: [],
    moodHistory: [],
    isFTUE: false,
    unacknowledgedDeaths: [],
    day: 0,
    isTournamentWeek: false,
    promoters: {},
    boutOffers: {},
    realmRankings: {},
    awards: [],
    progression: {
      status: 'active',
      stableStanding: 1,
      totalStables: 10,
      objectives: [],
    },
    ...overrides,
  } as unknown as GameState;
}

describe('agentCore — createAgentContext', () => {
  it('returns an AgentContext with rival, state, meta, and playerThreatLevel', () => {
    const rival = createMockRival();
    const state = createMockState();
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival).toBeDefined();
    expect(ctx.state).toBe(state);
    expect(ctx.meta).toBeDefined();
    expect(ctx.playerThreatLevel).toBeDefined();
  });

  it('initializes agentMemory when rival.agentMemory is missing', () => {
    const rival = createMockRival({ agentMemory: undefined });
    const state = createMockState();
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival.agentMemory).toBeDefined();
    expect(ctx.rival.agentMemory!.lastTreasury).toBe(1000);
    expect(ctx.rival.agentMemory!.burnRate).toBe(0);
    expect(ctx.rival.agentMemory!.metaAwareness).toEqual({});
    expect(ctx.rival.agentMemory!.currentIntent).toBe('CONSOLIDATION');
  });

  it('uses existing agentMemory when present', () => {
    const existingMemory: AIAgentMemory = {
      lastTreasury: 500,
      burnRate: 50,
      metaAwareness: { STRIKING_ATTACK: 1 },
      knownRivals: ['owner_2' as any],
      currentIntent: 'VENDETTA',
    };
    const rival = createMockRival({ agentMemory: existingMemory });
    const state = createMockState();
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival.agentMemory).toEqual(existingMemory);
  });

  it('initializes knownRivals from state.rivals excluding self', () => {
    const rival = createMockRival({ agentMemory: undefined });
    const state = createMockState({
      rivals: [
        createMockRival({ owner: { ...createMockRival().owner, id: 'owner_1' as any } }),
        createMockRival({ owner: { ...createMockRival().owner, id: 'owner_2' as any } }),
        createMockRival({ owner: { ...createMockRival().owner, id: 'owner_3' as any } }),
      ],
    });
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival.agentMemory!.knownRivals).toEqual(['owner_2', 'owner_3']);
  });

  it('initializes knownRivals as empty array when state.rivals is empty', () => {
    const rival = createMockRival({ agentMemory: undefined });
    const state = createMockState({ rivals: [] });
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival.agentMemory!.knownRivals).toEqual([]);
  });

  it('initializes knownRivals as empty array when state.rivals is undefined', () => {
    const rival = createMockRival({ agentMemory: undefined });
    const state = createMockState({ rivals: undefined as any });
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival.agentMemory!.knownRivals).toEqual([]);
  });

  it('uses cachedMetaDrift when available', () => {
    const cachedMeta = { STRIKING_ATTACK: 5 } as any;
    const rival = createMockRival();
    const state = createMockState({ cachedMetaDrift: cachedMeta });
    const ctx = createAgentContext(rival, state);
    expect(ctx.meta).toBe(cachedMeta);
  });

  it('computes metaDrift from arenaHistory when cachedMetaDrift is not available', () => {
    const rival = createMockRival();
    const state = createMockState({ cachedMetaDrift: undefined, arenaHistory: [] });
    const ctx = createAgentContext(rival, state);
    expect(ctx.meta).toBeDefined();
    expect(typeof ctx.meta).toBe('object');
  });

  it('computes metaDrift from empty arenaHistory when both are undefined', () => {
    const rival = createMockRival();
    const state = createMockState({ cachedMetaDrift: undefined, arenaHistory: undefined as any });
    const ctx = createAgentContext(rival, state);
    expect(ctx.meta).toBeDefined();
  });

  it('spreads rival with agentMemory in returned context', () => {
    const rival = createMockRival({ treasury: 999 });
    const state = createMockState();
    const ctx = createAgentContext(rival, state);
    expect(ctx.rival.treasury).toBe(999);
    expect(ctx.rival.agentMemory).toBeDefined();
  });
});

describe('agentCore — computePlayerThreatLevel', () => {
  it('returns Neutral when realmRankings is empty', () => {
    const state = createMockState({ realmRankings: {} });
    expect(computePlayerThreatLevel(state)).toBe('Neutral');
  });

  it('returns Neutral when realmRankings is undefined', () => {
    const state = createMockState({ realmRankings: undefined as any });
    expect(computePlayerThreatLevel(state)).toBe('Neutral');
  });

  it('returns Neutral when no player warriors are in rankings', () => {
    const state = createMockState({
      roster: [{ id: 'w1' as any, status: 'Active' } as any],
      realmRankings: { w_other: { overallRank: 1, classRank: 1, compositeScore: 100 } } as Record<string, RankingEntry>,
    });
    expect(computePlayerThreatLevel(state)).toBe('Neutral');
  });

  it('returns Neutral when roster is empty', () => {
    const state = createMockState({
      roster: [],
      realmRankings: { w1: { overallRank: 1, classRank: 1, compositeScore: 100 } } as Record<string, RankingEntry>,
    });
    expect(computePlayerThreatLevel(state)).toBe('Neutral');
  });

  it('returns Dominant when best warrior rank percentile <= 0.15', () => {
    const state = createMockState({
      roster: [{ id: 'w1' as any, status: 'Active' } as any],
      realmRankings: {
        w1: { overallRank: 1, classRank: 1, compositeScore: 100 },
        w2: { overallRank: 2, classRank: 2, compositeScore: 90 },
        w3: { overallRank: 3, classRank: 3, compositeScore: 80 },
        w4: { overallRank: 4, classRank: 4, compositeScore: 70 },
        w5: { overallRank: 5, classRank: 5, compositeScore: 60 },
        w6: { overallRank: 6, classRank: 6, compositeScore: 50 },
        w7: { overallRank: 7, classRank: 7, compositeScore: 40 },
      } as Record<string, RankingEntry>,
    });
    // percentile = 1/7 ≈ 0.143 <= 0.15 → Dominant
    expect(computePlayerThreatLevel(state)).toBe('Dominant');
  });

  it('returns Moderate when best warrior rank percentile <= 0.4 but > 0.15', () => {
    const state = createMockState({
      roster: [{ id: 'w1' as any, status: 'Active' } as any],
      realmRankings: {
        w1: { overallRank: 3, classRank: 3, compositeScore: 80 },
        w2: { overallRank: 1, classRank: 1, compositeScore: 100 },
        w3: { overallRank: 2, classRank: 2, compositeScore: 90 },
        w4: { overallRank: 4, classRank: 4, compositeScore: 70 },
        w5: { overallRank: 5, classRank: 5, compositeScore: 60 },
        w6: { overallRank: 6, classRank: 6, compositeScore: 50 },
        w7: { overallRank: 7, classRank: 7, compositeScore: 40 },
        w8: { overallRank: 8, classRank: 8, compositeScore: 30 },
        w9: { overallRank: 9, classRank: 9, compositeScore: 20 },
        w10: { overallRank: 10, classRank: 10, compositeScore: 10 },
      } as Record<string, RankingEntry>,
    });
    // percentile = 3/10 = 0.3 <= 0.4 → Moderate
    expect(computePlayerThreatLevel(state)).toBe('Moderate');
  });

  it('returns Neutral when best warrior rank percentile > 0.4', () => {
    const state = createMockState({
      roster: [{ id: 'w1' as any, status: 'Active' } as any],
      realmRankings: {
        w1: { overallRank: 9, classRank: 9, compositeScore: 20 },
        w2: { overallRank: 1, classRank: 1, compositeScore: 100 },
        w3: { overallRank: 2, classRank: 2, compositeScore: 90 },
        w4: { overallRank: 3, classRank: 3, compositeScore: 80 },
        w5: { overallRank: 4, classRank: 4, compositeScore: 70 },
        w6: { overallRank: 5, classRank: 5, compositeScore: 60 },
        w7: { overallRank: 6, classRank: 6, compositeScore: 50 },
        w8: { overallRank: 7, classRank: 7, compositeScore: 40 },
        w9: { overallRank: 8, classRank: 8, compositeScore: 30 },
        w10: { overallRank: 10, classRank: 10, compositeScore: 10 },
      } as Record<string, RankingEntry>,
    });
    // percentile = 9/10 = 0.9 > 0.4 → Neutral
    expect(computePlayerThreatLevel(state)).toBe('Neutral');
  });

  it('finds the best (lowest) overallRank among player warriors', () => {
    const state = createMockState({
      roster: [
        { id: 'w1' as any, status: 'Active' } as any,
        { id: 'w2' as any, status: 'Active' } as any,
      ],
      realmRankings: {
        w1: { overallRank: 5, classRank: 5, compositeScore: 60 },
        w2: { overallRank: 2, classRank: 2, compositeScore: 90 },
        w3: { overallRank: 1, classRank: 1, compositeScore: 100 },
        w4: { overallRank: 3, classRank: 3, compositeScore: 80 },
        w5: { overallRank: 4, classRank: 4, compositeScore: 70 },
      } as Record<string, RankingEntry>,
    });
    // Best player rank = 2, total = 5, percentile = 2/5 = 0.4 <= 0.4 → Moderate
    expect(computePlayerThreatLevel(state)).toBe('Moderate');
  });

  it('handles roster with undefined entries gracefully', () => {
    const state = createMockState({
      roster: [undefined as any, { id: 'w1' as any, status: 'Active' } as any],
      realmRankings: {
        w1: { overallRank: 1, classRank: 1, compositeScore: 100 },
        w2: { overallRank: 2, classRank: 2, compositeScore: 90 },
      } as Record<string, RankingEntry>,
    });
    // Best player rank = 1, total = 2, percentile = 1/2 = 0.5 > 0.4 → Neutral
    expect(computePlayerThreatLevel(state)).toBe('Neutral');
  });
});

describe('agentCore — logAgentAction', () => {
  it('creates a new AIEvent and prepends it to actionHistory', () => {
    const rival = createMockRival({ actionHistory: [] });
    const updated = logAgentAction(rival, 'STAFF', 'Hired trainer', 'Low', 5);
    expect(updated.actionHistory).toHaveLength(1);
    expect(updated.actionHistory![0]!.type).toBe('STAFF');
    expect(updated.actionHistory![0]!.description).toBe('Hired trainer');
    expect(updated.actionHistory![0]!.week).toBe(5);
    expect(updated.actionHistory![0]!.riskTier).toBe('Low');
  });

  it('prepends new event to existing actionHistory', () => {
    const existingEvent: AIEvent = {
      id: 'old-event',
      week: 1,
      type: 'STAFF',
      description: 'Old action',
      riskTier: 'Low',
    };
    const rival = createMockRival({ actionHistory: [existingEvent] });
    const updated = logAgentAction(rival, 'FINANCE', 'New action', 'Medium', 3);
    expect(updated.actionHistory).toHaveLength(2);
    expect(updated.actionHistory![0]!.description).toBe('New action');
    expect(updated.actionHistory![1]!.description).toBe('Old action');
  });

  it('prunes actionHistory to 20 entries (daemon limits)', () => {
    const existingEvents: AIEvent[] = Array.from({ length: 25 }, (_, i) => ({
      id: `event-${i}`,
      week: i,
      type: 'STAFF' as const,
      description: `Action ${i}`,
      riskTier: 'Low' as const,
    }));
    const rival = createMockRival({ actionHistory: existingEvents });
    const updated = logAgentAction(rival, 'STAFF', 'New action', 'Low', 99);
    expect(updated.actionHistory).toHaveLength(20);
    expect(updated.actionHistory![0]!.description).toBe('New action');
  });

  it('generates deterministic event IDs from same inputs', () => {
    const rival = createMockRival({ actionHistory: [] });
    const r1 = logAgentAction(rival, 'STAFF', 'Test', 'Low', 5);
    const r2 = logAgentAction(rival, 'STAFF', 'Test', 'Low', 5);
    expect(r1.actionHistory![0]!.id).toBe(r2.actionHistory![0]!.id);
  });

  it('infers WEALTH_ACCUMULATION intent from FINANCE type with "hoard" keyword', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'CONSOLIDATION' } as any });
    const updated = logAgentAction(rival, 'FINANCE', 'Decided to hoard gold', 'Low', 5);
    expect(updated.agentMemory!.currentIntent).toBe('WEALTH_ACCUMULATION');
  });

  it('infers WEALTH_ACCUMULATION intent from FINANCE type with "saving" keyword', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'CONSOLIDATION' } as any });
    const updated = logAgentAction(rival, 'FINANCE', 'saving for future', 'Low', 5);
    expect(updated.agentMemory!.currentIntent).toBe('WEALTH_ACCUMULATION');
  });

  it('infers AGGRESSIVE_EXPANSION intent from STRATEGY type with "aggressive" keyword', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'CONSOLIDATION' } as any });
    const updated = logAgentAction(rival, 'STRATEGY', 'Pursuing aggressive expansion', 'High', 5);
    expect(updated.agentMemory!.currentIntent).toBe('AGGRESSIVE_EXPANSION');
  });

  it('infers AGGRESSIVE_EXPANSION intent from STRATEGY type with "dominance" keyword', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'CONSOLIDATION' } as any });
    const updated = logAgentAction(rival, 'STRATEGY', 'Seeking dominance', 'High', 5);
    expect(updated.agentMemory!.currentIntent).toBe('AGGRESSIVE_EXPANSION');
  });

  it('infers ROSTER_DIVERSITY intent from ROSTER type with "scout" keyword', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'CONSOLIDATION' } as any });
    const updated = logAgentAction(rival, 'ROSTER', 'Looking to scout new talent', 'Medium', 5);
    expect(updated.agentMemory!.currentIntent).toBe('ROSTER_DIVERSITY');
  });

  it('infers ROSTER_DIVERSITY intent from ROSTER type with "diversify" keyword', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'CONSOLIDATION' } as any });
    const updated = logAgentAction(rival, 'ROSTER', 'Need to diversify roster', 'Medium', 5);
    expect(updated.agentMemory!.currentIntent).toBe('ROSTER_DIVERSITY');
  });

  it('preserves current intent when no keyword matches', () => {
    const rival = createMockRival({ agentMemory: { currentIntent: 'VENDETTA' } as any });
    const updated = logAgentAction(rival, 'STAFF', 'Hired a trainer', 'Low', 5);
    expect(updated.agentMemory!.currentIntent).toBe('VENDETTA');
  });

  it('defaults to CONSOLIDATION when agentMemory is missing', () => {
    const rival = createMockRival({ agentMemory: undefined });
    const updated = logAgentAction(rival, 'STAFF', 'Hired a trainer', 'Low', 5);
    expect(updated.agentMemory!.currentIntent).toBe('CONSOLIDATION');
  });
});

describe('agentCore — consolidateAgentMemory', () => {
  it('returns rival unchanged when agentMemory is missing', () => {
    const rival = createMockRival({ agentMemory: undefined });
    const result = consolidateAgentMemory(rival, 5);
    expect(result).toBe(rival);
  });

  it('computes burnRate as lastTreasury - currentTreasury', () => {
    const rival = createMockRival({
      treasury: 800,
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'CONSOLIDATION',
      },
    });
    const result = consolidateAgentMemory(rival, 5);
    expect(result.agentMemory!.burnRate).toBe(200);
  });

  it('computes negative burnRate when treasury increased', () => {
    const rival = createMockRival({
      treasury: 1200,
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'CONSOLIDATION',
      },
    });
    const result = consolidateAgentMemory(rival, 5);
    expect(result.agentMemory!.burnRate).toBe(-200);
  });

  it('updates lastTreasury to currentTreasury', () => {
    const rival = createMockRival({
      treasury: 750,
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'CONSOLIDATION',
      },
    });
    const result = consolidateAgentMemory(rival, 5);
    expect(result.agentMemory!.lastTreasury).toBe(750);
  });

  it('resets seasonRecord on week 1 (season boundary)', () => {
    const rival = createMockRival({
      roster: [
        { id: 'w1' as any, status: 'Active' } as any,
        { id: 'w2' as any, status: 'Active' } as any,
        { id: 'w3' as any, status: 'Retired' } as any,
      ],
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'CONSOLIDATION',
        seasonRecord: { wins: 5, losses: 2, kills: 1, rosterSizeAtSeasonStart: 3 },
      },
    });
    const result = consolidateAgentMemory(rival, 1);
    expect(result.agentMemory!.seasonRecord).toEqual({
      wins: 0,
      losses: 0,
      kills: 0,
      rosterSizeAtSeasonStart: 2, // Only Active warriors counted
    });
  });

  it('preserves seasonRecord on non-boundary weeks', () => {
    const existingRecord = { wins: 5, losses: 2, kills: 1, rosterSizeAtSeasonStart: 3 };
    const rival = createMockRival({
      treasury: 900,
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'CONSOLIDATION',
        seasonRecord: existingRecord,
      },
    });
    const result = consolidateAgentMemory(rival, 5);
    expect(result.agentMemory!.seasonRecord).toEqual(existingRecord);
  });

  it('counts only Active warriors in rosterSizeAtSeasonStart', () => {
    const rival = createMockRival({
      roster: [
        { id: 'w1' as any, status: 'Active' } as any,
        { id: 'w2' as any, status: 'Active' } as any,
        { id: 'w3' as any, status: 'Injured' } as any,
        { id: 'w4' as any, status: 'Active' } as any,
      ],
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'CONSOLIDATION',
      },
    });
    const result = consolidateAgentMemory(rival, 1);
    expect(result.agentMemory!.seasonRecord!.rosterSizeAtSeasonStart).toBe(3);
  });
});
