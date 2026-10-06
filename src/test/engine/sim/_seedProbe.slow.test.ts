/**
 * F.6 competence-gradient seed probe — scratch diagnostic, not a CI gate.
 * Replicates the gradient computation from worldLiveness.integration.slow.test.ts
 * so a re-baseline after a world-trajectory change (new arena event, purse fix,
 * etc.) can measure multiple seeds cheaply. Run:
 *   PROBE_SEEDS=42,777,1337 bun x vitest run --config vitest.config.slow.ts \
 *     src/test/engine/sim/_seedProbe.slow.test.ts
 */
import { describe, it, vi } from 'vitest';
import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { NewsletterFeed } from '@/engine/newsletter/feed';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};

// Skipped unless PROBE_SEEDS is set — a diagnostic harness, not a CI gate.
describe.skipIf(!process.env.PROBE_SEEDS)('F.6 competence-gradient seed probe', () => {
  it('measures the treasury gradient for PROBE_SEEDS', async () => {
    const seeds = (process.env.PROBE_SEEDS ?? '31337').split(',').map(Number);
    for (const seed of seeds) {
      let n = 0;
      setMockIdGenerator(() => `id_${++n}`);
      engineEventBus.clear();
      NewsletterFeed.clear();
      const { finalState } = await runSimulation({
        weeks: 104,
        seed,
        logFrequency: 104, // gradient only needs finalState
        ignoreBankruptcy: true,
      });
      const byTier = new Map<string, number[]>();
      for (const r of finalState.rivals) {
        const tier = r.owner?.competence;
        if (!tier) continue;
        (byTier.get(tier) ?? byTier.set(tier, []).get(tier)!).push(r.treasury);
      }
      const top = [...(byTier.get('Master') ?? []), ...(byTier.get('Veteran') ?? [])];
      const nov = byTier.get('Novice') ?? [];
      const gradient = med(top) / Math.max(1, med(nov));
      console.log(
        `PROBE seed=${seed} topMed=${med(top)} novMed=${med(nov)} n=${top.length}/${nov.length} gradient=${gradient.toFixed(4)}`
      );
    }
  }, 3600000);
});
