import { runSimulation } from '../src/scripts/simulation-harness';
import { getNPCPlan } from '../src/engine/bout/services/boutResolution';
import { defaultPlanForWarrior } from '../src/engine/simulate';
let st: any;
await runSimulation({ weeks: 30, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true, onWeek: (s: any) => { st = s; } });
const acc: Record<string, number[]> = {}; const dacc: Record<string, number[]> = {};
const push = (m: any, k: string, v: any) => { if (typeof v === 'number') (m[k] ??= []).push(v); };
const styles = ['WALL OF STEEL','LUNGING ATTACK','BASHING ATTACK','PARRY-STRIKE'];
const wsAttr: Record<string, number[]> = {}; const allAttr: Record<string, number[]> = {};
for (const r of st.rivals) for (const w of r.roster) {
  const p = getNPCPlan(st, w, styles[w.id.length % 4] as any, undefined, undefined);
  const d = defaultPlanForWarrior(w);
  for (const k of ['killDesire','OE','AL']) { push(acc, k, (p as any)[k]); push(dacc, k, (d as any)[k]); }
  for (const [k, v] of Object.entries(w.attributes ?? {})) { push(allAttr, k, v); if (w.style === 'WALL OF STEEL') push(wsAttr, k, v); }
}
const avg = (m: any) => Object.fromEntries(Object.entries(m).map(([k, v]: any) => [k, +(v.reduce((a: number, b: number) => a + b, 0) / v.length).toFixed(2)]));
const hist = (a: number[]) => a.reduce((m: any, v) => (m[v] = (m[v] ?? 0) + 1, m), {});
console.log(JSON.stringify({ npcPlanAvg: avg(acc), defaultPlanAvg: avg(dacc), npcKDhist: hist(acc.killDesire ?? []), wsAttr: avg(wsAttr), allAttr: avg(allAttr) }));
