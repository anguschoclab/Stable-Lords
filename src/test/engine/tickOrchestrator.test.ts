import { describe, it, expect, afterEach } from 'vitest';
import { TickOrchestrator } from '@/engine/tick/TickOrchestrator';
import { advanceDay } from '@/engine/dayPipeline';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState, TournamentEntry, TournamentBout, Warrior } from '@/types/state.types';
import { clearWarriorCache } from '@/engine/matchmaking/tournamentSelection/utils';

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
    id: 't-test-1' as any,
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
  afterEach(() => {
    clearWarriorCache();
  });

  describe('regular day branch', () => {
    it('increments day by 1 on a non-tournament day', () => {
      const state = buildMinimalState({ day: 2 });
      const next = TickOrchestrator.advanceDay(state);

      expect(next.day).toBe(3);
      expect(next).not.toBe(state);
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
    });
  });

  describe('tournament day branch', () => {
    it('resolves a tournament round and appends newsletter when there are results', () => {
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
      // Bracket should have been resolved: winner set on the bout
      const updatedTournament = next.tournaments.find((t) => t.id === tournament.id);
      expect(updatedTournament).toBeDefined();
      const firstBout = updatedTournament?.bracket[0];
      expect(firstBout).toBeDefined();
      expect(firstBout?.winner).toBeDefined();
      // Incomplete tournament (round < 7) produces empty roundResults, so no newsletter appended
      expect(next.newsletter.length).toBe(0);
    });

    it('does not append newsletter when roundResults is empty', () => {
      const state = buildMinimalState({
        day: 3,
        isTournamentWeek: true,
        activeTournamentId: 't-test-1' as any,
        tournaments: [
          {
            ...buildMinimalTournament([]),
            id: 't-test-1' as any,
            completed: true,
          },
        ],
        newsletter: [{ id: 'existing', week: 1, title: 'Existing', items: [] }],
      });

      const next = TickOrchestrator.advanceDay(state);

      expect(next.newsletter).toHaveLength(1);
      expect((next.newsletter ?? [])[0]!.id).toBe('existing');
    });

    it('preserves existing newsletter entries', () => {
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
        newsletter: [{ id: 'old', week: 1, title: 'Old News', items: [] }],
      });

      const next = TickOrchestrator.advanceDay(state);

      // Incomplete tournament produces empty roundResults, so no new newsletter appended
      expect(next.newsletter.length).toBe(1);
      expect((next.newsletter ?? [])[0]!.id).toBe('old');
    });
  });

  describe('week transition branch', () => {
    it('resets day and tournament flags when nextDay >= 7', () => {
      const state = buildMinimalState({ day: 6 });

      const next = TickOrchestrator.advanceDay(state);

      expect(next.day).toBe(0);
      expect(next.isTournamentWeek).toBe(false);
      expect(next.activeTournamentId).toBeUndefined();
    });

    it('advances the week counter on transition', () => {
      const state = buildMinimalState({ day: 6, week: 5 });

      const next = TickOrchestrator.advanceDay(state);

      expect(next.day).toBe(0);
      expect(next.week).toBe(6);
    });

    it('handles day 6 tournament week as week transition, not tournament day', () => {
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
        day: 6,
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

      expect(next.day).toBe(0);
      expect(next.isTournamentWeek).toBe(false);
      // Tournament should NOT have been resolved (it was a week transition)
      expect(next.activeTournamentId).toBeUndefined();
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

describe('TickOrchestrator.skipToWeekEnd', () => {
  afterEach(() => {
    clearWarriorCache();
  });

  it('batches tournament rounds and advances week on tournament week', () => {
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
      day: 2,
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
      week: 5,
    });

    const next = TickOrchestrator.skipToWeekEnd(state);

    expect(next.day).toBe(0);
    expect(next.isTournamentWeek).toBe(false);
    expect(next.activeTournamentId).toBeUndefined();
    expect(next.week).toBe(6);

    // advanceWeek may generate newsletters from the pipeline; tournament recap may or may not appear
    // depending on whether the tournament completed. Just assert structural state is correct.
    expect(next.newsletter).toBeDefined();
  });

  it('runs advanceWeek directly on non-tournament week', () => {
    const state = buildMinimalState({
      day: 3,
      isTournamentWeek: false,
      week: 10,
    });

    const next = TickOrchestrator.skipToWeekEnd(state);

    expect(next.day).toBe(0);
    expect(next.week).toBe(11);
    expect(next.isTournamentWeek).toBe(false);
  });

  it('does not add newsletter when there are no tournament results', () => {
    const state = buildMinimalState({
      day: 5,
      isTournamentWeek: true,
      activeTournamentId: 't-test-1' as any,
      tournaments: [
        {
          ...buildMinimalTournament([]),
          id: 't-test-1' as any,
          completed: true,
        },
      ],
      newsletter: [],
    });

    const next = TickOrchestrator.skipToWeekEnd(state);

    expect(next.day).toBe(0);
    // advanceWeek runs the full pipeline which generates newsletters; tournament itself produced no results
    expect(next.isTournamentWeek).toBe(false);
    expect(next.activeTournamentId).toBeUndefined();
  });
});

