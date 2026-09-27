/**
 * Stage H — championship/AI depth metrics on SimPulse.
 * The validation protocol needs the harness to *see* the new behaviors:
 * crown campaigns running, intel aging, masked plans circulating, corner
 * advice firing, and the Grand Championship field/cancellation record.
 */
import { describe, it, expect } from 'vitest';
import { collectPulse } from '@/engine/stats/simulationMetrics';
import { makeGameState, makeRival, makeWarrior } from '@/test/_fixtures/factories';
import { CHAMPIONS_TOURNEY } from '@/constants/arena';
import type { BoutOffer, RivalStableData, ArenaTitle, TournamentEntry } from '@/types/state.types';
import type { StableId, WarriorId, BoutOfferId, PromoterId } from '@/types/shared.types';
import type { BoutResult } from '@/engine/bout/services/boutProcessorTypes';

function rivalWith(
  intent: Parameters<typeof makeRival>[0] extends never ? never : string,
  over: Partial<RivalStableData> = {}
): RivalStableData {
  return makeRival({
    strategy: { intent: intent as never, planWeeksRemaining: 3 },
    ...over,
  });
}

function titleOffer(status: BoutOffer['status'], id: string): BoutOffer {
  return {
    id: id as BoutOfferId,
    promoterId: 'p1' as PromoterId,
    warriorIds: ['a' as WarriorId, 'b' as WarriorId],
    boutWeek: 3,
    expirationWeek: 4,
    purse: 100,
    hype: 30,
    status,
    titleArenaId: 'iron_forge',
    responses: {},
  };
}

function titleWithChampion(warriorId: string): ArenaTitle {
  return {
    champion: {
      warriorId: warriorId as WarriorId,
      startedAbsoluteWeek: 10,
      defenses: 0,
      lastActivityWeek: 10,
    },
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
  };
}

function championsTourney(participants: number, completed = true): TournamentEntry {
  return {
    id: `t-ch-${participants}-${completed}` as TournamentEntry['id'],
    season: 'Winter' as TournamentEntry['season'],
    week: 52,
    tierId: CHAMPIONS_TOURNEY.TIER_ID,
    name: CHAMPIONS_TOURNEY.NAME,
    bracket: [],
    participants: Array.from({ length: participants }, (_, i) => makeWarrior({ id: `cw${i}` as WarriorId })),
    completed,
  };
}

