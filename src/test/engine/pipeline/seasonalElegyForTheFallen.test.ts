import { describe, it, expect } from 'vitest';
import { handleElegyForTheFallen } from '@/engine/pipeline/offseasonEvents/socialHandlers';
import { makeWarrior } from '@/test/_fixtures/factories';
import { makeSeasonalTestState } from '@/test/_fixtures/seasonalState';
import { makeStubRng, makeOffseasonCtx } from '@/test/_fixtures/offseasonCtx';
import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { OffseasonEventNarrative } from '@/engine/pipeline/offseasonEvents/types';

const NARRATIVE: OffseasonEventNarrative = {
  title: 'An Elegy for the Fallen',
  effectType: 'elegy_for_the_fallen',
  newsletter: [
    'A memorial feast for fallen legends; {{name}} spoke. (+{{popularity}} Popularity, +{{fame}} Fame, -{{gold}} Gold)',
    'A pyre for {{fallen}}; {{name}} spoke. (+{{popularity}} Popularity, +{{fame}} Fame, -{{gold}} Gold)',
  ],
};

describe('handleElegyForTheFallen', () => {
  it('grants popularity and fame, charges the memorial feast, and uses the generic elegy with an empty graveyard', () => {
    const warrior = makeWarrior({ id: 'w1' as never, name: 'Eulogist', popularity: 7, fame: 40 });
    const state = makeSeasonalTestState([warrior]);
    state.graveyard = [];
    const ctx = makeOffseasonCtx();
    // Stub rng: next()=0.5 → cost = 40 + floor(0.5*41) = 60; pick→first warrior.
    handleElegyForTheFallen({ state, nextWeek: 1, e: NARRATIVE, rng: makeStubRng(), ctx });

    const update = ctx.rosterUpdates.get(warrior.id as WarriorId);
    expect(update).toEqual({ popularity: 22, fame: 50 });
    expect(ctx.treasuryDelta).toBe(-60);
    expect(ctx.ledgerEntries.map((l) => l.label)).toEqual(['Memorial Feast']);
    expect(ctx.newsletterItems).toHaveLength(1);
    expect(ctx.newsletterItems[0]?.items?.[0]).toContain('Eulogist');
    expect(ctx.newsletterItems[0]?.items?.[0]).toContain('fallen legends');
  });

  it('honors a graveyard warrior by name when one is buried', () => {
    const warrior = makeWarrior({ id: 'w1' as never, name: 'Eulogist' });
    const fallen = makeWarrior({ id: 'dead1' as never, name: 'Old Brakka', status: 'Dead' });
    const state: GameState = { ...makeSeasonalTestState([warrior]), graveyard: [fallen] };
    const ctx = makeOffseasonCtx();
    handleElegyForTheFallen({ state, nextWeek: 1, e: NARRATIVE, rng: makeStubRng(), ctx });

    expect(ctx.newsletterItems).toHaveLength(1);
    const text = ctx.newsletterItems[0]?.items?.[0] ?? '';
    expect(text).toContain('Old Brakka');
    expect(text).toContain('Eulogist');
  });

  it('no-ops entirely when no active warrior can deliver the elegy', () => {
    const retired = makeWarrior({ id: 'r1' as never, name: 'Retired', status: 'Retired' });
    const state = makeSeasonalTestState([retired]);
    const ctx = makeOffseasonCtx();
    handleElegyForTheFallen({ state, nextWeek: 1, e: NARRATIVE, rng: makeStubRng(), ctx });

    expect(ctx.rosterUpdates.size).toBe(0);
    expect(ctx.treasuryDelta).toBe(0);
    expect(ctx.ledgerEntries).toHaveLength(0);
    expect(ctx.newsletterItems).toHaveLength(0);
  });
});
