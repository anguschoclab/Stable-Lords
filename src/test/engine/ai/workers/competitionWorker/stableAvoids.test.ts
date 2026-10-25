/**
 * AI stable-level avoids (canon "avoid team numbers").
 * A rival whose dossier shows it is dominated by another stable should stop
 * proposing bouts into that stable — gated by owner personality.
 */
import { describe, it, expect } from 'vitest';
import { convertBidsToOffers } from '@/engine/ai/workers/competitionWorker/boutBidding';
import type { BoutBid } from '@/engine/ai/workers/competitionWorker/types';
import { makeGameState, makeRival, makeWarrior, makeAgentMemory } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import type { StableId } from '@/types/shared.types';

function dominatedDossier(l = 3, w = 0, k = 0) {
  return {
    lastSeenWeek: 4,
    knownStyles: [],
    estimatedThreat: 0.9,
    recordVs: { w, l, k },
  };
}

/** Proposer rival plus the candidate stables the bids can land on. */
function setup(personality: string, dossierLosses = 3) {
  const bullyStableWarrior = makeWarrior({ fame: 60 });
  const bully = makeRival({ id: 'stable-bully' as StableId, roster: [bullyStableWarrior] });
  // stable-other's only warrior is training-assigned → unbookable.
  const otherWarrior = makeWarrior({ fame: 60 });
  const other = makeRival({
    id: 'stable-other' as StableId,
    roster: [otherWarrior],
    trainingAssignments: [{ warriorId: otherWarrior.id, type: 'attribute', attribute: 'ST' }],
  });
  const proposerWarrior = makeWarrior({ fame: 60 });
  const proposer = makeRival({
    id: 'stable-proposer' as StableId,
    roster: [proposerWarrior],
    owner: {
      id: 'stable-proposer' as StableId,
      name: 'Owner',
      stableName: 'Proposers',
      fame: 0,
      renown: 0,
      titles: 0,
      personality: personality as any,
    },
    agentMemory: makeAgentMemory({
      opponentDossiers: { 'stable-bully': dominatedDossier(dossierLosses) } as any,
    }),
    strategy: { intent: 'CONSOLIDATION', planWeeksRemaining: 4 },
  });
  const rivals = [proposer, bully, other];
  const state = makeGameState({ rivals });
  const bid: BoutBid = {
    proposingWarriorId: proposerWarrior.id as any,
    priority: 5,
    description: 'Standard training bout.',
  };
  return { state, rivals, proposer, bully, other, bid, bullyStableWarrior };
}

describe('AI stable avoids (dossier-driven)', () => {
  it('a Pragmatic stable dominated 0-3 by stable-bully never books into it', () => {
    const { state, rivals, bid, bullyStableWarrior } = setup('Pragmatic', 3);
    const offers = convertBidsToOffers(
      [{ bid, rivalId: 'stable-proposer' }],
      rivals,
      state,
      new SeededRNG(11),
      new Set()
    );
    // Only other candidate stable is fully unbookable → no offer at all.
    expect(offers).toHaveLength(0);
    expect(offers.some((o) => o.warriorIds.includes(bullyStableWarrior.id))).toBe(false);
  });

  it('an Aggressive stable ignores its dominated dossier and books anyway', () => {
    const { state, rivals, bid, bullyStableWarrior } = setup('Aggressive', 3);
    const offers = convertBidsToOffers(
      [{ bid, rivalId: 'stable-proposer' }],
      rivals,
      state,
      new SeededRNG(11),
      new Set()
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(bullyStableWarrior.id);
  });

  it('a dominated VENDETTA stable still challenges the bully stable', () => {
    const { state, rivals, proposer, bully, bullyStableWarrior } = setup('Pragmatic', 3);
    const bid: BoutBid = {
      proposingWarriorId: proposer.roster[0]!.id as any,
      targetStableId: bully.id,
      priority: 9,
      description: 'Vendetta target.',
    };
    const offers = convertBidsToOffers(
      [{ bid, rivalId: proposer.id as string }],
      rivals,
      state,
      new SeededRNG(11),
      new Set()
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(bullyStableWarrior.id);
  });

  it('a 0-2 dossier is below the avoid threshold — offer forms normally', () => {
    const { state, rivals, bid, bullyStableWarrior } = setup('Pragmatic', 2);
    const offers = convertBidsToOffers(
      [{ bid, rivalId: 'stable-proposer' }],
      rivals,
      state,
      new SeededRNG(11),
      new Set()
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(bullyStableWarrior.id);
  });

  it('a stable with wins on record never avoids (1-3 is not dominated)', () => {
    const { state, rivals, bid, bullyStableWarrior } = setup('Pragmatic');
    // Overwrite the dossier: some wins on record.
    const proposer = rivals[0]!;
    proposer.agentMemory!.opponentDossiers = {
      'stable-bully': dominatedDossier(3, 1),
    } as any;
    const offers = convertBidsToOffers(
      [{ bid, rivalId: 'stable-proposer' }],
      rivals,
      state,
      new SeededRNG(11),
      new Set()
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]!.warriorIds).toContain(bullyStableWarrior.id);
  });
});
