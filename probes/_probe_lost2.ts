import { runSimulation } from '../src/scripts/simulation-harness';
let first: any, last: any;
await runSimulation({ weeks: 20, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true, onWeek: (s: any, w: number) => { if (w === 1) first = structuredClone(s.rivals[0].roster); last = s; } });
const byId = new Map(last.rivals.flatMap((r: any) => r.roster).map((w: any) => [w.id, w]));
for (const w of first.slice(0, 3)) { const n: any = byId.get(w.id);
  console.log(w.id, JSON.stringify({ w1: { career: w.career, fame: w.fame, lbw: w.lastBoutWeek, xp: w.xp }, w20: n ? { career: n.career, fame: n.fame, lbw: n.lastBoutWeek, xp: n.xp } : 'gone' })); }
const hist = last.arenaHistory.filter((b: any) => b.warriorIdA === first[0].id || b.warriorIdD === first[0].id).length;
console.log('bouts in history for first warrior:', hist);
