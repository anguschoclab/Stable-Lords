import { runSimulation } from '../src/scripts/simulation-harness';
const seen = new Map<string, any>();
await runSimulation({ weeks: 104, seed: 12345, logFrequency: 1000, ignoreBankruptcy: true,
  onWeek: (s: any) => { for (const t of s.tournaments ?? []) if (t.completed || t.status === 'completed' || t.bracket?.every((b: any) => b.winner)) seen.set(t.id, t); } });
const rows: any[] = []; const tally: Record<string, number> = {};
for (const t of seen.values()) {
  const br = t.bracket ?? []; const r1 = br.filter((b: any) => b.round === Math.min(...br.map((x: any) => x.round))).length;
  const maxR = Math.max(...br.map((b: any) => b.round));
  const flagged = br.some((b: any) => b.isBronzeMatch);
  const fb = !flagged ? br.find((b: any) => b.round === 6 && b.matchIndex === 1) : undefined;
  const k = `r1bouts=${r1} rounds=${maxR} flagged=${flagged} fallbackHit=${!!fb}${fb ? ` fbIsBye=${fb.warriorIdD === 'bye'} fbIsFinalRound=${fb.round === maxR}` : ''}`;
  tally[k] = (tally[k] ?? 0) + 1; }
console.log(JSON.stringify({ tournaments: seen.size, tally }, null, 1));
