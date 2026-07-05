import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPlayerOffers, extractWeekSummary, runAutosim } from '@/engine/autosim';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import type { FightSummary } from '@/types/combat.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn((state: GameState) => state),
}));

function makeOffer(id: string, warriorIds: string[], opts?: Partial<BoutOffer>): BoutOffer {
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

function makeFightSummary(title: string, winner: 'A' | 'D' | null, by: string): FightSummary {
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
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const w2 = makeAutosimWarrior('w2', 'Bob');
    const state = makeState({ roster: [w1, w2] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 150, purse: 50 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
  });

  it('accepts high-purse offer via index', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 50, purse: 250 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
  });

  it('skips low-value offer', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 50, purse: 50 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Pending'
    );
  });

  it('skips non-Proposed offer', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 200, status: 'Signed' });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Pending'
    );
  });

  it('skips offer with no player warrior in index', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['rival1', 'rival2'], { hype: 200 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = new Map([
      ['rival1' as WarriorId, ['offer1' as BoutOfferId]],
      ['rival2' as WarriorId, ['offer1' as BoutOfferId]],
    ]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['rival1' as WarriorId]).toBe(
      'Pending'
    );
  });

  it('deduplicates offer with two player warriors', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const w2 = makeAutosimWarrior('w2', 'Bob');
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
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer1 = makeOffer('offer1', ['w1', 'rival1'], { hype: 200 });
    const offer2 = makeOffer('offer2', ['w1', 'rival2'], { hype: 200 });
    (state as any).boutOffers = {
      ['offer1' as BoutOfferId]: offer1,
      ['offer2' as BoutOfferId]: offer2,
    };
    state.warriorToOfferIds = new Map([
      ['w1' as WarriorId, ['offer1' as BoutOfferId, 'offer2' as BoutOfferId]],
    ]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
    expect(result.boutOffers['offer2' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
  });

  it('handles empty roster', () => {
    const state = makeState({ roster: [] });
    (state as any).boutOffers = {
      ['offer1' as BoutOfferId]: makeOffer('offer1', ['rival1', 'rival2'], { hype: 200 }),
    };
    state.warriorToOfferIds = new Map([['rival1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['rival1' as WarriorId]).toBe(
      'Pending'
    );
  });

  it('handles no offers with index', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    (state as any).boutOffers = {};
    state.warriorToOfferIds = new Map();

    const result = processPlayerOffers(state);
    expect(result.boutOffers).toEqual({});
  });

  it('falls back to scan when index is missing', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const state = makeState({ roster: [w1] });
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 200 });
    (state as any).boutOffers = { ['offer1' as BoutOfferId]: offer };
    state.warriorToOfferIds = undefined;

    const result = processPlayerOffers(state);
    expect(result.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
  });

  it('fallback produces same result as indexed path', () => {
    const w1 = makeAutosimWarrior('w1', 'Alice');
    const w2 = makeAutosimWarrior('w2', 'Bob');

    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 150, purse: 50 });
    const baseState = makeState({ roster: [w1, w2] });
    (baseState as any).boutOffers = { ['offer1' as BoutOfferId]: { ...offer } };

    const indexedState = makeState({ roster: [w1, w2] });
    (indexedState as any).boutOffers = { ['offer1' as BoutOfferId]: { ...offer } };
    indexedState.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const scanState = makeState({ roster: [w1, w2] });
    (scanState as any).boutOffers = { ['offer1' as BoutOfferId]: { ...offer } };
    scanState.warriorToOfferIds = undefined;

    const indexedResult = processPlayerOffers(indexedState);
    const scanResult = processPlayerOffers(scanState);

    expect(indexedResult.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      scanResult.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]
    );
  });
});

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
      bouts: [makeFightSummary('Alice versus Bob', 'A', 'Kill')],
    };

    const summary = extractWeekSummary(state, 5);
    expect(summary.deaths).toBe(1);
    expect(summary.deathNames).toHaveLength(1);
    expect(summary.deathNames).toContain('Unknown');
  });
});

