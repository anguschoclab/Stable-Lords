import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPlayerOffers, extractWeekSummary, runAutosim } from '@/engine/autosim';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { FightingStyle, type Warrior } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';

function makeWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  const attrs = { ST: 12, CN: 12, SZ: 12, WT: 12, WL: 12, SP: 12, DF: 12 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, FightingStyle.StrikingAttack);
  return {
    id: id as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
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
    ...overrides,
  };
}

function makeOffer(
  id: string,
  warriorIds: string[],
  opts?: Partial<BoutOffer>
): BoutOffer {
  return {
    id: id as BoutOfferId,
    promoterId: 'promoter-1' as any,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: Object.fromEntries(warriorIds.map((w) => [w, 'Pending'])) as any,
    conditions: [],
    ...opts,
  };
}

function makeState(overrides?: Partial<GameState>): GameState {
  const state = createFreshState('test-seed');
  state.treasury = 5000;
  return { ...state, ...overrides };
}

function makeFightSummary(
  title: string,
  winner: 'A' | 'D' | null,
  by: string
): FightSummary {
  return {
    id: 'fight-1' as any,
    week: 1,
    title,
    warriorIdA: 'wA' as WarriorId,
    warriorIdD: 'wD' as WarriorId,
    winner,
    by: by as any,
    styleA: 'StrikingAttack',
    styleD: 'StrikingAttack',
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('processPlayerOffers', () => {
  it('accepts high-hype offer via index', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const w2 = makeWarrior('w2', 'Bob');
    const state = makeState({ roster: [w1, w2] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 150, purse: 50 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Accepted');
  });

  it('accepts high-purse offer via index', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 50, purse: 250 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Accepted');
  });

  it('skips low-value offer', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 50, purse: 50 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Pending');
  });

  it('skips non-Proposed offer', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 200, status: 'Signed' });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Pending');
  });

  it('skips offer with no player warrior in index', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['rival1', 'rival2'], { hype: 200 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([
      ['rival1' as WarriorId, ['offer1' as BoutOfferId]],
      ['rival2' as WarriorId, ['offer1' as BoutOfferId]],
    ]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['rival1' as WarriorId]).toBe('Pending');
  });

  it('deduplicates offer with two player warriors', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const w2 = makeWarrior('w2', 'Bob');
    const state = makeState({ roster: [w1, w2] });
    const offer = makeOffer('offer1', ['w1', 'w2'], { hype: 200 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([
      ['w1' as WarriorId, ['offer1' as BoutOfferId]],
      ['w2' as WarriorId, ['offer1' as BoutOfferId]],
    ]);

    const result = processPlayerOffers(state);
    const responses = result.boutOffers['offer1' as BoutOfferId]!.responses;
    expect(responses['w1' as WarriorId]).toBe('Accepted');
    expect(responses['w2' as WarriorId]).toBe('Pending');
  });

  it('processes multiple offers for same warrior', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer1 = makeOffer('offer1', ['w1', 'rival1'], { hype: 200 });
    const offer2 = makeOffer('offer2', ['w1', 'rival2'], { hype: 200 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer1, ['offer2' as BoutOfferId]: offer2 };
    state.warriorToOfferIds = new Map([
      ['w1' as WarriorId, ['offer1' as BoutOfferId, 'offer2' as BoutOfferId]],
    ]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Accepted');
    expect(result.boutOffers['offer2' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Accepted');
  });

  it('handles empty roster', () => {
    const state = makeState({ roster: [] });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: makeOffer('offer1', ['rival1', 'rival2'], { hype: 200 }) };
    state.warriorToOfferIds = new Map([
      ['rival1' as WarriorId, ['offer1' as BoutOfferId]],
    ]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['rival1' as WarriorId]).toBe('Pending');
  });

  it('handles no offers with index', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    (state as any).boutOffers = {};
    state.warriorToOfferIds = new Map();

    const result = processPlayerOffers(state);
    expect(result.boutOffers).toEqual({});
  });

  it('falls back to scan when index is missing', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 200 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = undefined;

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe('Accepted');
  });

  it('fallback produces same result as indexed path', () => {
    const w1 = makeWarrior('w1', 'Alice');
    const w2 = makeWarrior('w2', 'Bob');

    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 150, purse: 50 });
    const baseState = makeState({ roster: [w1, w2] });
    (baseState as any).boutOffers = { ['offer1' as BoutOfferId]: { ...offer } };

    const indexedState = makeState({ roster: [w1, w2] });
    (indexedState as any).boutOffers = { ['offer1' as BoutOfferId]: { ...offer } };
    indexedState.warriorToOfferIds = new Map([
      ['w1' as WarriorId, ['offer1' as BoutOfferId]],
    ]);

    const scanState = makeState({ roster: [w1, w2] });
    (scanState as any).boutOffers = { ['offer1' as BoutOfferId]: { ...offer } };
    scanState.warriorToOfferIds = undefined;

    const indexedResult = processPlayerOffers(indexedState);
    const scanResult = processPlayerOffers(scanState);

    expect(indexedResult.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId])
      .toBe(scanResult.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]);
  });
});

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn(),
}));

