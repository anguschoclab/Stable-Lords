import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePrismaticGaleExposure } from '@/engine/pipeline/offseasonEvents/chaosHandlers';
import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/utils/random';
import type { OffseasonEventNarrative, OffseasonEventContext } from '@/engine/pipeline/offseasonEvents/types';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import narrativeContent from '@/data/narrative/offseason.json';

describe('prismatic_gale_exposure offseason event', () => {
  let mockState: GameState;
  let mockRng: SeededRNGService;
  let mockCtx: OffseasonEventContext;

  beforeEach(() => {
    mockRng = new SeededRNGService('test-seed');
    const warrior = makeWarrior('w1' as any, 'Test Warrior', FightingStyle.StrikingAttack, { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
    warrior.status = 'Active';
    warrior.injuries = [];
    warrior.xp = 10;
    mockState = { roster: [warrior] } as unknown as GameState;
    mockCtx = {
      rosterUpdates: new Map(),
      newsletterItems: [],
      ledgerEntries: [],
      insightTokens: [],
      treasuryDelta: 0,
    };
  });

  it('should apply xp, injury, and an insight token', () => {
    const eventDef: OffseasonEventNarrative = {
      title: 'Caught in a Prismatic Gale',
      effectType: 'prismatic_gale_exposure',
      newsletter: ['Test newsletter'],
    };
    handlePrismaticGaleExposure(mockState, 10, eventDef, mockRng, mockCtx);

    expect(mockCtx.rosterUpdates.has('w1')).toBe(true);
    const update = mockCtx.rosterUpdates.get('w1')!;
    expect(update.xp).toBe(30); // 10 + 20
    expect(update.injuries).toBeDefined();
    expect(update.injuries!.length).toBe(1);
    expect(update.injuries![0].name).toBe('Prismatic Dizziness');

    expect(mockCtx.insightTokens.length).toBe(1);
    expect(mockCtx.insightTokens[0].origin).toBe('Prismatic Gale');

    expect(mockCtx.newsletterItems.length).toBe(1);
  });

  it('narrative domain files contain prismatic_gale_exposure event after merge', () => {
    const events = (narrativeContent as any).offseason_events;
    if (events && events.prismatic_gale_exposure) {
      expect(events.prismatic_gale_exposure.title).toBeTruthy();
      expect(events.prismatic_gale_exposure.effectType).toBe('prismatic_gale_exposure');
    } else {
      expect(true).toBe(false); // Force failure if not found
    }
  });
});
