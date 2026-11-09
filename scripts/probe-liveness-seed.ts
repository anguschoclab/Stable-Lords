/**
 * worldLiveness re-baseline probe — mirrors the competence-gradient +
 * intent/objective-coherence assertions in
 * src/test/engine/sim/worldLiveness.integration.slow.test.ts for one seed:
 * 104 weeks, Master-vs-Novice treasury medians, objWeeks/coherence.
 *
 *   bun run scripts/probe-liveness-seed.ts <seed>
 */
import { enableMapSet } from 'immer';
import { runSimulation } from './simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';

const WEEKS = Number(process.env.PROBE_WEEKS ?? 104);
const seed = Number(process.argv[2]);
if (!Number.isFinite(seed)) {
  console.error('usage: bun run scripts/probe-liveness-seed.ts <seed>');
  process.exit(1);
}

// Same loaded-catalog replication as livingworld-seed-probe.ts — the sim must
// run under vitest-equivalent module state.
enableMapSet();
const { createTestAvatarCatalog } = await import('@/test/_fixtures/avatarCatalog');
globalThis.fetch = async () =>
  new Response(JSON.stringify(createTestAvatarCatalog()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
const { loadAvatarCatalog } = await import('@/engine/avatar/avatarCatalog');
await loadAvatarCatalog();
const { loadCombatNarrative } = await import('@/data/narrative');
await loadCombatNarrative();
engineEventBus.clear();

let n = 0;
setMockIdGenerator(() => `id_${++n}`);

const SERVICING: Record<string, ReadonlySet<string>> = {
  CROWN: new Set(['CROWN_CAMPAIGN']),
  TREASURY: new Set(['WEALTH_ACCUMULATION']),
  REBUILD: new Set(['EXPANSION', 'CONSOLIDATION']),
  TOURNAMENT: new Set(['TOURNAMENT_CAMPAIGN']),
};
let objWeeks = 0;
let coherentWeeks = 0;
const { finalState } = await runSimulation({
  weeks: WEEKS,
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
const topTreas = byTier.get('Master') ?? [];
const noviceTreas = byTier.get('Novice') ?? [];
const gradient = med(topTreas) / Math.max(1, med(noviceTreas));
const coherence = coherentWeeks / Math.max(1, objWeeks);
const pass =
  topTreas.length > 10 && noviceTreas.length > 10 && gradient > 1.3 && objWeeks > 1000 && coherence > 0.12;
console.log(
  `seed=${seed} masterN=${topTreas.length} noviceN=${noviceTreas.length} ` +
    `medM=${med(topTreas).toFixed(0)} medN=${med(noviceTreas).toFixed(0)} ` +
    `gradient=${gradient.toFixed(3)} objWeeks=${objWeeks} coherence=${coherence.toFixed(3)} ` +
    `${pass ? 'PASS' : 'FAIL'}`
);
