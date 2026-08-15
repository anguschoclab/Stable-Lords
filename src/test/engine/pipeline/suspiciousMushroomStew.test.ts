import { describe, it, expect } from 'vitest';
import { handleSuspiciousMushroomStew } from '@/engine/pipeline/offseasonEvents/chaosHandlers';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import type { OffseasonEventContext, OffseasonEventNarrative } from '@/engine/pipeline/offseasonEvents/types';
import { SeededRNGService } from '@/utils/random';

describe('handleSuspiciousMushroomStew', () => {
  it('grants XP and causes a Stomach Ache injury to a random active warrior', () => {
    const warrior = {
      id: 'w1',
      name: 'Test Warrior',
      xp: 100,
      status: 'Active',
      injuries: [],
      insightTokens: [],
    } as unknown as Warrior;

    const mockState: GameState = {
      roster: [warrior],
    } as any;

    const mockCtx: OffseasonEventContext = {
      rosterUpdates: new Map(),
      newsletterItems: [],
      ledgerEntries: [],
      insightTokens: [],
      treasuryDelta: 0,
    };

    const mockNarrative: OffseasonEventNarrative = {
      title: 'Suspicious Mushroom Stew',
      effectType: 'suspicious_mushroom_stew',
      newsletter: ['{{name}} ate mushroom stew.'],
    };

    const mockRng = new SeededRNGService(123);

    handleSuspiciousMushroomStew(mockState, 1, mockNarrative, mockRng, mockCtx);

    const update = mockCtx.rosterUpdates.get(warrior.id as WarriorId);
    expect(update).toBeDefined();

    expect(update?.xp).toBeGreaterThan(100);

    expect(update?.injuries).toHaveLength(1);
    expect(update?.injuries?.[0].name).toBe('Stomach Ache');
    expect(update?.injuries?.[0].severity).toBe('Minor');
    expect(update?.injuries?.[0].penalties).toEqual({ CN: -1, END: -1 });

    expect(mockCtx.newsletterItems).toHaveLength(1);
    expect(mockCtx.newsletterItems[0].items[0]).toContain(warrior.name);
  });
});
