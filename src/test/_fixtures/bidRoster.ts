import type { GameState, Warrior, RivalStableData } from '@/types/state.types';
import type { WarriorId, FightingStyle } from '@/types/shared.types';
import { makeWarrior, makeRival } from '@/test/_fixtures/factories';
import {
  generateBoutBids,
  convertBidsToOffers,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import { SeededRNG } from '@/utils/random';

/** Shared bout-bidding roster builders — plain warrior + default rival stable. */
export const makeBidWarrior = (
  name: string,
  style: FightingStyle,
  over: { cn?: number; fame?: number } = {}
): Warrior =>
  makeWarrior({
    id: `w_${name}` as WarriorId,
    name,
    style,
    attributes: { ST: 10, CN: over.cn ?? 12, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: over.fame ?? 100,
    derivedStats: { hp: 100 } as any,
  } as any);

/** make Bid Rival. `ownerOver` shallow-merges onto the default owner literal. */
export const makeBidRival = (
  overrides: Partial<RivalStableData> = {},
  ownerOver: Record<string, unknown> = {}
): RivalStableData =>
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
      ...ownerOver,
    },
    roster: [],
    treasury: 1000,
    fame: 100,
    ledger: [],
    trainingAssignments: [],
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
    ...overrides,
  } as any);

/** Shared bid-scenario fields — Clear weather, Calm crowd (field set by caller). */
export const bidContext = (currentWeek: number) =>
  ({ _currentWeek: currentWeek, weather: 'Clear', crowdMood: 'Calm' }) as const;

/** Deterministic bid generation — Clear weather, Calm crowd, [rivalB] field. */
export const generateTestBids = (
  rivalA: RivalStableData,
  rivalB: RivalStableData,
  currentWeek: number
) =>
  generateBoutBids({
    rival: rivalA,
    ...bidContext(currentWeek),
    rivals: [rivalB],
  });

/** rng(42) + rivalA-owned bid mapping + offer conversion — shared eval tail. */
export function convertToTestOffers(
  bids: ReturnType<typeof generateTestBids>['bids'],
  rivalA: RivalStableData,
  rivals: RivalStableData[],
  state: GameState,
  excluded: Set<string> = new Set()
) {
  const rng = new SeededRNG(42);
  const allBids = bids.map((bid) => ({ bid, rivalId: rivalA.id as string }));
  return convertBidsToOffers(allBids, rivals, state, rng, excluded);
}
