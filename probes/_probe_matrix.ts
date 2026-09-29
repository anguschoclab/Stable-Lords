import { FightingStyle } from '../src/types/game';
import { simulateFight, defaultPlanForWarrior } from '../src/engine/simulate';
import { loadCombatNarrative } from '../src/data/narrative';
import { makeComputedWarrior } from '../src/test/_fixtures/factories';
import { generateArchetypeAttrs } from '../src/engine/factories/statGeneration';
import { SeededRNGService } from '../src/utils/random';
await loadCombatNarrative();
const S = Object.values(FightingStyle);
const WS = FightingStyle.WallOfSteel;
function wsAdvisor(rng: SeededRNGService) { // same budget, priorities ST/SP/DF/CN
  const a: any = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 }; let pool = 70 - 21;
  for (const k of ['ST','SP','DF','CN']) { const add = Math.min(8 + Math.floor(rng.next()*5), pool); a[k] += add; pool -= add; }
  const ks = ['SZ','WT','WL']; while (pool > 0) { a[ks[pool % 3]]++; pool--; } return a; }
function run(label: string, attrsFor: (s: any, rng: SeededRNGService) => any, N = 40) {
  const rng = new SeededRNGService(777); let fights = 0, kills = 0, dec = 0; const w: any = {}, f: any = {};
  for (const a of S) for (const d of S) for (let i = 0; i < N; i++) {
    const wA = makeComputedWarrior(attrsFor(a, rng), a, { id: `A${i}` as any, name: 'A', fame: 0, age: 20 });
    const wD = makeComputedWarrior(attrsFor(d, rng), d, { id: `D${i}` as any, name: 'D', fame: 0, age: 20 });
    const o = simulateFight(defaultPlanForWarrior(wA), defaultPlanForWarrior(wD), wA, wD, 1000 + fights * 31);
    fights++; if (o.by === 'Kill') kills++; if (o.by === 'Decision') dec++;
    f[a] = (f[a] ?? 0) + 1; f[d] = (f[d] ?? 0) + 1;
    if (o.winner === 'A') w[a] = (w[a] ?? 0) + 1; else if (o.winner === 'D') w[d] = (w[d] ?? 0) + 1; }
  const wr = Object.fromEntries(S.map(s => [s, +((w[s] ?? 0) / f[s] * 100).toFixed(1)]));
  console.log(label, JSON.stringify({ killPct: +(kills/fights*100).toFixed(2), decisionPct: +(dec/fights*100).toFixed(1), WS: wr[WS], min: Math.min(...Object.values(wr) as number[]), max: Math.max(...Object.values(wr) as number[]) }));
  return wr; }
run('A harness-15s    ', () => ({ ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 }));
run('B flat-10s (70pt)', () => ({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 }));
const wrC = run('C archetype-gen  ', (s, rng) => generateArchetypeAttrs(s, rng));
console.log('  C per-style', JSON.stringify(wrC));
run('D archetype, WS=advisor build', (s, rng) => s === WS ? wsAdvisor(rng) : generateArchetypeAttrs(s, rng));