const mockQuarterSummary = {
  startWeek: 1,
  endWeek: 13,
  startYear: 1,
  endYear: 1,
  treasuryDelta: 0,
  weekSummaries: [],
};

describe('runAutosim', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs sequentially up to weeksToSim', async () => {
    const spy = vi.mocked(advanceWeek);
    spy.mockImplementation((state: GameState) => state);

    const state = makeState();
    const onProgress = vi.fn();
    const result = await runAutosim(state, { weeksToSim: 3, onProgress });

    expect(result.weeksSimmed).toBe(3);
    expect(result.stopReason).toBe('max_weeks');
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('supports legacy options signature', async () => {
    const spy = vi.mocked(advanceWeek);
    spy.mockImplementation((state: GameState) => state);

    const state = makeState();
    const onProgress = vi.fn();
    const result = await runAutosim(state, 2, onProgress);

    expect(result.weeksSimmed).toBe(2);
    expect(result.stopReason).toBe('max_weeks');
    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  it('stops on bankruptcy (sequential)', async () => {
    const spy = vi.mocked(advanceWeek);
    let callCount = 0;
    spy.mockImplementation((state: GameState) => {
      callCount++;
      if (callCount === 2) {
        return { ...state, treasury: BANKRUPTCY_THRESHOLD - 1 };
      }
      return state;
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 10 });

    expect(result.weeksSimmed).toBe(2);
    expect(result.stopReason).toBe('bankrupt');
  });

  it('runs batch mode for full quarters and remaining weeks', async () => {
    const weekSpy = vi.mocked(advanceWeek);
    weekSpy.mockImplementation((state: GameState) => state);

    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: makeState(),
      weeksCompleted: 13,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: null,
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 15, useBatchMode: true });

    expect(result.weeksSimmed).toBe(15);
    expect(quarterSpy).toHaveBeenCalledTimes(1);
  });

  it('stops on max_weeks when running full quarters exactly (no remainder)', async () => {
    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: makeState(),
      weeksCompleted: 13,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: null,
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 26, useBatchMode: true });

    expect(result.weeksSimmed).toBe(26);
    expect(result.stopReason).toBe('max_weeks');
    expect(quarterSpy).toHaveBeenCalledTimes(2);
  });

  it('runs batch mode without onProgress', async () => {
    const weekSpy = vi.mocked(advanceWeek);
    weekSpy.mockImplementation((state: GameState) => state);

    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: makeState(),
      weeksCompleted: 13,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: null,
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 13, useBatchMode: true });

    expect(result.weeksSimmed).toBe(13);
    expect(result.stopReason).toBe('max_weeks');
  });

  it('stops on bankruptcy (batch mode) after a quarter', async () => {
    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: { ...makeState(), treasury: BANKRUPTCY_THRESHOLD - 1 },
      weeksCompleted: 13,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: null,
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 26, useBatchMode: true });

    expect(result.weeksSimmed).toBe(13);
    expect(result.stopReason).toBe('bankrupt');
  });

  it('stops on internal TimeAdvanceService condition', async () => {
    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: makeState(),
      weeksCompleted: 5,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: 'roster_empty',
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 26, useBatchMode: true });

    expect(result.weeksSimmed).toBe(5);
    expect(result.stopReason).toBe('no_pairings');
  });

  it('maps custom_condition to injury stop reason', async () => {
    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: makeState(),
      weeksCompleted: 3,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: 'custom_condition',
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 26, useBatchMode: true });

    expect(result.stopReason).toBe('injury');
  });

  it('maps unknown condition to max_weeks', async () => {
    const quarterSpy = vi.spyOn(TimeAdvanceService, 'advanceQuarter');
    quarterSpy.mockResolvedValue({
      state: makeState(),
      weeksCompleted: 3,
      summaries: [],
      quarterSummary: mockQuarterSummary,
      stopReason: 'some_unknown_reason',
    });

    const state = makeState();
    const result = await runAutosim(state, { weeksToSim: 26, useBatchMode: true });

    expect(result.stopReason).toBe('max_weeks');
  });
});
