import { describe, it, expect, vi } from 'vitest';
import { handleDreamweaversMist } from '@/engine/pipeline/offseasonEvents/chaosHandlers';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { OffseasonEventNarrative, OffseasonEventContext } from '@/engine/pipeline/offseasonEvents/types';

describe('handleDreamweaversMist', () => {
  it('awards 15 XP and inflicts Magic Burn minor injury', () => {
    const mockRng: IRNGService = {
      pick: vi.fn((arr: readonly any[]) => arr[0]),
      next: () => 0.5,
      uuid: () => 'uuid-1',
      roll: (min: number) => min,
    } as unknown as IRNGService;

    const warrior: Partial<Warrior> = {
      id: 'w-1' as WarriorId,
      name: 'Dreaming Warrior',
      status: 'Active',
      xp: 20,
      injuries: [],
    };

    const state: Partial<GameState> = {
      roster: [warrior as Warrior],
    };

    const narrative: OffseasonEventNarrative = {
      title: 'Dreamweavers Mist Settles',
      effectType: 'dreamweavers_mist' as any,
      newsletter: ['{{name}} breathed the strange mist.'],
    };

    const ctx: OffseasonEventContext = {
      treasuryDelta: 0,
      ledgerEntries: [],
      newsletterItems: [],
      rosterUpdates: new Map(),
      retiredIds: [],
    } as any;

    handleDreamweaversMist(state as GameState, 5, narrative, mockRng, ctx);

    const update = ctx.rosterUpdates.get('w-1' as WarriorId);
    expect(update).toBeDefined();
    expect(update?.xp).toBe(35);
    expect(update?.injuries?.length).toBe(1);
    expect(update?.injuries?.[0]?.name).toBe('Magic Burn');
    expect(ctx.newsletterItems.length).toBe(1);
    expect(ctx.newsletterItems[0]?.items[0]).toContain('Dreaming Warrior');
  });
});
