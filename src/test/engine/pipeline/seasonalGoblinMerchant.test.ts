import { describe, it, expect, vi } from 'vitest';
import { handleGoblinMerchant } from '@/engine/pipeline/offseasonEvents/socialHandlers';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { GameState } from '@/types/state.types';
import type {
  OffseasonEventNarrative,
  OffseasonEventContext,
} from '@/engine/pipeline/offseasonEvents/types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

describe('handleGoblinMerchant', () => {
  it('should increase CN and WL, and deduct gold', () => {
    const mockRng: IRNGService = {
      pick: vi.fn((arr: readonly any[]) => arr[0]),
      next: () => 0.5, // Will result in 50 + Math.floor(0.5 * 50) = 75
      uuid: () => 'uuid-1',
      roll: (min: number) => min,
    } as unknown as IRNGService;

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

    const ctx: OffseasonEventContext = {
      rosterUpdates: new Map(),
      newsletterItems: [],
      ledgerEntries: [],
      insightTokens: [],
      treasuryDelta: 0,
      retiredIds: [],
    } as any;

    handleGoblinMerchant(state as GameState, 1, e, mockRng, ctx);

    expect(ctx.treasuryDelta).toBe(-75);
    expect(ctx.ledgerEntries.length).toBe(1);
    expect(ctx.newsletterItems.length).toBe(1);

    const update = ctx.rosterUpdates.get('w-1' as WarriorId);
    expect(update).toBeDefined();
    expect(update?.attributes?.CN).toBe(11);
    expect(update?.attributes?.WL).toBe(11);
  });
});
