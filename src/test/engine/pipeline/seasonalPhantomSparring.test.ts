import { describe, it, expect, vi } from 'vitest';
import { handlePhantomSparringPartner } from '@/engine/pipeline/offseasonEvents/chaosHandlers';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { OffseasonEventNarrative, OffseasonEventContext } from '@/engine/pipeline/offseasonEvents/types';

describe('handlePhantomSparringPartner', () => {
  it('awards 40 XP and 10 fatigue to an active warrior and adds newsletter', () => {
    const mockRng: IRNGService = {
      pick: vi.fn((arr: readonly any[]) => arr[0]),
      next: () => 0.5,
      uuid: () => 'uuid-1',
      roll: (min: number) => min,
    } as unknown as IRNGService;

    const warrior: Partial<Warrior> = {
      id: 'w-1' as WarriorId,
      name: 'Sparring Warrior',
      status: 'Active',
      xp: 10,
      fatigue: 5,
    };

    const state: Partial<GameState> = {
      roster: [warrior as Warrior],
    };

    const narrative: OffseasonEventNarrative = {
      title: 'Phantom Sparring Partner',
      effectType: 'phantom_sparring' as any,
      newsletter: ['{{name}} sparred with a shadowy apparition.'],
    };

    const ctx: OffseasonEventContext = {
      treasuryDelta: 0,
      ledgerEntries: [],
      newsletterItems: [],
      rosterUpdates: new Map(),
      retiredIds: [],
    } as any;

    handlePhantomSparringPartner(state as GameState, 5, narrative, mockRng, ctx);

    const update = ctx.rosterUpdates.get('w-1' as WarriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(50);
    expect(update?.fatigue).toBe(15);
    expect(ctx.newsletterItems.length).toBe(1);
    expect(ctx.newsletterItems[0]?.items[0]).toContain('Sparring Warrior');
  });
});
