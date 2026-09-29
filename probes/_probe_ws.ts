import { FightingStyle } from '../src/types/game';
import { simulateFight, defaultPlanForWarrior } from '../src/engine/simulate';
import { loadCombatNarrative } from '../src/data/narrative';
import { makeComputedWarrior } from '../src/test/_fixtures/factories';
import { generateArchetypeAttrs } from '../src/engine/factories/statGeneration';
import { SeededRNGService } from '../src/utils/random';
await loadCombatNarrative();
const S = Object.values(FightingStyle); const WS = FightingStyle.WallOfSteel;
function philAttrs(bias: Record<string, number>, rng: SeededRNGService) {
  const a: any = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 }; let pool = 49; const wt: string[] = [];
  for (const k of Object.keys(a)) for (let i = 0; i < (bias[k] ?? 1); i++) wt.push(k);
  let n = 0; while (pool > 0 && n++ < 500) { const k = wt[Math.floor(rng.next() * wt.length)]; if (a[k] >= 25) continue;
    const add = Math.min(pool, 25 - a[k], Math.floor(rng.next() * 4) + 1); a[k] += add; pool -= add; } return a; }
const IRON = { CN: 3, WL: 3, SZ: 1 };
function run(label: string, wsAttrs: (r: SeededRNGService) => any, planMod: any, N = 200) {
  const rng = new SeededRNGService(99); let w = 0, f = 0;
  for (const d of S) for (let i = 0; i < N; i++) {
    const a = makeComputedWarrior(wsAttrs(rng), WS, { id: 'A' as any, name: 'A', fame: 0, age: 20 });
    const o = makeComputedWarrior(generateArchetypeAttrs(d, rng), d, { id: 'D' as any, name: 'D', fame: 0, age: 20 });
    const p = defaultPlanForWarrior(a); const pm = { ...p, OE: Math.max(1, (p.OE ?? 5) + (planMod.OE ?? 0)), AL: Math.max(1, (p.AL ?? 5) + (planMod.AL ?? 0)), killDesire: Math.max(1, (p.killDesire ?? 5) + (planMod.killDesire ?? 0)) };
    const out = i % 2 ? simulateFight(pm, defaultPlanForWarrior(o), a, o, 5000 + f * 13) : simulateFight(defaultPlanForWarrior(o), pm, o, a, 5000 + f * 13);
    f++; if ((i % 2 && out.winner === 'A') || (!(i % 2) && out.winner === 'D')) w++; }
  console.log(label, (w / f * 100).toFixed(1) + '%'); }
run('WS archetype stats, default plan        ', r => generateArchetypeAttrs(WS, r), {});
run('WS Iron-Defense stats, default plan     ', r => philAttrs(IRON, r), {});
run('WS archetype stats, Iron-Defense plan   ', r => generateArchetypeAttrs(WS, r), { OE: -2, AL: -1, killDesire: -2 });
run('WS Iron-Defense stats + plan (world-ish)', r => philAttrs(IRON, r), { OE: -2, AL: -1, killDesire: -2 });
