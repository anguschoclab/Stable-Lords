import { runSimulation } from '../src/scripts/simulation-harness';
const WEEKS = Number(process.env.W ?? 150);
const seen = new Set<string>();
const byCounts: Record<string, number> = {};
let tourn = 0, playerBouts = 0, killsPlayerInvolved = 0;
const graveIds = new Set<string>();
const styleByOutcome: Record<string, Record<string, number>> = {};
let lastState: any;
const wsOpp: Record<string, [number, number]> = {};
const treas: number[] = []; const rivalTreas: number[] = [];
const res = await runSimulation({
  weeks: WEEKS, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => {
    lastState = s;
    treas.push(s.treasury);
    const rt = s.rivals.map((r: any) => r.treasury ?? r.gold ?? 0);
    rivalTreas.push(rt.reduce((a: number, b: number) => a + b, 0) / Math.max(1, rt.length));
    for (const w of s.graveyard ?? []) graveIds.add(w.id);
    const playerIds = new Set(s.roster.map((w: any) => w.id));
    for (const b of s.arenaHistory ?? []) {
      if (seen.has(b.id)) continue; seen.add(b.id);
      byCounts[b.by ?? 'null'] = (byCounts[b.by ?? 'null'] ?? 0) + 1;
      if (b.tournamentId) tourn++;
      const pInv = playerIds.has(b.warriorIdA) || playerIds.has(b.warriorIdD) || b.stableIdA === s.player?.id || b.stableIdD === s.player?.id;
      if (pInv) playerBouts++;
      if (b.by === 'Kill' && pInv) killsPlayerInvolved++;
      for (const [me, opp, won] of [[b.styleA, b.styleD, b.winner === 'A'], [b.styleD, b.styleA, b.winner === 'D']] as any) {
        if (me !== 'WALL OF STEEL' || b.winner == null) continue;
        wsOpp[opp] ??= [0, 0]; wsOpp[opp][won ? 0 : 1]++;
      }
    }
  },
});
console.log(JSON.stringify({ WEEKS, bouts: seen.size, byCounts, tourn, playerBouts, killsPlayerInvolved,
  graveyard: graveIds.size, trackerDeaths: res.cumulative.deaths,
  rosterPlayer: lastState.roster.length, rivals: lastState.rivals.length,
  playerTreasuryAvg: Math.round(treas.reduce((a,b)=>a+b,0)/treas.length), playerTreasuryEnd: treas.at(-1),
  rivalAvgTreasuryStart: Math.round(rivalTreas[0]), rivalAvgTreasuryEnd: Math.round(rivalTreas.at(-1)!),
  houseRules: lastState.houseRules, wsOpp }, null, 1));
