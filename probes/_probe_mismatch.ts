// Classifies rival career-delta mismatches from _probe_lost: for each warrior
// whose career moved differently from the bouts visible in arenaHistory that
// week, dumps the bouts, the delta, history trimming, and stable changes.
import { runSimulation } from '../src/scripts/simulation-harness';
const seen = new Set<string>(); let prev = new Map<string, any>(); let prevLen = 0;
let checked = 0; const buckets: Record<string, number> = {}; const ex: any[] = [];
await runSimulation({ weeks: 30, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => {
    const wk = s.absoluteWeek ?? s.week; const hist = s.arenaHistory ?? [];
    const fresh = hist.filter((b: any) => !seen.has(b.id)); fresh.forEach((b: any) => seen.add(b.id));
    const trimmed = hist.length >= 500 && prevLen + fresh.length > hist.length; prevLen = hist.length;
    const apps = new Map<string, any[]>();
    for (const b of fresh) for (const id of [b.warriorIdA, b.warriorIdD]) apps.set(id, [...(apps.get(id) ?? []), b]);
    const cur = new Map<string, any>();
    for (const r of s.rivals) for (const w of r.roster) cur.set(w.id, { st: r.id, w: w.career?.wins ?? 0, l: w.career?.losses ?? 0, k: w.career?.kills ?? 0 });
    for (const [id, bouts] of apps) { const c = cur.get(id), p = prev.get(id); if (!c || !p) continue; checked++;
      const decided = bouts.filter((b: any) => b.winner).length; const got = (c.w - p.w) + (c.l - p.l);
      if (got === decided) continue;
      const tour = bouts.filter((b: any) => b.tournamentId).length;
      const key = `${got > decided ? 'over' : 'under'}|trim=${trimmed}|moved=${c.st !== p.st}|tour=${tour > 0}|mixed=${tour > 0 && tour < bouts.length}`;
      buckets[key] = (buckets[key] ?? 0) + 1;
      if (ex.length < 6) ex.push({ id, wk, decided, got, stable: [p.st, c.st], bouts: bouts.map((b: any) => ({ id: b.id, t: b.tournamentId ? 'T' : '-', wk: b.absoluteWeek ?? b.week, win: b.winner, sides: [b.stableIdA, b.stableIdD] })) });
    }
    prev = cur; } });
console.log(JSON.stringify({ checked, buckets }, null, 1)); console.log(JSON.stringify(ex, null, 1));
