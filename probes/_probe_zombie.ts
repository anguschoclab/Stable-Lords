import { runSimulation } from '../src/scripts/simulation-harness';
const seen = new Set<string>(); let kills = 0, stillOnRoster = 0, deadStatus = 0; const ex: any[] = [];
await runSimulation({ weeks: 40, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => {
    const where = new Map<string, any>();
    for (const r of s.rivals) for (const w of r.roster) where.set(w.id, { r: r.id, status: w.status });
    for (const w of s.roster) where.set(w.id, { r: 'player', status: w.status });
    for (const b of s.arenaHistory ?? []) { if (seen.has(b.id)) continue; seen.add(b.id);
      if (b.by !== 'Kill') continue; kills++;
      const v = b.winner === 'A' ? b.warriorIdD : b.warriorIdA; const loc = where.get(v);
      if (loc) { stillOnRoster++; if (loc.status === 'Dead') deadStatus++; if (ex.length < 3) ex.push({ v, loc, tourn: !!b.tournamentId }); } } } });
console.log(JSON.stringify({ kills, stillOnRoster, deadStatus, ex }));
