import { describe, it, expect } from 'vitest';
import { handleChaosWeaversProphecy } from '@/engine/pipeline/offseasonEvents/chaosHandlers';
import { SeededRNGService } from '@/utils/random';
import type { OffseasonEventNarrative, OffseasonEventContext } from '@/engine/pipeline/offseasonEvents/types';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

describe('Seasonal Chaos Weavers Prophecy', () => {
  it('picks a warrior, grants xp, gives madness injury and logs newsletter', () => {
    const state: GameState = {
      roster: [
        {
          id: 'w1',
          name: 'Prophecy Target',
          xp: 100,
          status: 'Active',
          injuries: [],
          insightTokens: [],
        } as unknown as Warrior,
      ],
    } as unknown as GameState;

    const rng = new SeededRNGService(1234);
    const eventData: OffseasonEventNarrative = {
      title: "The Chaos Weaver's Prophecy",
      effectType: 'chaos_weavers_prophecy',
      newsletter: [
        "The Chaos Weaver whispered dark prophecies in {{name}}'s ear. They awoke forever changed. (+{{xp}} XP, Minor Injury)"
      ],
    };

    const ctx: OffseasonEventContext = {
      rosterUpdates: new Map(),
      newsletterItems: [],
      ledgerEntries: [],
      insightTokens: [],
      treasuryDelta: 0,
    };

    handleChaosWeaversProphecy(state, 1, eventData, rng, ctx);

    const update = ctx.rosterUpdates.get('w1');
    expect(update).toBeDefined();
    expect(update!.xp).toBe(150); // 100 + 50
    expect(update!.injuries?.length).toBe(1);
    expect(update!.injuries![0].name).toBe('Prophetic Madness');

    expect(ctx.newsletterItems.length).toBe(1);
    expect(ctx.newsletterItems[0].items[0]).toContain('Prophecy Target');
  });
});
