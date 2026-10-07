import { describe, it, expect } from 'vitest';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { truncateState } from '@/engine/storage/truncation';
import { makeGameState } from '@/test/_fixtures/factories';
import type { GameState } from '@/types/state.types';

describe('lastWeekBoutDisplay integration', () => {
  it('GameStateSchema accepts lastWeekBoutDisplay', () => {
    const state = makeGameState({
      lastWeekBoutDisplay: {
        results: [],
        deathNames: ['Warrior X'],
        injuryNames: ['Warrior Y'],
      },
    });

    expect(() => GameStateSchema.parse(state)).not.toThrow();
  });

  it('GameStateSchema accepts state without lastWeekBoutDisplay (optional)', () => {
    const state = makeGameState({ lastWeekBoutDisplay: undefined });

    expect(() => GameStateSchema.parse(state)).not.toThrow();
  });

  it('truncateState strips lastWeekBoutDisplay', () => {
    const state = {
      meta: { gameName: 'Test', version: '1.0', createdAt: '' },
      lastWeekBoutDisplay: {
        results: [{ a: { id: 'w1' }, d: { id: 'w2' }, outcome: {} }] as any,
        deathNames: ['X'],
        injuryNames: ['Y'],
      },
    } as unknown as GameState;

    const truncated = truncateState(state);
    expect(truncated.lastWeekBoutDisplay).toBeUndefined();
  });
});
