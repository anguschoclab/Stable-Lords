/**
 * livingWorld re-baseline probe — runs the same 200-week seeded world as
 * src/test/integration/livingWorld.slow.test.ts for one seed and prints the
 * metrics its assertions pin, so a new seed can be chosen with the most
 * style-band margin (V25 precedent: TP's canon-dominant ~62.3 world center
 * means re-seed, not nerf).
 *
 *   bun run scripts/livingworld-seed-probe.ts <seed>
 */
import { enableMapSet } from 'immer';
import { runSimulation } from './simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { WORLD_RIVAL_FLOOR, WORLD_RIVAL_SOFT_CAP } from '@/constants/world';
import { BASE_RESERVE } from '@/engine/ai/workers/budgetWorker';
import { aiRosterMax, aiRosterMin } from '@/constants/ai';
import { isActive } from '@/engine/warrior/warriorStatus';
import { FightingStyle } from '@/types/shared.types';

const WEEKS = Number(process.env.PROBE_WEEKS ?? process.argv[3] ?? 200);
const seed = Number(process.argv[2]);
if (!Number.isFinite(seed)) {
  console.error('usage: bun run scripts/livingworld-seed-probe.ts <seed>');
  process.exit(1);
}

// Replicate src/test/_setup/setup.node.ts + the spec's beforeAll — the probe
// must run the sim under the same loaded-catalog state as vitest or the
// trajectories (and so the style rates) silently diverge.
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
const { finalState, pulses, cumulative } = await runSimulation({
  weeks: WEEKS,
  seed,
  logFrequency: 10,
});

const styleRate = (style: string) => {
  const wins = cumulative.styleWins[style] ?? 0;
  const losses = cumulative.styleLosses[style] ?? 0;
  return wins / Math.max(1, wins + losses);
};

const counts = pulses.map((p) => p.rivalCount);
const min = Math.min(...counts);
const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
const variance = counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length;
const founders = finalState.rivals.filter((r) => r.owner.foundedByWarriorId).length;
const solvent = finalState.rivals.filter((r) => r.treasury >= BASE_RESERVE * 10);
const fills = solvent.map(
  (r) => r.roster.filter((w) => isActive(w)).length / aiRosterMax(r.owner.personality)
);
const avgFill = fills.length ? fills.reduce((a, b) => a + b, 0) / fills.length : 0;
const starved = solvent.filter(
  (r) => r.roster.filter((w) => isActive(w)).length < aiRosterMin(r.owner.personality)
).length;
const killRate = cumulative.weeklyKills / Math.max(1, cumulative.weeklyBouts);

const rates = Object.values(FightingStyle).map((s) => ({
  style: s,
  rate: styleRate(s),
}));
const oob = rates.filter((r) => r.rate < 0.38 || r.rate > 0.62);
const tpMargin = 0.62 - (rates.find((r) => r.style === FightingStyle.TotalParry)?.rate ?? 1);

console.log(`seed=${seed}`);
for (const r of rates) console.log(`  ${r.style.padEnd(18)} ${(r.rate * 100).toFixed(1)}%`);
console.log(
  `  rivals min=${min} final=${finalState.rivals.length} (floor ${WORLD_RIVAL_FLOOR}, cap ${WORLD_RIVAL_SOFT_CAP})` +
    ` legacy=${founders} fill=${avgFill.toFixed(3)} starved=${starved}/${solvent.length}` +
    ` kill=${(killRate * 100).toFixed(2)}% variance=${variance.toFixed(1)}`
);
console.log(
  `  VERDICT seed=${seed}: ${oob.length === 0 ? 'BAND-OK' : 'OOB ' + oob.map((r) => r.style).join(',')} tpMargin=${(tpMargin * 100).toFixed(1)}pts`
);
