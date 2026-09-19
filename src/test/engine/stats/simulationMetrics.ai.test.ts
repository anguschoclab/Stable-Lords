import { describe, it, expect } from 'vitest';
import { collectPulse } from '@/engine/stats/simulationMetrics';
import { makeGameState, makeRival, makeWarrior } from '@/test/_fixtures/factories';
import type { BoutOffer, RivalStableData, AIAgentMemory, AIIntent } from '@/types/state.types';
import type { StableId, WarriorId, BoutOfferId, PromoterId } from '@/types/shared.types';

function rivalWith(intent: AIIntent, dossierCount = 0): RivalStableData {
  const dossiers: AIAgentMemory['opponentDossiers'] = {};
  for (let i = 0; i < dossierCount; i++) {
    dossiers[`s-${i}` as StableId] = {
      lastSeenWeek: 2,
      recordVs: { w: 0, l: 0, k: 0 },
      knownStyles: [],
      estimatedThreat: 0.5,
    };
  }
  return makeRival({
    strategy: { intent, planWeeksRemaining: 3 },
    agentMemory: {
      lastTreasury: 0,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
      opponentDossiers: dossiers,
    },
  });
}

function offer(warriorIds: WarriorId[], over: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: `o-${warriorIds.join('-')}` as BoutOfferId,
    promoterId: 'p1' as PromoterId,
    warriorIds,
    boutWeek: 3,
    expirationWeek: 4,
    purse: 100,
    hype: 30,
    status: 'Proposed',
    responses: {},
    ...over,
  };
}

describe('SimPulse AI metrics (I.1)', () => {
  it('reports the rival intent distribution', () => {
    const rivals = [
      rivalWith('VENDETTA'),
      rivalWith('VENDETTA'),
      rivalWith('CONSOLIDATION'),
      rivalWith('WEALTH_ACCUMULATION'),
    ];
    const pulse = collectPulse(makeGameState({ rivals }));
    expect(pulse.intentDistribution).toEqual({
      VENDETTA: 2,
      CONSOLIDATION: 1,
      WEALTH_ACCUMULATION: 1,
    });
    expect(pulse.vendettaCount).toBe(2);
  });

  it('flags weeks where a proposed offer targets a player warrior', () => {
    const playerWarrior = makeWarrior({ id: 'pw-1' as WarriorId });
    const state = makeGameState({
      roster: [playerWarrior],
      boutOffers: {
        'o-1': offer([playerWarrior.id, 'rw-9' as WarriorId]),
        'o-2': offer(['rw-1' as WarriorId, 'rw-2' as WarriorId]),
      } as never,
    });
    expect(collectPulse(state).playerChallengedWeeks).toBe(1);
    expect(collectPulse(makeGameState({ roster: [playerWarrior] })).playerChallengedWeeks).toBe(0);
  });

  it('averages dossier coverage across rivals', () => {
    const rivals = [rivalWith('EXPANSION', 4), rivalWith('EXPANSION', 2), rivalWith('EXPANSION', 0)];
    expect(collectPulse(makeGameState({ rivals })).avgDossierCoverage).toBe(2);
  });

  it('reports the counter-offer rate across standing offers', () => {
    const boutOffers = {
      'o-1': offer(['a' as WarriorId, 'b' as WarriorId], { counterPurseBump: 100 }),
      'o-2': offer(['c' as WarriorId, 'd' as WarriorId]),
      'o-3': offer(['e' as WarriorId, 'f' as WarriorId], { counterPurseBump: 50 }),
      'o-4': offer(['g' as WarriorId, 'h' as WarriorId]),
    };
    expect(collectPulse(makeGameState({ boutOffers: boutOffers as never })).counterOfferRate).toBe(0.5);
    expect(collectPulse(makeGameState({})).counterOfferRate).toBe(0);
  });
});
