import { describe, it, expect } from 'vitest';
import { makeStubRng, makeOffseasonCtx } from '@/test/_fixtures/offseasonCtx';
import { handleDreamweaversMist } from '@/engine/pipeline/offseasonEvents/chaosHandlers';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { OffseasonEventNarrative } from '@/engine/pipeline/offseasonEvents/types';

describe('handleDreamweaversMist', () => {
  it('awards 15 XP and inflicts Magic Burn minor injury', () => {
    const mockRng = makeStubRng();

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

    const ctx = makeOffseasonCtx();

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
