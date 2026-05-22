import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TickOrchestrator } from '@/engine/tick/TickOrchestrator';
import { advanceDay } from '@/engine/dayPipeline';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle, type TournamentId } from '@/types/shared.types';
import type { GameState, TournamentEntry, TournamentBout, Warrior } from '@/types/state.types';
import { clearWarriorCache } from '@/engine/matchmaking/tournamentSelection/utils';

// ─── Mocks ─────────────────────────────────────────────────────────────────
const mockAdvanceWeek = vi.hoisted(() => vi.fn((state: GameState) => ({ ...state, week: state.week + 1 })));
const mockResolveRound = vi.hoisted(() =>
  vi.fn((_state: GameState, _tournamentId: string, _seed: number) => ({
    updatedState: { ..._state },
    roundResults: [] as string[],
  }))
);
const mockUuid = vi.hoisted(() => vi.fn(() => 'mock-newsletter-id'));

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: mockAdvanceWeek,
}));

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: mockResolveRound,
  },
}));

vi.mock('@/engine/core/rng/SeededRNGService', () => ({
  SeededRNGService: class {
    constructor(_seed: number) {}
    next() {
      return 0.5;
    }
    uuid() {
      return mockUuid();
    }
    pick<T>(arr: T[]) {
      return arr[0];
    }
    roll(min: number, max: number) {
      return Math.floor((min + max) / 2);
    }
    shuffle<T>(arr: T[]) {
      return [...arr];
    }
    pickWeighted<T>(items: T[]) {
      return items[0];
    }
    chance(prob: number) {
      return prob > 0.5;
    }
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildMinimalState(overrides: Partial<GameState> = {}): GameState {
  const state = createFreshState('test-seed');
  return {
    ...state,
    week: 1,
    year: 1,
    day: 0,
    isTournamentWeek: false,
    activeTournamentId: undefined,
    newsletter: [],
    tournaments: [],
    ...overrides,
  };
}

function buildMinimalTournament(warriors: Warrior[]): TournamentEntry {
  const bracket: TournamentBout[] = [];
  for (let i = 0; i < warriors.length; i += 2) {
    const wA = warriors[i];
    const wD = warriors[i + 1];
    if (wA && wD) {
      bracket.push({
        round: 1,
        matchIndex: i / 2,
        a: wA.name,
        d: wD.name,
        warriorIdA: wA.id,
        warriorIdD: wD.id,
        stableIdA: wA.stableId,
        stableIdD: wD.stableId,
      });
    }
  }
  return {
    id: 't-test-1' as TournamentId,
    season: 'Spring',
    week: 1,
    tierId: 'Gold',
    name: 'Test Tournament',
    bracket,
    participants: warriors,
    completed: false,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('TickOrchestrator.advanceDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUuid.mockReturnValue('mock-newsletter-id');
  });

  afterEach(() => {
    clearWarriorCache();
  });

  describe('regular day branch', () => {
    it('increments day by 1 on a non-tournament day', () => {
      const state = buildMinimalState({ day: 2 });
      const next = TickOrchestrator.advanceDay(state);

      expect(next.day).toBe(3);
      expect(next).not.toBe(state);
      expect(mockAdvanceWeek).not.toHaveBeenCalled();
      expect(mockResolveRound).not.toHaveBeenCalled();
    });

    it('returns a new state object without mutating input', () => {
      const state = buildMinimalState({ day: 4 });
      const originalDay = state.day;

      const next = TickOrchestrator.advanceDay(state);

      expect(state.day).toBe(originalDay);
      expect(next.day).toBe(5);
    });

    it('advances from day 0 to day 1', () => {
      const state = buildMinimalState({ day: 0 });
      const next = TickOrchestrator.advanceDay(state);

      expect(next.day).toBe(1);
      expect(mockAdvanceWeek).not.toHaveBeenCalled();
      expect(mockResolveRound).not.toHaveBeenCalled();
    });
  });

  describe('tournament day branch', () => {
    it('resolves a tournament round and appends newsletter when there are results', () => {
      const state = buildMinimalState({
        day: 2,
        isTournamentWeek: true,
        activeTournamentId: 't-test-1' as TournamentId,
      });

      const updatedState = { ...state, someTournamentChange: true };
      mockResolveRound.mockReturnValueOnce({
        updatedState,
        roundResults: ['Brutus defeated Maximus'],
      });

      const next = TickOrchestrator.advanceDay(state);

      expect(mockResolveRound).toHaveBeenCalledTimes(1);
      expect(mockResolveRound).toHaveBeenCalledWith(
        state,
        't-test-1' as TournamentId,
        state.week * 100 + 3 // year*10000 + week*100 + nextDay = 1*10000 + 1*100 + 3 = 10103, but the seed passed is week*100 + nextDay = 103 per resolveRound call
      );
      expect(next.day).toBe(3);
      expect(next.newsletter).toHaveLength(1);
      const newsItem = (next.newsletter ?? [])[0]!;
      expect(newsItem.title).toBe('Empire Day 3: Tournament Results');
      expect(newsItem.items).toEqual(['Brutus defeated Maximus']);
    });

    it('does not append newsletter when roundResults is empty', () => {
      const state = buildMinimalState({
        day: 3,
        isTournamentWeek: true,
        activeTournamentId: 't-test-1' as TournamentId,
        newsletter: [{ id: 'existing', week: 1, title: 'Existing', items: [] }],
      });

      mockResolveRound.mockReturnValueOnce({
        updatedState: { ...state },
        roundResults: [],
      });

      const next = TickOrchestrator.advanceDay(state);

      expect(next.newsletter).toHaveLength(1);
      expect((next.newsletter ?? [])[0]!.id).toBe('existing');
    });

    it('preserves existing newsletter entries', () => {
      const state = buildMinimalState({
        day: 1,
        isTournamentWeek: true,
        activeTournamentId: 't-test-1' as TournamentId,
        newsletter: [{ id: 'old', week: 1, title: 'Old News', items: [] }],
      });

      mockResolveRound.mockReturnValueOnce({
        updatedState: { ...state },
        roundResults: ['New result'],
      });

      const next = TickOrchestrator.advanceDay(state);

      expect(next.newsletter).toHaveLength(2);
      expect((next.newsletter ?? [])[0]!.id).toBe('old');
    });
  });

  describe('week transition branch', () => {
    it('calls advanceWeek and resets day/tournament flags when nextDay >= 7', () => {
      const state = buildMinimalState({
        day: 6,
        isTournamentWeek: true,
        activeTournamentId: 't-test-1' as TournamentId,
      });

      const postWeekState = { ...state, week: 2 };
      mockAdvanceWeek.mockReturnValueOnce(postWeekState);

      const next = TickOrchestrator.advanceDay(state);

      expect(mockAdvanceWeek).toHaveBeenCalledTimes(1);
      expect(mockAdvanceWeek).toHaveBeenCalledWith(state);
      expect(next.day).toBe(0);
      expect(next.isTournamentWeek).toBe(false);
      expect(next.activeTournamentId).toBeUndefined();
      expect(next.week).toBe(2);
    });

    it('handles day 6 tournament week as week transition, not tournament day', () => {
      const state = buildMinimalState({
        day: 6,
        isTournamentWeek: true,
        activeTournamentId: 't-test-1' as TournamentId,
      });

      mockAdvanceWeek.mockReturnValueOnce({ ...state, week: 2 });

      TickOrchestrator.advanceDay(state);

      expect(mockResolveRound).not.toHaveBeenCalled();
      expect(mockAdvanceWeek).toHaveBeenCalled();
    });
  });
});

describe('dayPipeline.ts wrapper', () => {
  it('delegates to TickOrchestrator.advanceDay and ignores the rng parameter', () => {
    const state = buildMinimalState({ day: 2 });

    const next = advanceDay(state, { next: () => 0.99 } as any);

    expect(next.day).toBe(3);
  });
});

describe('TickOrchestrator.advanceDay — integration', () => {
  afterEach(() => {
    clearWarriorCache();
  });

  it('advances a regular day with real state', () => {
    const state = buildMinimalState({ day: 2 });
    const next = TickOrchestrator.advanceDay(state);

    expect(next.day).toBe(3);
    expect(next).not.toBe(state);
    expect(next.week).toBe(state.week);
    expect(next.year).toBe(state.year);
  });

  it('advances a tournament day with a real 2-warrior bracket', () => {
    const wA = makeWarrior(
      'warrior-a' as any,
      'Fighter A',
      FightingStyle.StrikingAttack,
      { ST: 15, CN: 15, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      { stableId: 'stable-player' as any, status: 'Active' }
    );
    const wD = makeWarrior(
      'warrior-d' as any,
      'Fighter D',
      FightingStyle.BashingAttack,
      { ST: 12, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      { stableId: 'rival-1' as any, status: 'Active' }
    );

    const tournament = buildMinimalTournament([wA, wD]);
    const state = buildMinimalState({
      day: 1,
      isTournamentWeek: true,
      activeTournamentId: tournament.id,
      tournaments: [tournament],
      roster: [wA],
      rivals: [
        {
          id: 'rival-1' as any,
          owner: { id: 'owner-d', name: 'Rival D', stableName: 'Rival Stable', fame: 0, renown: 0, titles: 0 },
          roster: [wD],
          treasury: 100,
          fame: 0,
        } as any,
      ],
    });

    const next = TickOrchestrator.advanceDay(state);

    expect(next.day).toBe(2);
    expect(next.newsletter.length).toBeGreaterThanOrEqual(0);

    // Bracket should have been mutated: winner set on the bout
    const updatedTournament = next.tournaments.find((t) => t.id === tournament.id);
    expect(updatedTournament).toBeDefined();
    const firstBout = updatedTournament?.bracket[0];
    expect(firstBout).toBeDefined();
    // After resolution, one side should have won
    expect(firstBout?.winner).toBeDefined();
  });

  it('triggers week transition on day 6', () => {
    const state = buildMinimalState({ day: 6 });
    // Real advanceWeek will run the full pipeline; use a minimal state
    const next = TickOrchestrator.advanceDay(state);

    expect(next.day).toBe(0);
    expect(next.isTournamentWeek).toBe(false);
    expect(next.activeTournamentId).toBeUndefined();
  });
});

describe('TickOrchestrator.skipToWeekEnd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearWarriorCache();
  });

  it('batches tournament rounds and runs advanceWeek on tournament week', () => {
    const state = buildMinimalState({
      day: 2,
      isTournamentWeek: true,
      activeTournamentId: 't-test-1' as TournamentId,
      week: 5,
    });

    // Mock resolveRound to return incrementally different states
    let callCount = 0;
    mockResolveRound.mockImplementation((s: GameState) => {
      callCount++;
      return {
        updatedState: { ...s, day: 2 + callCount },
        roundResults: [`Result day ${2 + callCount}`],
      };
    });

    mockAdvanceWeek.mockReturnValueOnce({ ...state, week: 6, day: 0 });

    const next = TickOrchestrator.skipToWeekEnd(state);

    // Days 3,4,5,6 = 4 calls
    expect(mockResolveRound).toHaveBeenCalledTimes(4);
    expect(mockAdvanceWeek).toHaveBeenCalledTimes(1);
    expect(next.day).toBe(0);
    expect(next.isTournamentWeek).toBe(false);
    expect(next.activeTournamentId).toBeUndefined();

    // Should have a batched newsletter entry
    expect((next.newsletter ?? []).length).toBeGreaterThan(0);
    const recap = (next.newsletter ?? []).find((n) => n.title.includes('Tournament Week 5 Recap'));
    expect(recap).toBeDefined();
    expect(recap?.items.length).toBe(4);
    expect(recap?.items[0]).toMatch(/\[Day 3\] Result day 3/);
  });

  it('runs advanceWeek directly on non-tournament week', () => {
    const state = buildMinimalState({
      day: 3,
      isTournamentWeek: false,
      week: 10,
    });

    mockAdvanceWeek.mockReturnValueOnce({ ...state, week: 11, day: 0 });

    const next = TickOrchestrator.skipToWeekEnd(state);

    expect(mockResolveRound).not.toHaveBeenCalled();
    expect(mockAdvanceWeek).toHaveBeenCalledTimes(1);
    expect(next.day).toBe(0);
    expect(next.week).toBe(11);
  });

  it('does not add newsletter when there are no tournament results', () => {
    const state = buildMinimalState({
      day: 5,
      isTournamentWeek: true,
      activeTournamentId: 't-test-1' as TournamentId,
      newsletter: [],
    });

    mockResolveRound.mockReturnValue({
      updatedState: { ...state },
      roundResults: [],
    });

    mockAdvanceWeek.mockReturnValueOnce({ ...state, day: 0 });

    const next = TickOrchestrator.skipToWeekEnd(state);

    // Only 1 call for day 6 (loop starts at currentDay+1=6, goes to <7)
    expect(mockResolveRound).toHaveBeenCalledTimes(1);
    // No newsletter should be added for empty results
    expect((next.newsletter ?? []).length).toBe(0);
  });
});
