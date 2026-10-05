import { describe, it, expect } from 'vitest';
import { makeStubRng, makeOffseasonCtx } from '@/test/_fixtures/offseasonCtx';
import { handleGoblinMerchant } from '@/engine/pipeline/offseasonEvents/socialHandlers';
import type { GameState } from '@/types/state.types';
import type { OffseasonEventNarrative } from '@/engine/pipeline/offseasonEvents/types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

describe('handleGoblinMerchant', () => {
  it('should increase CN and WL, and deduct gold', () => {
    const mockRng = makeStubRng();

    const w: Partial<Warrior> = {
      id: 'w-1' as WarriorId,
      name: 'Bob',
      status: 'Active',
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      injuries: [],
    };
    const state: Partial<GameState> = {
      roster: [w as Warrior],
    };

    const e: OffseasonEventNarrative = {
      title: 'Goblin Merchant Visit',
      effectType: 'goblin_merchant' as any,
      newsletter: ['{{name}} got +1 CN and WL for {{gold}}G'],
    };

    const ctx = makeOffseasonCtx();

    handleGoblinMerchant({ state: state as GameState, nextWeek: 1, e, rng: mockRng, ctx });

    expect(ctx.treasuryDelta).toBe(-75);
    expect(ctx.ledgerEntries.length).toBe(1);
    expect(ctx.newsletterItems.length).toBe(1);

    const update = ctx.rosterUpdates.get('w-1' as WarriorId);
    expect(update).toBeDefined();
    expect(update?.attributes?.CN).toBe(11);
    expect(update?.attributes?.WL).toBe(11);
  });
});
