import { describe, it, vi, beforeEach } from 'vitest';
import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

function reset() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
}

// Temporary seed probe for the competence-gradient re-baseline — same
// metrics as worldLiveness.integration.slow.test.ts, no assertions.
describe('seed probe', () => {
  beforeEach(reset, 120000);

  it('measures gradient/coherence/objWeeks for WL_SEED', async () => {
    const seed = Number(process.env.WL_SEED ?? 777);
    const SERVICING: Record<string, ReadonlySet<string>> = {
      CROWN: new Set(['CROWN_CAMPAIGN']),
      TREASURY: new Set(['WEALTH_ACCUMULATION']),
      REBUILD: new Set(['EXPANSION', 'CONSOLIDATION']),
      TOURNAMENT: new Set(['TOURNAMENT_CAMPAIGN']),
    };
    let objWeeks = 0;
    let coherentWeeks = 0;
    const { finalState } = await runSimulation({
      weeks: 104,
      seed,
      logFrequency: 4,
      ignoreBankruptcy: true,
      onWeek: (state) => {
        for (const r of state.rivals ?? []) {
          const obj = r.agentMemory?.seasonObjective;
          const intent = r.agentMemory?.currentIntent;
          if (!obj || !intent) continue;
          objWeeks++;
          if (SERVICING[obj.kind]?.has(intent)) coherentWeeks++;
        }
      },
    });

    const med = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)] ?? 0;
    };
    const byTier = new Map<string, number[]>();
    for (const r of finalState.rivals) {
      const tier = r.owner?.competence;
      if (!tier) continue;
      (byTier.get(tier) ?? byTier.set(tier, []).get(tier)!).push(r.treasury);
    }
    const topTreas = [...(byTier.get('Master') ?? []), ...(byTier.get('Veteran') ?? [])];
    const noviceTreas = byTier.get('Novice') ?? [];
    const gradient = med(topTreas) / Math.max(1, med(noviceTreas));
    const coherence = coherentWeeks / Math.max(1, objWeeks);
    console.log(
      `[probe] seed=${seed} gradient=${gradient.toFixed(4)} ` +
        `(top n=${topTreas.length}, nov n=${noviceTreas.length}) ` +
        `coherence=${coherence.toFixed(3)} objWeeks=${objWeeks}`
    );
  }, 1200000);
});
