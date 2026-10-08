// @vitest-environment node
/**
 * TEMPORARY V14 re-baseline probe — measures the competence gradient and
 * reignEndings distribution across seeds on the post-V14 (weekly-truncation)
 * tree. Not part of the suite; deleted after re-baselining.
 */
import { describe, it, vi, beforeEach } from 'vitest';
import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

const SEEDS = [777, 31337, 42, 555, 1234, 2024];

const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};

describe('v14 re-baseline probe', () => {
  beforeEach(() => {
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    engineEventBus.clear();
  }, 120000);

  for (const seed of SEEDS) {
    it(`seed ${seed}: gradient + reignEndings`, async () => {
      const { finalState, pulses } = await runSimulation({
        weeks: 104,
        seed,
        logFrequency: 4,
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
      const endings = pulses[pulses.length - 1]!.reignEndings;
      console.log(
        `[probe] seed=${seed} gradient=${gradient.toFixed(3)} ` +
          `(top n=${top.length} med=${med(top)}, nov n=${nov.length} med=${med(nov)}) ` +
          `endings=${JSON.stringify(endings)}`
      );
    }, 600000);
  }
});
