import type { GameState, RivalStableData } from '@/types/state.types';
import { makeGameState, makeRival, makeOwner, makeStrategy } from '@/test/_fixtures/factories';

/** Shared AI-worker test scaffold — default rival + minimal live state. */
export function makeAiTestRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return makeRival({
    id: 'rival_1' as any,
    owner: makeOwner({ id: 'owner_1' as any, name: 'Test Owner', stableName: 'Test Stable' }),
    trainers: [],
    strategy: makeStrategy(),
    ...overrides,
  });
}

/** make Ai Test State. */
export function makeAiTestState(overrides: Record<string, unknown> = {}): GameState {
  return makeGameState({
    meta: { gameName: 'test', version: '1.0', createdAt: '2025-01-01' },
    ftueComplete: true,
    player: {
      id: 'p1',
      name: 'Player',
      stableName: 'Player Stable',
      fame: 0,
      renown: 0,
      titles: 0,
    },
    rivals: [],
    recruitPool: [],
    isFTUE: false,
    progression: {
      status: 'active',
      stableStanding: 1,
      totalStables: 10,
      objectives: [],
    },
    ...overrides,
  } as any);
}
