import { runSimulation } from '../src/scripts/simulation-harness';
const t0 = performance.now();
const r = await runSimulation({ weeks: 52, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true, profile: true });
const wall = performance.now() - t0;
const rows = (r.profile ?? []).map((p: any) => ({ ...p })).sort((a: any, b: any) => (b.totalMs ?? b.ms ?? 0) - (a.totalMs ?? a.ms ?? 0));
const tot = rows.reduce((a: number, p: any) => a + (p.totalMs ?? p.ms ?? 0), 0);
console.log('wallMs', Math.round(wall), 'profiledMs', Math.round(tot));
console.table(rows.slice(0, 10).map((p: any) => ({ pass: `${p.stage}/${p.id}`, ms: Math.round(p.totalMs ?? p.ms ?? 0), pct: +(((p.totalMs ?? p.ms ?? 0) / tot) * 100).toFixed(1) })));
