import type { Warrior, RivalStableData } from '@/types/state.types';
import type { WarriorId, FightingStyle } from '@/types/shared.types';
import { makeWarrior, makeRival } from '@/test/_fixtures/factories';

/** Shared bout-bidding roster builders — plain warrior + default rival stable. */
export const makeBidWarrior = (name: string, style: FightingStyle, over: { cn?: number; fame?: number } = {}): Warrior =>
  makeWarrior({
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: over.cn ?? 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: over.fame ?? 100,
    derivedStats: { hp: 100 } as any,
  } as any);

export const makeBidRival = (overrides: Partial<RivalStableData> = {}): RivalStableData =>
  makeRival({
    id: 'rival-1' as any,
    owner: {
      id: 'owner-1' as any,
      name: 'Owner',
      stableName: 'Stable',
      fame: 100,
      renown: 50,
      titles: 0,
      personality: 'Pragmatic',
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...overrides,
  } as any);
