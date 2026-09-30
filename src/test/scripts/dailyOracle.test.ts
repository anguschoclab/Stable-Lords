// @vitest-environment node
/**
 * daily_oracle computeMetrics — pins the corrected measurement semantics:
 * economy reads RIVAL treasury (not the autopiloted player's), mortality is
 * over weekly bouts only, and kill/death divergence exposes roster corruption.
 */
import { describe, it, expect } from 'vitest';
import { computeMetrics } from '@/scripts/daily_oracle';
import type { SimPulse } from '@/engine/stats/simulationMetrics';

const makePulse = (over: Partial<SimPulse> = {}): SimPulse => ({
  week: 1,
  playerTreasury: 0,
  rosterSize: 0,
  deadCount: 0,
  retiredCount: 0,
  rivalCount: 0,
  avgRivalTreasury: 0,
  medianRivalTreasury: 0,
  totalBouts: 0,
  traitedWarriors: 0,
  totalTraits: 0,
  flawInstances: 0,
  multiFlawWarriors: 0,
  classTraitInstances: 0,
  signatureInstances: 0,
  intentDistribution: {},
  playerChallengedWeeks: 0,
  vendettaCount: 0,
  avgDossierCoverage: 0,
  counterOfferRate: 0,
  aiCrownsHeld: 0,
  playerCrownsHeld: 0,
  liveTitleOffers: 0,
  reignEndings: {},
  grandChampionsCount: 0,
  crownCampaignsActive: 0,
  titleOfferStatuses: {},
  avgPlanIntelStaleness: 0,
  maskedScoutReports: 0,
  grandChampFieldSize: 0,
  grandChampCancellations: 0,
  avgChampionFatigue: 0,
  cornerAdviceEvents: 0,
  ...over,
});

const makeResult = (
  cumulative: Record<string, unknown>,
  pulses: SimPulse[] = [makePulse()]
) =>
  ({
    pulses,
    cumulative: {
      styleWins: {},
      styleLosses: {},
      deaths: 0,
      totalBouts: 0,
      weeklyBouts: 0,
      weeklyKills: 0,
      tournamentBouts: 0,
      tournamentKills: 0,
      ...cumulative,
    },
  }) as unknown as Parameters<typeof computeMetrics>[0];

describe('daily_oracle computeMetrics', () => {
  it('reads rival treasury for economy, not the player treasury', () => {
    // Regression: the stale report averaged the PLAYER treasury (one
    // autopiloted stable), producing phantom hyper-inflation readings.
    const m = computeMetrics(
      makeResult({}, [
        makePulse({ playerTreasury: 999999, avgRivalTreasury: 1200, medianRivalTreasury: 800 }),
      ])
    );
    expect(m.avgEconomy).toBe(1200);
    expect(m.rivalTreasuryMean).toBe(1200);
    expect(m.rivalTreasuryMedian).toBe(800);
  });

  it('computes kill rate over weekly bouts only, excluding tournament bouts', () => {
    const m = computeMetrics(
      makeResult({
        weeklyBouts: 1000,
        weeklyKills: 60,
        tournamentBouts: 500,
        tournamentKills: 50,
        totalBouts: 1500,
      })
    );
    // 60/1000 = 6%; the old total-bouts denominator would read 110/1500 ≈ 7.33%.
    expect(m.killRate).toBeCloseTo(0.06, 6);
    expect(m.mortalityRate).toBe(m.killRate);
    expect(m.killRate).not.toBeCloseTo(110 / 1500, 6);
  });

  it('flags kill outcomes with no matching unique death as positive divergence', () => {
    const m = computeMetrics(
      makeResult({ weeklyBouts: 100, weeklyKills: 10, tournamentKills: 5, deaths: 10 })
    );
    expect(m.killDeathDivergence).toBe(5); // 15 kills - 10 deaths
  });

  it('returns zero rates on an empty simulation', () => {
    const m = computeMetrics(makeResult({}, [makePulse({ week: 1000 })]));
    expect(m.killRate).toBe(0);
    expect(m.avgEconomy).toBe(0);
  });
});
