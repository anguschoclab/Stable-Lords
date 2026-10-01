/**
 * World balance — the deployed-population guardrail.
 *
 * balance.slow.test.ts certifies style mechanics on synthetic fixtures. This
 * file certifies what players actually meet: a seeded world of AI stables
 * run forward 200 weeks — real recruits, fitted weapons, training, aging,
 * AI fight plans, matchmaking — read through the same cumulative tracker the
 * daily oracle uses.
 *
 * Bands are deliberately wider than the tuning target (every style 44–57%
 * over 1000 weeks × 3 seeds; weekly kills ~8%) because 200 weeks of one seed
 * is a noisier sample. They exist to catch a style falling out of the world
 * or the kill path dying/overheating — not to pin the meta flat. Which style
 * sits on top is allowed to move.
 *
 * Run with: npx vitest run --config vitest.config.slow.ts src/test/engine/economy/worldBalance.slow.test.ts
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { runSimulation, type CumulativeStats } from '@/scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { FightingStyle } from '@/types/shared.types';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

const WEEKS = 200;
const STYLE_LOW = 0.38;
const STYLE_HIGH = 0.62;
const KILL_LOW = 0.04;
const KILL_HIGH = 0.14;

describe('World balance (200-week seeded world)', () => {
  let cumulative: CumulativeStats;
  const rate = (style: string) => {
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
      logFrequency: 50,
      ignoreBankruptcy: true,
    });
    vi.restoreAllMocks();
    cumulative = result.cumulative;
  }, 600000);

  it(`every style wins between ${STYLE_LOW * 100}% and ${STYLE_HIGH * 100}% of its bouts`, () => {
    const styles = Object.values(FightingStyle) as string[];
    const report = styles.map((s) => `  ${s.padEnd(18)} ${(rate(s) * 100).toFixed(1)}%`).join('\n');
    const problems = styles.filter((s) => rate(s) < STYLE_LOW || rate(s) > STYLE_HIGH);
    expect(problems, `\n=== WORLD STYLE WIN RATES (${WEEKS} weeks) ===\n${report}`).toEqual([]);
  });

  it('every style actually fights (no style drops out of the world)', () => {
    for (const s of Object.values(FightingStyle) as string[]) {
      const bouts = (cumulative.styleWins[s] ?? 0) + (cumulative.styleLosses[s] ?? 0);
      expect(bouts, `${s} fought only ${bouts} bouts`).toBeGreaterThan(500);
    }
  });

  it(`weekly arena kill rate sits between ${KILL_LOW * 100}% and ${KILL_HIGH * 100}%`, () => {
    const killRate = cumulative.weeklyKills / Math.max(1, cumulative.weeklyBouts);
    expect(
      killRate,
      `weekly kill rate ${(killRate * 100).toFixed(2)}% (${cumulative.weeklyKills}/${cumulative.weeklyBouts})`
    ).toBeGreaterThanOrEqual(KILL_LOW);
    expect(killRate).toBeLessThanOrEqual(KILL_HIGH);
  });
});
