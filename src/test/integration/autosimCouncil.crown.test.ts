import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAutosim } from '@/engine/autosim/autosim';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { makeAutosimWarrior } from '@/test/_setup/testHelpers';
import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import {
  makeBoutOffer as fixtureBoutOffer,
  makeGameState as fixtureGameState,
} from '@/test/_fixtures/factories';

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn(async (state: GameState) => state),
}));

/** Offer scheduled for the upcoming week (absoluteWeek 1 → boutWeek 2). */
const makeOffer = (id: string, warriorIds: string[], opts?: Partial<BoutOffer>): BoutOffer =>
  fixtureBoutOffer({
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
  } as any);

const makeSimmableState = (overrides?: Partial<GameState>): GameState =>
  fixtureGameState({
    treasury: 5000,
    roster: [makeAutosimWarrior('w1', 'Alice'), makeAutosimWarrior('w2', 'Bob')],
    ...overrides,
  });

describe('runAutosim councilAutoPilot — crown decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.mocked(advanceWeek).mockImplementation(async (state: GameState) => state);
  });

  it('accepts a title-defense offer for a reigning player champion despite a thin purse', async () => {
    const state = makeSimmableState();
    (state as any).arenaChampions = {
      iron_forge: {
        champion: {
          warriorId: 'w1',
          startedAbsoluteWeek: 1,
          defenses: 0,
          lastActivityWeek: 1,
        },
        status: 'active',
        history: [],
        refusals: 0,
        deferrals: 0,
      },
    };
    // Purse 10 — far below any purse-driven heuristic; the title stakes carry it.
    const offer = makeOffer('offer1', ['w1', 'rival1'], {
      titleArenaId: 'iron_forge',
      arenaId: 'iron_forge',
      purse: 10,
    });
    (state as any).boutOffers = { offer1: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = await runAutosim(state, { weeksToSim: 1, councilAutoPilot: true });
    expect(
      result.finalState.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]
    ).toBe('Accepted');
  });

  it('accepts a title-shot offer for a healthy contender', async () => {
    const state = makeSimmableState();
    const offer = makeOffer('offer1', ['w1', 'rival1'], {
      titleArenaId: 'iron_forge',
      arenaId: 'iron_forge',
      purse: 10,
    });
    (state as any).boutOffers = { offer1: offer };
    state.warriorToOfferIds = new Map([['w1' as WarriorId, ['offer1' as BoutOfferId]]]);

    const result = await runAutosim(state, { weeksToSim: 1, councilAutoPilot: true });
    expect(
      result.finalState.boutOffers['offer1' as BoutOfferId]!.responses['w1' as WarriorId]
    ).toBe('Accepted');
  });
});
