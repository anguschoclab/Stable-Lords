import { runSimulation } from '../src/scripts/simulation-harness';
const seen = new Set<string>(); let champOrdinary = 0, champTitle = 0, champTourn = 0, champOrdKills = 0;
const reigns = new Map<string, any>(); let statusT: Record<string, number> = {};
let last: any;
await runSimulation({ weeks: 120, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => { last = s;
    const champs = new Set<string>();
    for (const [a, t] of Object.entries<any>(s.arenaChampions ?? {})) { if (t.champion && !(s.graveyard ?? []).some((g: any) => g.id === t.champion.warriorId)) champs.add(t.champion.warriorId);
      statusT[t.status] = (statusT[t.status] ?? 0) + 1;
      for (const h of t.history ?? []) reigns.set(a + h.warriorId + h.startedAbsoluteWeek, h); }
    for (const b of s.arenaHistory ?? []) { if (seen.has(b.id)) continue; seen.add(b.id);
      const inv = [b.warriorIdA, b.warriorIdD].filter((id: string) => champs.has(id));
      if (!inv.length) continue;
      if (b.titleArenaId) champTitle++; else if (b.tournamentId) champTourn++; else { champOrdinary++; if (champOrdinary <= 3) console.log('ORD', JSON.stringify({wk: s.absoluteWeek, contract: b.contractId, title: b.title, rivalry: b.isRivalry})); if (b.by === 'Kill' && inv.includes(b.winner === 'A' ? b.warriorIdD : b.warriorIdA)) champOrdKills++; } } } });
const ends: Record<string, number> = {}; let defs = 0;
for (const h of reigns.values()) { ends[h.endReason] = (ends[h.endReason] ?? 0) + 1; defs += h.defenses; }
console.log(JSON.stringify({ reignsEnded: reigns.size, ends, totalDefenses: defs, champBouts: { title: champTitle, tournament: champTourn, ordinary: champOrdinary, champKilledInOrdinary: champOrdKills }, titleStatusWeeks: statusT }, null, 1)); if (0) console.log(JSON.stringify({
  sampleActive: Object.values<any>(last.arenaChampions ?? {}).filter((t: any) => t.champion).slice(0, 2) }, null, 1).slice(0, 2500));
