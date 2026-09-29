import { runSimulation } from '../src/scripts/simulation-harness';
const WEEKS = Number(process.env.W ?? 150);
const seen = new Set<string>(); const grave = new Set<string>();
const kills: any[] = []; let last: any;
const t0 = Date.now();
await runSimulation({ weeks: WEEKS, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => { last = s;
    for (const w of s.graveyard ?? []) grave.add(w.id);
    for (const b of s.arenaHistory ?? []) { if (seen.has(b.id)) continue; seen.add(b.id);
      if (b.by === 'Kill') kills.push({ victim: b.winner === 'A' ? b.warriorIdD : b.warriorIdA, winner: b.winner, t: !!b.tournamentId, title: !!b.titleArenaId, wk: s.absoluteWeek ?? s.week, sa: b.stableIdA, sd: b.stableIdD, isDeath: b.isDeathEvent }); } } });
const alive = new Set<string>([...last.roster.map((w: any) => w.id), ...last.rivals.flatMap((r: any) => r.roster.map((w: any) => w.id))]);
const missing = kills.filter(k => !grave.has(k.victim));
const tally = (arr: any[], f: (k:any)=>string) => arr.reduce((m: any, k) => (m[f(k)] = (m[f(k)] ?? 0) + 1, m), {});
console.log(JSON.stringify({ secs: (Date.now()-t0)/1000, kills: kills.length, grave: grave.size, missing: missing.length,
  missingStillAlive: missing.filter(k => alive.has(k.victim)).length,
  missingBy: tally(missing, k => `tourn=${k.t} winner=${k.winner} isDeathEvent=${k.isDeath}`),
  allBy: tally(kills, k => `tourn=${k.t} winner=${k.winner}`),
  graveNotFromKills: [...grave].filter(id => !kills.some(k => k.victim === id)).length }, null, 1));
const byVictim = tally(kills, k => k.victim);
const dups = Object.entries(byVictim).filter(([,n]) => (n as number) > 1);
console.log('uniqueVictims', Object.keys(byVictim).length, 'dupVictims', dups.length);
for (const [v] of dups.slice(0, 4)) console.log(v, JSON.stringify(kills.filter(k => k.victim === v)));