vi.mock('@/engine/pipeline/tick/timeAdvance', () => ({
  TimeAdvanceService: {
    advanceQuarter: vi.fn(),
  },
}));

describe('extractWeekSummary', () => {
  it('extracts death names from kill bouts', () => {
    const state = makeState();
    state.lastSimulationReport = {
      id: 'report-1' as any,
      week: 5,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [
        makeFightSummary('Alice vs Bob', 'A', 'Kill'),
        makeFightSummary('Carol vs Dave', 'D', 'Kill'),
      ],
    };

    const summary = extractWeekSummary(state, 5);
    expect(summary.deathNames).toHaveLength(2);
    expect(summary.deathNames).toContain('Bob');
    expect(summary.deathNames).toContain('Carol');
    expect(summary.deaths).toBe(2);
  });

  it('no kills → empty death names', () => {
    const state = makeState();
    state.lastSimulationReport = {
      id: 'report-1' as any,
      week: 5,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [
        makeFightSummary('Alice vs Bob', 'A', 'KO'),
        makeFightSummary('Carol vs Dave', 'D', 'Exhaustion'),
      ],
    };

    const summary = extractWeekSummary(state, 5);
    expect(summary.deathNames).toEqual([]);
    expect(summary.deaths).toBe(0);
  });

  it('no bouts → empty summary', () => {
    const state = makeState();
    state.lastSimulationReport = undefined;

    const summary = extractWeekSummary(state, 5);
    expect(summary.bouts).toBe(0);
    expect(summary.deaths).toBe(0);
    expect(summary.deathNames).toEqual([]);
  });

  it('no bouts — empty array', () => {
    const state = makeState();
    state.lastSimulationReport = {
      id: 'report-1' as any,
      week: 5,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [],
    };

    const summary = extractWeekSummary(state, 5);
    expect(summary.bouts).toBe(0);
    expect(summary.deaths).toBe(0);
    expect(summary.deathNames).toEqual([]);
  });

  it('correct bout count', () => {
    const state = makeState();
    state.lastSimulationReport = {
      id: 'report-1' as any,
      week: 5,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [
        makeFightSummary('A vs B', 'A', 'KO'),
        makeFightSummary('C vs D', 'D', 'KO'),
        makeFightSummary('E vs F', 'A', 'KO'),
      ],
    };

    const summary = extractWeekSummary(state, 5);
    expect(summary.bouts).toBe(3);
  });

  it('week number passed through', () => {
    const state = makeState();
    state.lastSimulationReport = undefined;

    const summary = extractWeekSummary(state, 42);
    expect(summary.week).toBe(42);
  });

  it('handles missing vs in title', () => {
    const state = makeState();
    state.lastSimulationReport = {
      id: 'report-1' as any,
      week: 5,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [
        makeFightSummary('No Versus In Title', 'A', 'Kill'),
        makeFightSummary('', 'A', 'Kill'), // Empty title
      ],
    };

    const summary = extractWeekSummary(state, 5);
    expect(summary.deathNames).toHaveLength(2);
    expect(summary.deathNames).toContain('Unknown');
    expect(summary.deaths).toBe(2);
  });
});

