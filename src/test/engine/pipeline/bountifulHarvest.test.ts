import { describe, it, expect } from 'vitest';
import { handleBountifulHarvest } from '@/engine/pipeline/offseasonEvents/economicHandlers';
import { type GameState } from '@/types/state.types';
import { type OffseasonEventNarrative, type OffseasonEventContext } from '@/engine/pipeline/offseasonEvents/types';
import { SeededRNGService } from '@/utils/random';

describe('Bountiful Harvest Offseason Event', () => {
  it('adds 200 gold to treasury and records ledger entry', () => {
    const state = {} as GameState;

    const narrative: OffseasonEventNarrative = {
      title: 'A Bountiful Harvest',
      effectType: 'bountiful_harvest',
      newsletter: ['A local village celebrated... (+{{gold}} Gold)']
    };

    const ctx: OffseasonEventContext = {
      rosterUpdates: new Map(),
      newsletterItems: [],
      ledgerEntries: [],
      insightTokens: [],
      treasuryDelta: 0
    };

    const rng = new SeededRNGService(123);

    handleBountifulHarvest(state, 2, narrative, rng, ctx);

    expect(ctx.treasuryDelta).toBe(200);
    expect(ctx.ledgerEntries).toHaveLength(1);
    expect(ctx.ledgerEntries[0]?.label).toBe('Bountiful Harvest');
    expect(ctx.ledgerEntries[0]?.amount).toBe(200);
    expect(ctx.newsletterItems).toHaveLength(1);
  });
});
