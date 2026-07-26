import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import narrativeContent from '@/data/narrativeContent.json';
import { SeededRNGService } from '@/utils/random';
import type { WarriorId } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';

describe('runSeasonalPass - wandering_mystic', () => {
  it('should trigger wandering_mystic event and give warrior the chaos_touched trait', () => {
    const rng = new SeededRNGService(99);
    const eventCount = Object.keys((narrativeContent as any).offseason_events).length;
    let callCount = 0;

    // Mock the rng to always pick our new event.
    rng.next = () => {
      callCount++;
      if (callCount === 1) {
        return (Object.keys((narrativeContent as any).offseason_events).indexOf('wandering_mystic') + 0.5) / eventCount;
      }
      return 0.5;
    };

    const warriorId = 'w-mystic' as WarriorId;
    const state: Partial<GameState> = {
      year: 1,
      roster: [{ id: warriorId, name: 'Slippery Pete', status: 'Active', traits: [] } as any],
      newsletter: [],
      treasury: 1000,
    };

    const impact = runSeasonalPass(state as GameState, 1, rng);
    const updates = impact.rosterUpdates?.get(warriorId);

    expect(updates?.traits).toContain('chaos_touched');
    expect(impact.newsletterItems?.length).toBe(1);
    expect(impact.newsletterItems![0]!.title).toBe('Wandering Mystic');
  });
});
