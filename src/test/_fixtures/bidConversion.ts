/**
 * Shared fixture builder for convertBidsToOffers scenario tests: a proposer
 * stable issuing one bid against N candidate stables (one warrior each).
 */
import type { GameState, RivalStableData } from '@/types/state.types';
import type { BoutBid } from '@/engine/ai/workers/competitionWorker/types';
import type { Warrior } from '@/types/warrior.types';
import { convertBidsToOffers } from '@/engine/ai/workers/competitionWorker/boutBidding';
import { makeGameState, makeRival, makeWarrior, makeOwner } from './factories';
import { SeededRNG } from '@/utils/random';
import type { StableId } from '@/types/shared.types';

/** A built bid-conversion scenario: state, rivals, the bid, and the warriors. */
export interface BidScenario {
  state: GameState;
  rivals: RivalStableData[];
  bid: BoutBid;
  proposerW: Warrior;
  candidateWarriors: Warrior[];
}

/**
 * Build the canonical bid-conversion scenario: `proposerW` (a rival warrior)
 * bids, and each `candidates` warrior sits alone on its own stable. Candidate
 * stable order matters — a pure-score tie resolves to the earliest candidate.
 */
export function makeBidScenario(args: {
  proposerW?: Warrior;
  personality?: string;
  intent?: string;
  candidates: Warrior[];
  bidOverrides?: Partial<BoutBid>;
}): BidScenario {
  const { candidates } = args;
  const proposerW = args.proposerW ?? makeWarrior({ fame: 60 });
  const proposer = makeRival({
    id: 'stable-proposer' as StableId,
    roster: [proposerW],
    owner: makeOwner({
      id: 'stable-proposer' as StableId,
      personality: (args.personality ?? 'Pragmatic') as any,
    }),
    strategy: { intent: (args.intent ?? 'CONSOLIDATION') as any, planWeeksRemaining: 4 },
  });
  const candidateStables = candidates.map((w, i) =>
    makeRival({ id: `stable-cand-${i}` as StableId, roster: [w] })
  );
  const rivals = [proposer, ...candidateStables];
  const state = makeGameState({ rivals });
  const bid: BoutBid = {
    proposingWarriorId: proposerW.id as any,
    priority: 5,
    description: 'Standard bout.',
    ...args.bidOverrides,
  };
  return { state, rivals, bid, proposerW, candidateWarriors: candidates };
}


/** Run the scenario through bid→offer conversion with a fixed seed. */
export function runBidConversion(
    scenario: BidScenario,
    rivalId: string = 'stable-proposer',
    seed: number = 11
) {
    return convertBidsToOffers(
        [{ bid: scenario.bid, rivalId }],
        scenario.rivals,
        scenario.state,
        new SeededRNG(seed),
        new Set()
    );
}
