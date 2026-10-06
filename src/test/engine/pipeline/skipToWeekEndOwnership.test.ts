import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: vi.fn((state: unknown) => ({
      updatedState: state,
      roundResults: [],
      isComplete: false,
    })),
    sweepUnfinishedTournaments: vi.fn((state: unknown) => state),
  },
}));

import { TickOrchestrator } from '@/engine/pipeline/tick/TickOrchestrator';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import * as weekPipelineService from '@/engine/pipeline/services/weekPipelineService';
import type { GameState } from '@/types/state.types';

/**
 * skipToWeekEnd ownership contract:
 *  - It accepts WeekAdvanceOptions and threads `mutableInput` (and `headless`)
 *    into the weekly pipeline — the worker entry grants ownership of its
 *    postMessage-deserialized input, so no boundary structuredClone should run.
 *  - `advanceDay`'s day-7 weekly handoff forwards the caller's options (incl.
 *    `headless`) rather than dropping them.
 */
describe('skipToWeekEnd ownership threading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards mutableInput/headless into the weekly pipeline', async () => {
    const spy = vi
      .spyOn(weekPipelineService, 'advanceWeek')
      .mockImplementation(async (s: GameState) => s);
    const state = createFreshState('skip-ownership');
    state.isTournamentWeek = false;

    await TickOrchestrator.skipToWeekEnd(state, { mutableInput: true, headless: true });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ week: state.week }),
      expect.objectContaining({ mutableInput: true, headless: true })
    );
  });

  it('skips the boundary structuredClone when mutableInput is granted (integration)', async () => {
    const cloneSpy = vi.spyOn(globalThis, 'structuredClone');
    const state = populateInitialWorld(createFreshState('skip-clone'), 4242);
    state.isTournamentWeek = false;
    const rosterRef = state.roster;
    cloneSpy.mockClear();

    await TickOrchestrator.skipToWeekEnd(state, { mutableInput: true, headless: true });

    // Boundary clones copy the week state — identified by carrying this
    // exact roster reference. In-pipeline clones (e.g. graveyard snapshots)
    // clone warriors, not state, so they don't match this filter.
    const boundaryClones = cloneSpy.mock.calls.filter(
      ([arg]) => (arg as { roster?: unknown })?.roster === rosterRef
    ).length;
    expect(boundaryClones).toBe(0);
  }, 60000);

  it('still clones by default when the caller retains ownership', async () => {
    const cloneSpy = vi.spyOn(globalThis, 'structuredClone');
    const state = populateInitialWorld(createFreshState('skip-clone-default'), 4242);
    state.isTournamentWeek = false;
    const rosterRef = state.roster;
    cloneSpy.mockClear();

    await TickOrchestrator.skipToWeekEnd(state, { headless: true });

    const boundaryClones = cloneSpy.mock.calls.filter(
      ([arg]) => (arg as { roster?: unknown })?.roster === rosterRef
    ).length;
    expect(boundaryClones).toBeGreaterThanOrEqual(1);
  }, 60000);

  it('advanceDay forwards headless+mutableInput at the day-7 weekly handoff', async () => {
    const spy = vi
      .spyOn(weekPipelineService, 'advanceWeek')
      .mockImplementation(async (s: GameState) => s);
    const state = createFreshState('day7-opts');
    state.day = 6;

    await TickOrchestrator.advanceDay(state, { mutableInput: true, headless: true });

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mutableInput: true, headless: true })
    );
  });
});
