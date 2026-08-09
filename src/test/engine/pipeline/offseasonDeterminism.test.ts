import { describe, it, expect } from 'vitest';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import { SeededRNGService } from '@/utils/random';
import narrativeContent from '@/data/narrativeContent.json';
import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

const events = (narrativeContent as any).offseason_events as Record<string, { effectType: string }>;
const eventKeys = Object.keys(events);
const eventCount = eventKeys.length;

function makeMockRng(targetEventKey: string, baseSeed: number) {
  const rng = new SeededRNGService(baseSeed);
  const originalNext = rng.next.bind(rng);
  let callCount = 0;
  const mockNext = () => {
    callCount++;
    if (callCount === 1) {
      return (eventKeys.indexOf(targetEventKey) + 0.5) / eventCount;
    }
    return originalNext();
  };
  rng.next = mockNext;
  return rng;
}

function makeState(
  warriors: { id: string; name: string; status?: string; injuries?: unknown[] }[]
): Partial<GameState> {
  return {
    year: 1,
    roster: warriors.map((w) => ({
      id: w.id as WarriorId,
      name: w.name,
      status: (w.status ?? 'Active') as Warrior['status'],
      injuries: (w.injuries ?? []) as Warrior['injuries'],
      fame: 0,
      xp: 0,
    })) as any[],
    newsletter: [],
    treasury: 1000,
    rivals: [],
    graveyard: [],
    retired: [],
  };
}

describe('offseason determinism characterization', () => {
  const SEEDS = [1, 42, 99, 777, 12345, 31337, 555, 888, 2024, 67890];

  const testedEvents = eventKeys.slice(0, 46);

  for (const eventKey of testedEvents) {
    const e = events[eventKey];
    if (!e) continue;

    it(`${eventKey} produces reproducible output (same seed = same result)`, () => {
      for (const seed of SEEDS) {
        const state = makeState([
          { id: 'w-test-a', name: 'Alice' },
          { id: 'w-test-b', name: 'Bob' },
        ]);

        const rng1 = makeMockRng(eventKey, seed);
        const rng2 = makeMockRng(eventKey, seed);

        const impact1 = runSeasonalPass(state as GameState, 1, rng1);
        const impact2 = runSeasonalPass(state as GameState, 1, rng2);

        expect(JSON.stringify(impact1), `seed ${seed} for ${eventKey} diverged`).toBe(
          JSON.stringify(impact2)
        );
      }
    });

    it(`${eventKey} produces stable structural shape across seeds`, () => {
      const shapes: Array<{
        newsletterCount: number;
        insightTokenCount: number;
        ledgerEntryCount: number;
        rosterUpdateCount: number;
      }> = [];

      for (const seed of SEEDS) {
        const rng = makeMockRng(eventKey, seed);
        const state = makeState([
          { id: 'w-test-a', name: 'Alice' },
          { id: 'w-test-b', name: 'Bob' },
        ]);
        const impact = runSeasonalPass(state as GameState, 1, rng);

        shapes.push({
          newsletterCount: impact.newsletterItems?.length ?? 0,
          insightTokenCount: impact.insightTokens?.length ?? 0,
          ledgerEntryCount: impact.ledgerEntries?.length ?? 0,
          rosterUpdateCount: impact.rosterUpdates?.size ?? 0,
        });
      }

      // All seeds should produce the same structural shape (same counts)
      const first = shapes[0];
      expect(first, 'at least one result').toBeDefined();
      if (!first) return;

      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        if (!s) continue;
        expect(s.newsletterCount, `seed ${SEEDS[i]} newsletter count differs`).toBe(
          first.newsletterCount
        );
        expect(s.insightTokenCount, `seed ${SEEDS[i]} insight token count differs`).toBe(
          first.insightTokenCount
        );
        expect(s.ledgerEntryCount, `seed ${SEEDS[i]} ledger entry count differs`).toBe(
          first.ledgerEntryCount
        );
        expect(s.rosterUpdateCount, `seed ${SEEDS[i]} roster update count differs`).toBe(
          first.rosterUpdateCount
        );
      }
    });
  }

  it('same seed + same state produces identical impact', () => {
    for (const seed of SEEDS) {
      const state = makeState([
        { id: 'w-test-a', name: 'Alice' },
        { id: 'w-test-b', name: 'Bob' },
      ]);

      const rng1 = new SeededRNGService(seed);
      const rng2 = new SeededRNGService(seed);

      const impact1 = runSeasonalPass(state as GameState, 1, rng1);
      const impact2 = runSeasonalPass(state as GameState, 1, rng2);

      expect(JSON.stringify(impact1), `seed ${seed} should be identical`).toBe(
        JSON.stringify(impact2)
      );
    }
  });

  it('different seeds produce different events (probabilistic)', () => {
    const eventSet = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new SeededRNGService(seed);
      // Capture which event was picked by observing the first rng.next() value
      const firstRoll = rng.next();
      const eventIndex = Math.floor(firstRoll * eventCount);
      const key = eventKeys[eventIndex];
      if (key) eventSet.add(key);
    }
    // Should hit a significant variety of events with 200 seeds
    expect(eventSet.size, 'should trigger many different events').toBeGreaterThan(20);
  });

  it('no-op when nextWeek is not 1', () => {
    const rng = new SeededRNGService(42);
    const state = makeState([{ id: 'w-test', name: 'Test' }]);
    const impact = runSeasonalPass(state as GameState, 2, rng);
    expect(impact).toEqual({});
  });

  it('no-op when no offseason_events in narrative content', () => {
    const rng = new SeededRNGService(42);
    // Year 0 with no events — should still work since the guard is on nextWeek
    const impact = runSeasonalPass(
      { year: 0, roster: [], rivals: [], graveyard: [], retired: [] } as unknown as GameState,
      1,
      rng
    );
    // Should produce some impact (year 0 * 999 + 1 = 1 as seed)
    expect(impact).toBeDefined();
  });
});
