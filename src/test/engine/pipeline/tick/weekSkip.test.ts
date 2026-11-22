import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: vi.fn((state: unknown) => ({
      updatedState: state,
      roundResults: ['Champion wins'],
      isComplete: true,
    })),
    sweepUnfinishedTournaments: vi.fn((state: unknown) => state),
  },
}));

import { skipToWeekEnd } from '@/engine/pipeline/tick/weekSkip';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import * as weekPipelineService from '@/engine/pipeline/services/weekPipelineService';
import { SeededRNG } from '@/utils/random';
import type { GameState } from '@/types/state.types';

/**
 * Regression: the batched tournament recap newsletter id must be seeded by
 * absoluteWeek — in-year week numbers (1-52) repeat each year, so a week-
 * seeded uuid collides once a year-old entry survives the newsletter cap
 * (rendered key={item.id}). `absoluteWeek ?? week` keeps both the cross-year
 * uniqueness and the legacy fallback.
 */
describe('skipToWeekEnd recap newsletter seeding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (s: GameState) => s);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function runSkip(week: number, absoluteWeek: number | undefined) {
    const state = createFreshState(`recap-${week}-${absoluteWeek}`);
    state.day = 0;
    state.week = week;
    if (absoluteWeek === undefined) {
      delete (state as { absoluteWeek?: number }).absoluteWeek;
    } else {
      state.absoluteWeek = absoluteWeek;
    }
    state.isTournamentWeek = true;
    state.tournaments = [{ id: 'cup', completed: false } as GameState['tournaments'][number]];
    return skipToWeekEnd(state);
  }

  it('mints recap ids unique across years for the same in-year week', async () => {
    const year1 = await runSkip(10, 10);
    const year2 = await runSkip(10, 62);
    const id1 = year1.newsletter?.at(-1)?.id;
    const id2 = year2.newsletter?.at(-1)?.id;
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id2).not.toBe(id1);
    expect(id2).toBe(new SeededRNG(62).uuid());
    expect(id2).not.toBe(new SeededRNG(10).uuid());
  });

  it('recap id is deterministic for the same absoluteWeek', async () => {
    const a = await runSkip(10, 62);
    const b = await runSkip(10, 62);
    expect(a.newsletter?.at(-1)?.id).toBe(b.newsletter?.at(-1)?.id);
  });

  it('falls back to the in-year week when absoluteWeek is unset', async () => {
    const result = await runSkip(10, undefined);
    expect(result.newsletter?.at(-1)?.id).toBe(new SeededRNG(10).uuid());
  });
});
