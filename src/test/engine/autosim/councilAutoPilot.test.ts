import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAutosim } from '@/engine/autosim/autosim';
import { applyWarriorPayload } from '@/engine/advisor/applyCouncilPlan';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import type { GameState } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';
import { makeAutosimOffer, makeSimmableState } from '@/test/_fixtures/autosimCouncil';

vi.mock('@/engine/pipeline/services/weekPipelineService', async () => await import('@/test/_mocks/weekPipeline'));

const makeOffer = makeAutosimOffer;


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

describe('applyWarriorPayload — tactics conditions merge', () => {
  it('appends suggested conditions without stomping authored ones', () => {
    const state = makeSimmableState();
    const authored = {
      trigger: { type: 'HP_BELOW' as const, value: 30 },
      override: { OE: 2 },
      label: 'Player-authored survival',
    };
    const w = state.roster.find((x) => x.id === ('w1' as WarriorId))!;
    w.plan = { style: w.style, OE: 6, AL: 6, killDesire: 5, conditions: [authored] } as any;

    applyWarriorPayload(state, {
      warriorId: 'w1' as WarriorId,
      tacticsPlanPatch: {
        OE: 7,
        conditions: [
          {
            trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 },
            override: { AL: 8, OE: 4 },
            label: 'Shell up when they seize tempo',
          },
        ],
      },
    });

    const plan = w.plan!;
    expect(plan.OE).toBe(7);
    expect(plan.conditions).toHaveLength(2);
    expect(plan.conditions!.some((c) => c.label === 'Player-authored survival')).toBe(true);
    expect(
      plan.conditions!.some((c) => c.trigger.type === 'OPPONENT_MOMENTUM_LEAD')
    ).toBe(true);
  });

  it('does not duplicate a trigger type the authored plan already covers', () => {
    const state = makeSimmableState();
    const w = state.roster.find((x) => x.id === ('w1' as WarriorId))!;
    w.plan = {
      style: w.style,
      OE: 6,
      AL: 6,
      killDesire: 5,
      conditions: [
        {
          trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 3 },
          override: { AL: 9 },
          label: 'Authored shell',
        },
      ],
    } as any;

    applyWarriorPayload(state, {
      warriorId: 'w1' as WarriorId,
      tacticsPlanPatch: {
        conditions: [
          { trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 }, override: { AL: 8 } },
          { trigger: { type: 'OPPONENT_HP_BELOW', value: 30 }, override: { killDesire: 9 } },
        ],
      },
    });

    const types = w.plan!.conditions!.map((c) => c.trigger.type);
    expect(types.filter((t) => t === 'OPPONENT_MOMENTUM_LEAD')).toHaveLength(1);
    // The authored shell is preserved verbatim — not overwritten.
    expect(w.plan!.conditions!.find((c) => c.trigger.type === 'OPPONENT_MOMENTUM_LEAD')!.trigger.value).toBe(3);
    expect(types).toContain('OPPONENT_HP_BELOW');
  });
});