describe('runAutosim', () => {
  let baseState: GameState;

  beforeEach(() => {
    baseState = makeState({ week: 1, treasury: 5000 });
    vi.clearAllMocks();
  });

  it('runs sequentially up to weeksToSim', async () => {
    vi.mocked(advanceWeek).mockImplementation((state) => ({ ...state, week: state.week + 1 }));

    const onProgress = vi.fn();
    const result = await runAutosim(baseState, { weeksToSim: 3, onProgress });

    expect(advanceWeek).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenLastCalledWith(3, 3);
    expect(result.weeksSimmed).toBe(3);
    expect(result.stopReason).toBe('max_weeks');
    expect(result.weekSummaries).toHaveLength(3);
  });

  it('supports legacy options signature', async () => {
    vi.mocked(advanceWeek).mockImplementation((state) => ({ ...state, week: state.week + 1 }));

    const onProgress = vi.fn();
    const result = await runAutosim(baseState, 2, onProgress);

    expect(advanceWeek).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
    expect(result.weeksSimmed).toBe(2);
    expect(result.stopReason).toBe('max_weeks');
  });

  it('stops on bankruptcy (sequential)', async () => {
    vi.mocked(advanceWeek).mockImplementation((state) => {
      const newState = { ...state, week: state.week + 1 };
      if (newState.week === 3) newState.treasury = BANKRUPTCY_THRESHOLD - 100;
      return newState;
    });

    const result = await runAutosim(baseState, 5);

    expect(advanceWeek).toHaveBeenCalledTimes(2);
    expect(result.weeksSimmed).toBe(2);
    expect(result.stopReason).toBe('bankrupt');
    expect(result.finalState.treasury).toBeLessThan(BANKRUPTCY_THRESHOLD);
  });

  it('runs batch mode for full quarters and remaining weeks', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 13 },
      weeksCompleted: 13,
      stopReason: undefined,
      summaries: Array.from({ length: 13 }, (_, i) => ({
        week: state.week + i,
        bouts: 2,
        deaths: 0,
      })),
    }));

    vi.mocked(advanceWeek).mockImplementation((state) => ({ ...state, week: state.week + 1 }));

    const onProgress = vi.fn();
    const result = await runAutosim(baseState, { weeksToSim: 15, onProgress, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(1);
    expect(advanceWeek).toHaveBeenCalledTimes(2);

    // Batch mode updates progress once per batch end, then sequentially for remainder
    expect(onProgress).toHaveBeenCalled();
    expect(result.weeksSimmed).toBe(15);
    expect(result.stopReason).toBe('max_weeks');
    expect(result.weekSummaries).toHaveLength(15);
    expect(result.weekSummaries[0]!.bouts).toBe(2);
  });

  it('stops on max_weeks when running full quarters exactly (no remainder)', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 13 },
      weeksCompleted: 13,
      stopReason: undefined,
      summaries: Array.from({ length: 13 }, (_, i) => ({
        week: state.week + i,
        bouts: 2,
        deaths: 0,
      })),
    }));

    const result = await runAutosim(baseState, { weeksToSim: 26, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(2);
    expect(advanceWeek).toHaveBeenCalledTimes(0);
    expect(result.weeksSimmed).toBe(26);
    expect(result.stopReason).toBe('max_weeks');
    expect(result.weekSummaries).toHaveLength(26);
  });

  it('runs batch mode without onProgress', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 13 },
      weeksCompleted: 13,
      stopReason: undefined,
      summaries: Array.from({ length: 13 }, (_, i) => ({
        week: state.week + i,
        bouts: 2,
        deaths: 0,
      })),
    }));

    vi.mocked(advanceWeek).mockImplementation((state) => ({ ...state, week: state.week + 1 }));

    // Requesting 15 weeks, so it triggers remaining weeks execution without onProgress
    const result = await runAutosim(baseState, { weeksToSim: 15, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(1);
    expect(advanceWeek).toHaveBeenCalledTimes(2);
    expect(result.weeksSimmed).toBe(15);
  });

  it('stops on bankruptcy (batch mode) after a quarter', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 13, treasury: BANKRUPTCY_THRESHOLD - 100 },
      weeksCompleted: 13,
      stopReason: undefined,
      summaries: Array.from({ length: 13 }, (_, i) => ({
        week: state.week + i,
        bouts: 0,
        deaths: 0,
      })),
    }));

    const result = await runAutosim(baseState, { weeksToSim: 26, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(1);
    expect(result.weeksSimmed).toBe(13);
    expect(result.stopReason).toBe('bankrupt');
    expect(result.finalState.treasury).toBeLessThan(BANKRUPTCY_THRESHOLD);
  });

  it('stops on internal TimeAdvanceService condition', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 5 },
      weeksCompleted: 5,
      stopReason: 'roster_empty',
      summaries: Array.from({ length: 5 }, (_, i) => ({
        week: state.week + i,
        bouts: 0,
        deaths: 0,
      })),
    }));

    const result = await runAutosim(baseState, { weeksToSim: 13, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(1);
    expect(result.weeksSimmed).toBe(5);
    expect(result.stopReason).toBe('no_pairings'); // maps from roster_empty
  });

  it('maps custom_condition to injury stop reason', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 5 },
      weeksCompleted: 5,
      stopReason: 'custom_condition',
      summaries: Array.from({ length: 5 }, (_, i) => ({
        week: state.week + i,
        bouts: 0,
        deaths: 0,
      })),
    }));

    const result = await runAutosim(baseState, { weeksToSim: 13, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(1);
    expect(result.weeksSimmed).toBe(5);
    expect(result.stopReason).toBe('injury'); // maps from custom_condition
  });

  it('maps unknown condition to max_weeks', async () => {
    vi.mocked(TimeAdvanceService.advanceQuarter).mockImplementation(async (state) => ({
      state: { ...state, week: state.week + 5 },
      weeksCompleted: 5,
      stopReason: 'something_weird',
      summaries: Array.from({ length: 5 }, (_, i) => ({
        week: state.week + i,
        bouts: 0,
        deaths: 0,
      })),
    }));

    const result = await runAutosim(baseState, { weeksToSim: 13, useBatchMode: true });

    expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledTimes(1);
    expect(result.weeksSimmed).toBe(5);
    expect(result.stopReason).toBe('max_weeks'); // falls back to max_weeks
  });
});
