import { runSimulation } from '../src/scripts/simulation-harness';
let first: any, last: any; const seen = new Set<string>(); let playerBouts = 0;
await runSimulation({ weeks: 30, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any, w: number) => { if (w === 1) first = structuredClone(s.roster); last = s;
    const ids = new Set(first.map((x: any) => x.id));
    for (const b of s.arenaHistory) { if (seen.has(b.id)) continue; seen.add(b.id); if (ids.has(b.warriorIdA) || ids.has(b.warriorIdD)) playerBouts++; } } });
const all = [...last.roster, ...(last.graveyard ?? []), ...(last.retired ?? [])];
for (const w of first) { const n = all.find((x: any) => x.id === w.id); console.log(w.id, JSON.stringify({ career0: w.career, careerNow: n?.career, xp0: w.xp, xpNow: n?.xp })); }
console.log('player bouts', playerBouts);
