import { runSimulation } from '../src/scripts/simulation-harness';
const seen = new Set<string>(); let prev = new Map<string, any>();
let checked = 0, mismatch = 0, sameStableSameWeek = 0, mismatchWhenShared = 0; const ex: any[] = [];
await runSimulation({ weeks: 30, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => {
    const wk = s.absoluteWeek ?? s.week; const apps = new Map<string, { w: number; l: number; nonTour: number }>();
    const perStable = new Map<string, number>();
    for (const b of s.arenaHistory ?? []) { if (seen.has(b.id)) continue; seen.add(b.id);
      for (const [id, st, won] of [[b.warriorIdA, b.stableIdA, b.winner === 'A'], [b.warriorIdD, b.stableIdD, b.winner === 'D']] as any) {
        const a = apps.get(id) ?? { w: 0, l: 0, nonTour: 0 }; if (b.winner) won ? a.w++ : a.l++; if (!b.tournamentId) { a.nonTour++; perStable.set(st, (perStable.get(st) ?? 0) + 1); } apps.set(id, a); } }
    const cur = new Map<string, any>();
    for (const r of s.rivals) for (const w of r.roster) cur.set(w.id, { st: r.id, w: w.career?.wins ?? 0, l: w.career?.losses ?? 0, lbw: w.lastBoutWeek });
    for (const [id, a] of apps) { const c = cur.get(id), p = prev.get(id); if (!c || !p || a.nonTour === 0) continue;
      checked++; const got = (c.w - p.w) + (c.l - p.l); const shared = (perStable.get(c.st) ?? 0) > 1;
      if (shared) sameStableSameWeek++;
      if (got !== a.w + a.l) { mismatch++; if (shared) mismatchWhenShared++; if (ex.length < 3) ex.push({ id, expected: a.w + a.l, got, lastBoutWeek: c.lbw, wk, shared }); } }
    prev = cur; } });
console.log(JSON.stringify({ checked, mismatch, sameStableSameWeek, mismatchWhenShared, ex }));
