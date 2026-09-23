import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: vi.fn((state: unknown) => ({
      updatedState: state,
      roundResults: [],
      isComplete: false,
    })),
  },
}));

import {
  TickOrchestrator,
  tournamentDaySeed,
} from '@/engine/pipeline/tick/TickOrchestrator';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import * as weekPipelineService from '@/engine/pipeline/services/weekPipelineService';
import type { GameState } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';

/**
 * Regression guard for the day-path seed divergence (audit finding #6):
 * advanceDay and skipToWeekEnd must resolve the same calendar day with the
 * same seed — both go through resolveTournamentDay → tournamentDaySeed
 * (year*10000 + week*100 + day). Before unification they used different
 * formulas and produced different tournament outcomes for identical days.
 */
describe('tournament day seed parity', () => {
  let state: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(
      async (s: GameState) => s
    );
    state = createFreshState('seed-parity');
    state.day = 2;
    state.week = 9;
    state.year = 3;
    state.isTournamentWeek = true;
    state.activeTournamentId = 'tour-parity' as TournamentId;
    state.tournaments = [{ id: 'tour-parity', completed: false }] as never;
  });

  it('advanceDay resolves the next day with tournamentDaySeed(year, week, day)', async () => {
    await TickOrchestrator.advanceDay(state);

    expect(TournamentSelectionService.resolveRound).toHaveBeenCalledTimes(1);
    expect(vi.mocked(TournamentSelectionService.resolveRound).mock.calls[0]?.[2]).toBe(
      tournamentDaySeed(3, 9, 3)
    );
  });

  it('skipToWeekEnd resolves each remaining day with the same seed formula', async () => {
    await TickOrchestrator.skipToWeekEnd(state);

    const seeds = vi
      .mocked(TournamentSelectionService.resolveRound)
      .mock.calls.map((c) => c[2]);
    expect(seeds).toEqual([
      tournamentDaySeed(3, 9, 3),
      tournamentDaySeed(3, 9, 4),
      tournamentDaySeed(3, 9, 5),
      tournamentDaySeed(3, 9, 6),
    ]);
  });

  it('the same calendar day gets the same seed on both paths', async () => {
    // advanceDay resolves day 3; skipToWeekEnd's first round is also day 3.
    await TickOrchestrator.advanceDay(state);
    const daySeed = vi.mocked(TournamentSelectionService.resolveRound).mock.calls[0]?.[2];

    vi.mocked(TournamentSelectionService.resolveRound).mockClear();
    await TickOrchestrator.skipToWeekEnd(state);
    const skipSeed = vi.mocked(TournamentSelectionService.resolveRound).mock.calls[0]?.[2];

    expect(skipSeed).toBe(daySeed);
    // And the formula is year-qualified — the pre-unification bug dropped it.
    expect(daySeed).toBe(3 * 10000 + 9 * 100 + 3);
  });
});
