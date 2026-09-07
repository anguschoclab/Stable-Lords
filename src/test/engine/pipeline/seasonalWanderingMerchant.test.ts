import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    year: 1,
    season: 'Spring',
    day: 1,
    week: 1,
    treasury: 1000,
    fame: 0,
    roster: [],
    rivals: [],
    events: [],
    ...overrides,
  } as unknown as GameState;
}

function createMockWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1',
    name: 'Alaric',
    status: 'Active',
    xp: 0,
    fame: 0,
    ...overrides,
  } as unknown as Warrior;
}
import { SeededRNGService } from '@/utils/random';
import { narrativeContent } from '@/data/narrative';

describe('seasonal pass - wandering_merchant_strange_brew', () => {
  it('grants XP and Fame to a random warrior', () => {
    const state = createMockState();
    const w1 = createMockWarrior({ id: 'w1', name: 'Alaric', status: 'Active', xp: 10, fame: 5 });
    state.roster = [w1];

    // Force the rng to select our new event by overriding the narrative content temporarily, or using an rng that picks it.
    // However, it's easier to mock the rng or directly call the handler.
    // But since the test is for the pipeline, let's just mock narrativeContent.offseason_events to only have our event.

    const originalEvents = (narrativeContent as any).offseason_events;
    (narrativeContent as any).offseason_events = {
      wandering_merchant_strange_brew: originalEvents['wandering_merchant_strange_brew']
    };

    const rng = new SeededRNGService(12345);
    const impact = runSeasonalPass(state, 1, rng);

    // Restore
    (narrativeContent as any).offseason_events = originalEvents;

    expect(impact.rosterUpdates?.has('w1')).toBe(true);
    const updates = impact.rosterUpdates!.get('w1');
    expect(updates?.xp).toBe(30); // 10 + 20
    expect(updates?.fame).toBe(15); // 5 + 10

    expect(impact.newsletterItems?.length).toBe(1);
    expect(impact.newsletterItems?.[0].title).toBe("Wandering Merchant's Strange Brew");
  });
});
