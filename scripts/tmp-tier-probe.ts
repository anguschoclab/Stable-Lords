import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';

let n = 0;
setMockIdGenerator(() => `id_${++n}`);
engineEventBus.clear();
const { finalState } = await runSimulation({ weeks: 104, seed: 42, logFrequency: 104, ignoreBankruptcy: true });
const tiers = new Map<string, { t: number[]; w: number[]; l: number[]; roster: number[] }>();
for (const r of finalState.rivals) {
  const tier = r.owner?.competence ?? 'none';
  const g = tiers.get(tier) ?? { t: [], w: [], l: [], roster: [] };
  g.t.push(r.treasury);
  g.w.push(r.wins ?? 0);
  g.l.push(r.losses ?? 0);
  g.roster.push(r.roster.length);
  tiers.set(tier, g);
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
for (const [tier, g] of tiers) {
  console.log(`${tier}: n=${g.t.length} medTreas=${med(g.t)} medWins=${med(g.w)} medLosses=${med(g.l)} medRoster=${med(g.roster)}`);
}
