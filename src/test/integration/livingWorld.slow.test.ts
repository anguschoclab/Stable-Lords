// @vitest-environment node
/**
 * Living world — the 90→150+ population guardrail (megaplan).
 *
 * worldBalance.slow.test.ts certifies style mechanics over 200 weeks; this
 * file certifies the *population model*: a 1000-week seeded world must hold
 * the WORLD_RIVAL_FLOOR, grow past 120 through legacy founders and organic
 * licensing, and show real ebb-and-flow variance — never a flat constant
 * count. Rosters of solvent stables should stay near their personality caps.
 *
 * Run with:
 *   npx vitest run --config vitest.config.slow.ts src/test/integration/livingWorld.slow.test.ts
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { runSimulation, type CumulativeStats } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { WORLD_RIVAL_FLOOR, AI_RECRUIT_SIGNING_RESERVE } from '@/constants/world';
import { aiRosterMax, aiRosterMin } from '@/constants/ai';
import { isActive } from '@/engine/warrior/warriorStatus';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import type { SimPulse } from '@/engine/stats/simulationMetrics';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

const WEEKS = 1000;
const KILL_LOW = 0.04;
const KILL_HIGH = 0.14;

describe('Living rival world — 1000-week seeded run', () => {
  let finalState: GameState;
  let pulses: SimPulse[];
  let cumulative: CumulativeStats;

  const styleRate = (style: string) => {
    const wins = cumulative.styleWins[style] ?? 0;
    const losses = cumulative.styleLosses[style] ?? 0;
    return wins / Math.max(1, wins + losses);
  };

  beforeAll(async () => {
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    engineEventBus.clear();
    NewsletterFeed.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await runSimulation({
      weeks: WEEKS,
      seed: 12345,
      logFrequency: 10,
    });
    vi.restoreAllMocks();
    finalState = result.finalState;
    pulses = result.pulses;
    cumulative = result.cumulative;
  }, 600000);
  afterAll(() => vi.restoreAllMocks());

  it('never drops below the world rival floor', () => {
    const counts = pulses.map((p) => p.rivalCount);
    const min = Math.min(...counts);
    expect(
      min,
      `rival count dipped to ${min} (floor ${WORLD_RIVAL_FLOOR}); counts: ${counts.slice(0, 20)}…`
    ).toBeGreaterThanOrEqual(WORLD_RIVAL_FLOOR);
  });

  it('grows past 120 stables by maturity', () => {
    const count = finalState.rivals.length;
    expect(
      count,
      `world ended at ${count} stables — organic growth + legacy founders should push past 120`
    ).toBeGreaterThanOrEqual(120);
    expect(count).toBeLessThanOrEqual(200);
  });

  it('has at least one legacy-founded stable', () => {
    const founders = finalState.rivals.filter((r) => r.owner.foundedByWarriorId);
    expect(
      founders.length,
      'no legacy-founded stables after 1000 weeks — the founder pipeline is dead'
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows real ebb and flow (rival count is not constant)', () => {
    const counts = pulses.map((p) => p.rivalCount);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length;
    expect(variance, 'rival count is flat — no churn or growth is happening').toBeGreaterThan(0);
  });

  it('solvent stables keep rosters at least 95% filled to cap', () => {
    const solvent = finalState.rivals.filter((r) => r.treasury >= AI_RECRUIT_SIGNING_RESERVE * 10);
    expect(solvent.length).toBeGreaterThan(0);
    const fills = solvent.map(
      (r) =>
        r.roster.filter((w) => isActive(w)).length / aiRosterMax(r.owner.personality)
    );
    const avgFill = fills.reduce((a, b) => a + b, 0) / fills.length;
    expect(
      avgFill,
      `solvent-stable roster fill ${(avgFill * 100).toFixed(1)}% < 95%`
    ).toBeGreaterThanOrEqual(0.95);
    // And almost none should be below their personality minimum.
    const starved = solvent.filter(
      (r) => r.roster.filter((w) => isActive(w)).length < aiRosterMin(r.owner.personality)
    );
    expect(
      starved.length,
      `${starved.length} solvent stables sit below their roster minimum`
    ).toBeLessThanOrEqual(Math.ceil(solvent.length * 0.05));
  });

  it('styles stay in the balance band', () => {
    const styles = Object.values(FightingStyle) as string[];
    const report = styles
      .map((s) => `  ${s.padEnd(18)} ${(styleRate(s) * 100).toFixed(1)}%`)
      .join('\n');
    const problems = styles.filter((s) => styleRate(s) < 0.38 || styleRate(s) > 0.62);
    expect(problems, `\n=== STYLE WIN RATES (${WEEKS} weeks) ===\n${report}`).toEqual([]);
  });

  it(`weekly arena kill rate stays between ${KILL_LOW * 100}% and ${KILL_HIGH * 100}%`, () => {
    const killRate = cumulative.weeklyKills / Math.max(1, cumulative.weeklyBouts);
    expect(killRate, `kill rate ${(killRate * 100).toFixed(2)}%`).toBeGreaterThanOrEqual(KILL_LOW);
    expect(killRate).toBeLessThanOrEqual(KILL_HIGH);
  });
});
