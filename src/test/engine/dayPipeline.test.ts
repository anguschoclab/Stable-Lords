import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceDay } from '@/engine/dayPipeline';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import type { GameState } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn(),
}));

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: vi.fn(),
  },
}));

describe('advanceDay', () => {
  let baseState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    baseState = {
      year: 1,
      week: 1,
      day: 0,
      season: 'Spring',
      isTournamentWeek: false,
      activeTournamentId: undefined,
      newsletter: [],
      // Mock other required fields if needed
    } as unknown as GameState;
  });

  it('increments day by 1 on a regular day', () => {
    const newState = advanceDay(baseState);
    expect(newState.day).toBe(1);
    expect(newState.isTournamentWeek).toBe(false);
    expect(advanceWeek).not.toHaveBeenCalled();
    expect(TournamentSelectionService.resolveRound).not.toHaveBeenCalled();
  });

  it('calls advanceWeek and resets day when transitioning from day 6 to day 7', () => {
    baseState.day = 6;

    // Mock the result of advanceWeek
    const mockedWeekResult = {
      ...baseState,
      week: 2,
      day: 7 // advanceWeek usually increments week
    } as unknown as GameState;

    vi.mocked(advanceWeek).mockReturnValue(mockedWeekResult);

    const newState = advanceDay(baseState);

    expect(advanceWeek).toHaveBeenCalledWith(baseState);

    // verify the final output is based on the result of advanceWeek, but day reset to 0
    expect(newState.day).toBe(0);
    expect(newState.week).toBe(2);
    expect(newState.isTournamentWeek).toBe(false);
    expect(newState.activeTournamentId).toBeUndefined();
  });

  it('handles tournament days correctly', () => {
    baseState.day = 2;
    baseState.isTournamentWeek = true;
    baseState.activeTournamentId = 'tournament_1' as TournamentId;

    const roundResultsMock = ['Match 1: Alice won', 'Match 2: Bob won'];
    const updatedStateMock = {
      ...baseState,
      someOtherFieldUpdatedByTournament: true
    } as unknown as GameState;

    vi.mocked(TournamentSelectionService.resolveRound).mockReturnValue({
      updatedState: updatedStateMock,
      roundResults: roundResultsMock
    });

    const newState = advanceDay(baseState);

    expect(TournamentSelectionService.resolveRound).toHaveBeenCalledWith(
      baseState,
      'tournament_1',
      expect.any(Number) // 1*100 + 3 = 103
    );

    // Verify day is incremented on the updated state
    expect(newState.day).toBe(3);

    // Verify newsletter is updated
    expect(newState.newsletter).toBeDefined();
    expect(newState.newsletter?.length).toBe(1);
    expect(newState.newsletter?.[0].items).toEqual(roundResultsMock);
    expect(newState.newsletter?.[0].title).toBe('Empire Day 3: Tournament Results');
    expect(newState.newsletter?.[0].week).toBe(1);
  });

  it('does not add newsletter item if tournament resolveRound returns empty roundResults', () => {
    baseState.day = 2;
    baseState.isTournamentWeek = true;
    baseState.activeTournamentId = 'tournament_1' as TournamentId;

    vi.mocked(TournamentSelectionService.resolveRound).mockReturnValue({
      updatedState: { ...baseState } as unknown as GameState,
      roundResults: []
    });

    const newState = advanceDay(baseState);

    expect(newState.newsletter).toEqual([]);
  });

  it('generates deterministic seeds based on year, week, and next day', () => {
    baseState.year = 2;
    baseState.week = 5;
    baseState.day = 3;
    baseState.isTournamentWeek = true;
    baseState.activeTournamentId = 'tournament_2' as TournamentId;

    vi.mocked(TournamentSelectionService.resolveRound).mockReturnValue({
      updatedState: baseState,
      roundResults: []
    });

    advanceDay(baseState);

    // nextDay = 4
    // Note: TickOrchestrator uses state.week * 100 + nextDay for TournamentSelectionService.resolveRound
    // 5 * 100 + 4 = 504
    expect(TournamentSelectionService.resolveRound).toHaveBeenCalledWith(
      baseState,
      'tournament_2',
      504
    );
  });
});