describe('SimPulse championship metrics (Stage H)', () => {
  it('counts rivals actively campaigning for crowns', () => {
    const rivals = [
      rivalWith('CROWN_CAMPAIGN'),
      rivalWith('CROWN_CAMPAIGN'),
      rivalWith('CONSOLIDATION'),
    ];
    const pulse = collectPulse(makeGameState({ rivals }));
    expect(pulse.crownCampaignsActive).toBe(2);
    expect(pulse.crownCampaignsActive).toBe(pulse.intentDistribution.CROWN_CAMPAIGN);
  });

  it('tallies title offers by status', () => {
    const boutOffers = {
      'o-1': titleOffer('Proposed', 'o-1'),
      'o-2': titleOffer('Signed', 'o-2'),
      'o-3': titleOffer('Signed', 'o-3'),
      'o-4': titleOffer('Declined', 'o-4'),
    };
    const pulse = collectPulse(makeGameState({ boutOffers: boutOffers as never }));
    expect(pulse.titleOfferStatuses).toEqual({ Proposed: 1, Signed: 2, Declined: 1 });
  });

  it('reports mean plan-intel staleness across dossiers', () => {
    const rival = makeRival({
      agentMemory: {
        lastTreasury: 0,
        burnRate: 0,
        metaAwareness: {},
        knownRivals: [],
        opponentDossiers: {
          ['s1' as StableId]: {
            lastSeenWeek: 90,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
            planIntel: { suspectedOE: 0.6, suspectedAL: 0.4, lastPlanWeek: 97 },
          },
          ['s2' as StableId]: {
            lastSeenWeek: 90,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
            planIntel: { suspectedOE: 0.3, suspectedAL: 0.7, lastPlanWeek: 93 },
          },
          ['s3' as StableId]: {
            lastSeenWeek: 90,
            knownStyles: [],
            estimatedThreat: 0.5,
            recordVs: { w: 0, l: 0, k: 0 },
            // no planIntel — excluded from the average
          },
        },
      },
    });
    const pulse = collectPulse(makeGameState({ rivals: [rival], absoluteWeek: 100 }));
    // staleness 3 and 7 → mean 5
    expect(pulse.avgPlanIntelStaleness).toBe(5);
    expect(collectPulse(makeGameState({})).avgPlanIntelStaleness).toBe(0);
  });

  it('counts masked scout decoys across rival rosters', () => {
    const masked = makeWarrior({ id: 'mw1' as WarriorId });
    masked.planMasked = true;
    const plain = makeWarrior({ id: 'mw2' as WarriorId });
    const rival = makeRival({ roster: [masked, plain] });
    const pulse = collectPulse(makeGameState({ rivals: [rival] }));
    expect(pulse.maskedScoutReports).toBe(1);
    expect(collectPulse(makeGameState({})).maskedScoutReports).toBe(0);
  });

  it('reports the most recent Grand Championship field size', () => {
    const pulse = collectPulse(
      makeGameState({ tournaments: [championsTourney(6)] as never })
    );
    expect(pulse.grandChampFieldSize).toBe(6);
    expect(collectPulse(makeGameState({})).grandChampFieldSize).toBe(0);
  });

  it('derives Grand Championship cancellations from elapsed years', () => {
    // 120 weeks → two w52 boundaries passed. One Champions tournament ran.
    const pulse = collectPulse(
      makeGameState({
        absoluteWeek: 120,
        tournaments: [championsTourney(6)] as never,
      })
    );
    expect(pulse.grandChampCancellations).toBe(1);
    // No elapsed year boundary → no expectation, no cancellation.
    expect(collectPulse(makeGameState({ absoluteWeek: 10 })).grandChampCancellations).toBe(0);
  });

  it('averages fatigue across reigning champions', () => {
    const champA = makeWarrior({ id: 'chA' as WarriorId });
    champA.fatigue = 40;
    const champB = makeWarrior({ id: 'chB' as WarriorId });
    champB.fatigue = 60;
    const rival = makeRival({ roster: [champB] });
    const pulse = collectPulse(
      makeGameState({
        roster: [champA],
        rivals: [rival],
        arenaChampions: {
          iron_forge: titleWithChampion('chA'),
          the_asylum: titleWithChampion('chB'),
        } as never,
      })
    );
    expect(pulse.avgChampionFatigue).toBe(50);
    expect(collectPulse(makeGameState({})).avgChampionFatigue).toBe(0);
  });

  it('counts corner-advice condition firings in the latest bout week', () => {
    const results = [
      {
        outcome: {
          winner: 'A',
          by: 'Decision',
          minutes: 3,
          log: [],
          exchangeLog: [
            { exchangeIndex: 0, minute: 1, reasonCodes: ['CONDITION_HP_BELOW@CORNER'] },
            { exchangeIndex: 1, minute: 2, reasonCodes: ['AI_INTENT_PRESS'] },
            { exchangeIndex: 2, minute: 3, reasonCodes: ['CONDITION_ENDURANCE_BELOW@CORNER', 'PSYCH_DESPERATE'] },
          ],
        },
      } as unknown as BoutResult,
      {
        outcome: {
          winner: 'D',
          by: 'KO',
          minutes: 1,
          log: [],
          exchangeLog: [{ exchangeIndex: 0, minute: 1, reasonCodes: ['AI_INTENT_PRESS'] }],
        },
      } as unknown as BoutResult,
    ];
    const pulse = collectPulse(
      makeGameState({ lastWeekBoutDisplay: { results, deathNames: [], injuryNames: [] } })
    );
    expect(pulse.cornerAdviceEvents).toBe(2);
    expect(collectPulse(makeGameState({})).cornerAdviceEvents).toBe(0);
  });
});
