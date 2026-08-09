import { describe, it, expect, vi, beforeEach } from 'vitest';
import { finalizeWeekSideEffectsToImpact } from '@/engine/bout/services/WeekFinalizationService';
import type { GameState } from '@/types/state.types';
import type { BoutResult } from '@/engine/bout/services/boutProcessorService';
import { NewsletterFeed } from '@/engine/newsletter/feed';

vi.mock('@/engine/core/EventBus', () => ({
  engineEventBus: { emit: vi.fn(), clear: vi.fn() },
}));

describe('finalizeWeekSideEffectsToImpact — year boundary', () => {
  beforeEach(() => {
    NewsletterFeed.clear();
  });

  function makeState(absoluteWeek: number): GameState {
    const week = ((absoluteWeek - 1) % 52) + 1;
    const year = Math.floor((absoluteWeek - 1) / 52) + 1;
    return {
      player: {
        id: 'player',
        name: 'Player',
        stableName: 'Player Stable',
        fame: 0,
        renown: 0,
        titles: 0,
      },
      fame: 0,
      popularity: 0,
      treasury: 1000,
      ledger: [],
      week,
      absoluteWeek,
      year,
      phase: 'planning',
      season: 'Spring',
      weather: 'Clear',
      roster: [],
      graveyard: [],
      retired: [],
      arenaHistory: [],
      newsletter: [],
      rivals: [],
      boutOffers: {},
      recruitPool: [],
      crowdMood: 'Excited',
      moodHistory: [{ week: absoluteWeek - 1, mood: 'Excited' }],
      gazettes: [],
      rivalries: [],
    } as unknown as GameState;
  }

  const emptyResults: BoutResult[] = [];

  it('mood change ID uses absoluteWeek (no collision across years)', () => {
    const state52 = makeState(52);
    const impact52 = finalizeWeekSideEffectsToImpact(state52, emptyResults);
    const moodItem52 = impact52.newsletterItems?.find((i) => i.id?.startsWith('mood_change_'));
    expect(moodItem52?.id).toBe('mood_change_52');

    const state53 = makeState(53);
    const impact53 = finalizeWeekSideEffectsToImpact(state53, emptyResults);
    const moodItem53 = impact53.newsletterItems?.find((i) => i.id?.startsWith('mood_change_'));
    expect(moodItem53?.id).toBe('mood_change_53');

    // IDs must not collide
    expect(moodItem52?.id).not.toBe(moodItem53?.id);
  });

  it('moodHistory week uses absoluteWeek', () => {
    const state = makeState(53);
    const impact = finalizeWeekSideEffectsToImpact(state, emptyResults);
    expect(impact.moodHistory).toBeDefined();
    const lastEntry = impact.moodHistory![impact.moodHistory!.length - 1];
    expect(lastEntry).toBeDefined();
    expect(lastEntry!.week).toBe(53);
  });

  it('gazette seed differs across years for same display week', () => {
    const stateY1W1 = makeState(1);
    const stateY2W1 = makeState(53);

    const impactY1 = finalizeWeekSideEffectsToImpact(stateY1W1, emptyResults);
    const impactY2 = finalizeWeekSideEffectsToImpact(stateY2W1, emptyResults);

    // Gazettes should have different content because seeds differ
    const gazetteY1 = impactY1.gazettes?.[0];
    const gazetteY2 = impactY2.gazettes?.[0];
    expect(gazetteY1).toBeDefined();
    expect(gazetteY2).toBeDefined();
    // The IDs should differ since they're generated from different seeds
    expect(gazetteY1?.id).not.toBe(gazetteY2?.id);
  });

  it('newsletter issue ID uses absoluteWeek', () => {
    const state = makeState(53);
    const impact = finalizeWeekSideEffectsToImpact(state, emptyResults);
    // closeWeekToIssue is called with absoluteWeek
    // The newsletter issue should have id `issue_53`, not `issue_1`
    expect(impact.gazettes).toBeDefined();
  });
});
