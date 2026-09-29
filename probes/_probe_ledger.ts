import { runSimulation } from '../src/scripts/simulation-harness';
const snaps: Record<number, any> = {};
await runSimulation({ weeks: 120, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any, w: number) => { if (w === 60 || w === 120) {
    const agg: Record<string, number> = {}; let n = 0; const lo = s.week - 9;
    const inWin = (e: any) => { const d = (s.week - e.week + 52) % 52; return d < 10; };
    for (const r of s.rivals) { n++; for (const e of r.ledger ?? []) if (inWin(e)) { const k = `${e.amount >= 0 ? '+' : '-'} ${e.category}: ${e.label.split(' — ')[0].replace(/[0-9]+/g, '#').slice(0, 38)}`; agg[k] = (agg[k] ?? 0) + e.amount; } }
    const perStableWeek = Object.fromEntries(Object.entries(agg).filter(([,v]: any) => Math.abs(v) >= 45*10*5).map(([k, v]) => [k, Math.round(v / n / 10)]).sort((a: any, b: any) => Math.abs(b[1]) - Math.abs(a[1])));
    snaps[w] = { rivals: n, perStableWeek, net: Object.values(perStableWeek).reduce((a: any, b: any) => a + b, 0) }; } } });
console.log(JSON.stringify(snaps, null, 1));
