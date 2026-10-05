import { runSimulation } from './simulation-harness.ts';
const med = (xs: number[]) => { const s=[...xs].sort((a,b)=>a-b); return s[Math.floor(s.length/2)] ?? 0; };
const avg = (xs: number[]) => xs.reduce((s,x)=>s+x,0)/Math.max(1,xs.length);
const track: Record<number, Map<string, number[]>> = {};
const { finalState } = await runSimulation({
  weeks: 104, seed: 11, logFrequency: 4, ignoreBankruptcy: true,
  onWeek: (state, w) => {
    if (![26, 52, 78, 104].includes(w)) return;
    const m = new Map<string, number[]>();
    for (const r of state.rivals ?? []) {
      const t = r.owner?.competence; if (!t) continue;
      (m.get(t) ?? m.set(t, []).get(t)!).push(r.treasury);
    }
    track[w] = m;
  },
});
for (const [w, m] of Object.entries(track)) {
  const line = [`wk${w}:`];
  for (const t of ['Master','Veteran','Journeyman','Novice']) {
    const xs = m.get(t) ?? [];
    line.push(`${t}:med=${med(xs).toFixed(0)},avg=${avg(xs).toFixed(0)}(n${xs.length})`);
  }
  console.log(line.join(' '));
}
