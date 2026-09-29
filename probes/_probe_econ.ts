import { runSimulation } from '../src/scripts/simulation-harness';
const rows: any[] = []; const W = Number(process.env.W ?? 400);
await runSimulation({ weeks: W, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any, w: number) => { if (w % 50 !== 0 && w !== 1) return;
    const t = s.rivals.map((r: any) => r.treasury ?? 0).sort((a: number, b: number) => a - b);
    const ros = s.rivals.map((r: any) => r.roster.length);
    rows.push({ w, player: s.treasury, playerRoster: s.roster.length, rivals: t.length,
      rivalMean: Math.round(t.reduce((a: number, b: number) => a + b, 0) / t.length), rivalMedian: t[t.length >> 1], rivalMax: t.at(-1),
      avgRoster: +(ros.reduce((a: number, b: number) => a + b, 0) / ros.length).toFixed(1) }); } });
console.table(rows);
