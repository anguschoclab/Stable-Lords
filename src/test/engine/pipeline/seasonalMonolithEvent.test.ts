/**
 * Unexplained Monolith offseason event — handler-specific behavior and determinism tests.
 * Validates that handleUnexplainedMonolith:
 *   1. Is registered in EVENT_HANDLERS
 *   2. Has narrative content in the split JSON files
 *   3. Grants +15 XP, +10 Fame, 'precise' trait, and a Minor injury
 *   4. Produces deterministic results with a seeded RNG
 *   5. Handles edge cases (empty roster, warrior already having 'precise' trait)
 */
import { describe, it, expect } from 'vitest';
import { SeededRNGService } from '@/utils/random';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import { narrativeContent } from '@/data/narrative';
import {
  handleUnexplainedMonolith,
  type OffseasonEventNarrative,
  type OffseasonEventContext,
} from '@/engine/pipeline/offseasonEvents';
import { runSeasonalPass } from '@/engine/pipeline/seasonal';
import { makeWarrior as fixtureWarrior } from '@/test/_fixtures/factories';
import { makeSeasonalTestState } from '@/test/_fixtures/seasonalState';

const makeWarrior = (name: string, overrides: Partial<Warrior> = {}): Warrior =>
  fixtureWarrior({
    id: `w_${name}` as WarriorId,
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 0,
    derivedStats: { hp: 100 } as any,
    ...overrides,
  } as any);

const makeState = (roster: Warrior[] = []): GameState => makeSeasonalTestState(roster);

function makeCtx(): OffseasonEventContext {
  return {
    rosterUpdates: new Map<WarriorId, Partial<any>>(),
    newsletterItems: [],
    ledgerEntries: [],
    insightTokens: [],
    treasuryDelta: 0,
  };
}

const monolithEvent: OffseasonEventNarrative = {
  title: 'The Unexplained Monolith',
  effectType: 'unexplained_monolith',
  newsletter: [
    "A perfectly smooth black monolith appeared overnight in the training yard. {{name}} touched it, stared blankly for an hour, and now fights with unnatural focus but lingering fatigue. (+15 XP, +10 Fame, 'Precise' trait, Minor Fatigue)",
  ],
};

describe('unexplained_monolith offseason event', () => {
  it('narrative content contains unexplained_monolith event', () => {
    const events = narrativeContent.offseason_events as Record<string, OffseasonEventNarrative>;
    expect(events.unexplained_monolith).toBeDefined();
    const monolith = events.unexplained_monolith!;
    expect(monolith.title).toBe('The Unexplained Monolith');
    expect(monolith.effectType).toBe('unexplained_monolith');
    expect(Array.isArray(monolith.newsletter)).toBe(true);
    expect(monolith.newsletter.length).toBeGreaterThan(0);
  });

  it('handleUnexplainedMonolith is registered in EVENT_HANDLERS via runSeasonalPass', () => {
    const warrior = makeWarrior('TestWarrior');
    const state = makeState([warrior]);

    let monolithTriggered = false;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new SeededRNGService(seed);
      const impact = runSeasonalPass(state, 1, rng);
      if (impact.rosterUpdates && impact.rosterUpdates.size > 0) {
        const update = impact.rosterUpdates.get(warrior.id);
        if (update && update.traits && update.traits.includes('precise')) {
          monolithTriggered = true;
          break;
        }
      }
    }
    expect(monolithTriggered).toBe(true);
  });

  it('handleUnexplainedMonolith grants +15 XP, +10 Fame, precise trait, and Minor injury', () => {
    const warrior = makeWarrior('TestWarrior');
    const state = makeState([warrior]);
    const rng = new SeededRNGService(42);
    const ctx = makeCtx();

    handleUnexplainedMonolith(state, 1, monolithEvent, rng, ctx);

    expect(ctx.rosterUpdates.size).toBe(1);
    const update = ctx.rosterUpdates.get(warrior.id);
    expect(update).toBeDefined();
    expect(update!.xp).toBe(15);
    expect(update!.fame).toBe(10);
    expect(update!.traits).toContain('precise');
    expect(update!.injuries).toHaveLength(1);
    expect(update!.injuries![0]!.severity).toBe('Minor');
    expect(update!.injuries![0]!.name).toBe('Monolith Fatigue');
    expect(update!.injuries![0]!.penalties).toEqual({ SP: -1 });
  });

  it('handleUnexplainedMonolith pushes a newsletter item', () => {
    const warrior = makeWarrior('TestWarrior');
    const state = makeState([warrior]);
    const rng = new SeededRNGService(42);
    const ctx = makeCtx();

    handleUnexplainedMonolith(state, 1, monolithEvent, rng, ctx);

    expect(ctx.newsletterItems).toHaveLength(1);
    expect(ctx.newsletterItems[0]).toBeDefined();
  });

  it('handleUnexplainedMonolith is deterministic with same seed', () => {
    const warrior = makeWarrior('TestWarrior');
    const state = makeState([warrior]);

    const rng1 = new SeededRNGService(42);
    const ctx1 = makeCtx();
    handleUnexplainedMonolith(state, 1, monolithEvent, rng1, ctx1);

    const rng2 = new SeededRNGService(42);
    const ctx2 = makeCtx();
    handleUnexplainedMonolith(state, 1, monolithEvent, rng2, ctx2);

    const u1 = ctx1.rosterUpdates.get(warrior.id);
    const u2 = ctx2.rosterUpdates.get(warrior.id);
    expect(u1).toEqual(u2);
    expect(ctx1.newsletterItems).toEqual(ctx2.newsletterItems);
  });

  it('handleUnexplainedMonolith does not duplicate precise trait if already present', () => {
    const warrior = makeWarrior('PreciseWarrior', { traits: ['precise'] });
    const state = makeState([warrior]);
    const rng = new SeededRNGService(42);
    const ctx = makeCtx();

    handleUnexplainedMonolith(state, 1, monolithEvent, rng, ctx);

    const update = ctx.rosterUpdates.get(warrior.id);
    expect(update).toBeDefined();
    expect(update!.traits).toEqual(['precise']);
  });

  it('handleUnexplainedMonolith handles empty roster gracefully', () => {
    const state = makeState([]);
    const rng = new SeededRNGService(42);
    const ctx = makeCtx();

    expect(() => handleUnexplainedMonolith(state, 1, monolithEvent, rng, ctx)).not.toThrow();
    expect(ctx.rosterUpdates.size).toBe(0);
    expect(ctx.newsletterItems).toHaveLength(0);
  });

  it('handleUnexplainedMonolith accumulates updates on existing rosterUpdates', () => {
    const warrior = makeWarrior('TestWarrior', { xp: 50, fame: 20 });
    const state = makeState([warrior]);
    const rng = new SeededRNGService(42);
    const ctx = makeCtx();

    ctx.rosterUpdates.set(warrior.id, { xp: 50, fame: 20 });

    handleUnexplainedMonolith(state, 1, monolithEvent, rng, ctx);

    const update = ctx.rosterUpdates.get(warrior.id);
    expect(update).toBeDefined();
    expect(update!.xp).toBe(65);
    expect(update!.fame).toBe(30);
  });
});
