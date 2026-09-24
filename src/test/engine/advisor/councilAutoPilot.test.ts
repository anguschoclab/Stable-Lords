import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAutosim } from '@/engine/autosim';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';
import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn(async (state: GameState) => state),
}));

function makeState(overrides?: Partial<GameState>): GameState {
  const state = createFreshState('test-seed');
  state.treasury = 5000;
  return { ...state, ...overrides };
}

/** Offer scheduled for the upcoming week (absoluteWeek 1 → boutWeek 2). */
function makeOffer(id: string, warriorIds: string[], opts?: Partial<BoutOffer>): BoutOffer {
  return {
    id: id as BoutOfferId,
    promoterId: 'promoter-1' as any,
    warriorIds: warriorIds as WarriorId[],
    boutWeek: 2,
    expirationWeek: 3,
    purse: 50,
    hype: 50,
    status: 'Proposed',
    responses: Object.fromEntries(warriorIds.map((w) => [w, 'Pending'])) as any,
    conditions: [],
    ...opts,
  };
}

function makeSimmableState(overrides?: Partial<GameState>): GameState {
  return makeState({
    roster: [makeAutosimWarrior('w1', 'Alice'), makeAutosimWarrior('w2', 'Bob')],
    ...overrides,
  });
}

describe('runAutosim councilAutoPilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.mocked(advanceWeek).mockImplementation(async (state: GameState) => state);
  });

  it('applies council training assignments to every active warrior', async () => {
    const state = makeSimmableState();
    const result = await runAutosim(state, { weeksToSim: 1, councilAutoPilot: true });

    const assigned = new Set(
      (result.finalState.trainingAssignments ?? []).map((a) => a.warriorId)
    );
    expect(assigned.has('w1' as WarriorId)).toBe(true);
    expect(assigned.has('w2' as WarriorId)).toBe(true);
  });

  it('accepts a council-recommended offer the hype/purse heuristic would skip', async () => {
    // hype 50 / purse 50 is below the old hype>100||purse>200 gate, but the
    // council scores a safe offer ~55 → ACCEPT_OFFER.
    const state = makeSimmableState();
    const offer = makeOffer('offer1', ['w1', 'rival1']);
    (state as any).boutOffers = { offer1: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = await runAutosim(state, { weeksToSim: 1, councilAutoPilot: true });
    expect(result.finalState.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
  });

  it('declines a lethal offer the old heuristic would have accepted', async () => {
    const killer = makeAutosimWarrior('rival1', 'Mangler');
    (killer as any).career = { ...(killer as any).career, kills: 3 };
    const state = makeSimmableState({
      rivals: [{ id: 'rs1', roster: [killer], owner: { stableName: 'Rivals' } } as any],
    });
    // hype 200 clears the old heuristic but the council sees career kills → LETHAL.
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 200, purse: 300 });
    (state as any).boutOffers = { offer1: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = await runAutosim(state, { weeksToSim: 1, councilAutoPilot: true });
    expect(result.finalState.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Pending'
    );
  });

  it('patches warrior fight plans with council tactics', async () => {
    const state = makeSimmableState();
    const result = await runAutosim(state, { weeksToSim: 1, councilAutoPilot: true });

    const w1 = result.finalState.roster.find((w) => w.id === ('w1' as WarriorId))!;
    expect(w1.plan).toBeDefined();
    expect(typeof w1.plan!.OE).toBe('number');
    expect(w1.plan!.OE).toBeGreaterThanOrEqual(1);
    expect(w1.plan!.OE).toBeLessThanOrEqual(10);
  });

  it('keeps the hype/purse heuristic when councilAutoPilot is not set', async () => {
    const state = makeSimmableState();
    const offer = makeOffer('offer1', ['w1', 'rival1'], { hype: 200 });
    (state as any).boutOffers = { offer1: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = await runAutosim(state, { weeksToSim: 1 });
    expect(result.finalState.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]).toBe(
      'Accepted'
    );
    // No council application → no auto training assignments.
    expect(result.finalState.trainingAssignments ?? []).toHaveLength(0);
  });
});
