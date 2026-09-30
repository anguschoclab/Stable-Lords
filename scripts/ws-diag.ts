/**
 * Throwaway diagnostic: why does WALL OF STEEL sit at ~31% in the world sim?
 * Attributes the gap to attributes / development / matchup composition.
 *
 *   bun run scripts/ws-diag.ts [weeks=1000] [seed=12345]
 */
import { runSimulation } from '@/scripts/simulation-harness';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { ATTRIBUTE_KEYS } from '@/types/shared.types';

const WEEKS = Number(process.argv[2] ?? 1000);
const SEED = Number(process.argv[3] ?? 12345);

type Acc = { n: number; sum: Record<string, number> };
const acc = (): Acc => ({ n: 0, sum: {} });
const add = (a: Acc, row: Record<string, number>) => {
  a.n++;
  for (const k in row) a.sum[k] = (a.sum[k] ?? 0) + row[k]!;
};

const seen = new Set<string>();
// per-style fighter snapshot at bout time
const atBout: Record<string, Acc> = {};
// style -> oppStyle -> [wins, total]
const mm: Record<string, Record<string, [number, number]>> = {};
// style -> experience bucket -> [wins, total]
const byExp: Record<string, Record<string, [number, number]>> = {};
// style -> (own exp - opp exp) sign bucket -> [wins,total]
const byExpDiff: Record<string, Record<string, [number, number]>> = {};
// style -> era -> [wins,total]
const byEra: Record<string, Record<string, [number, number]>> = {};
// outcome method when losing
const lossBy: Record<string, Record<string, number>> = {};
// weekly population snapshot
const pop: Record<string, Acc> = {};

const bump = (t: Record<string, Record<string, [number, number]>>, a: string, b: string, win: boolean) => {
  const cell = ((t[a] ??= {})[b] ??= [0, 0]);
  cell[1]++;
  if (win) cell[0]++;
};

const fights = (w: Warrior) => (w.career?.wins ?? 0) + (w.career?.losses ?? 0);
const expBucket = (n: number) => (n <= 3 ? '0-3' : n <= 10 ? '4-10' : n <= 25 ? '11-25' : '26+');

const row = (w: Warrior): Record<string, number> => {
  const r: Record<string, number> = {};
  let tot = 0;
  for (const k of ATTRIBUTE_KEYS) {
    r[k] = w.attributes[k];
    tot += w.attributes[k];
  }
  r.TOT = tot;
  let sk = 0;
  for (const k of ['ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC'] as const) {
    const v = w.baseSkills?.[k] ?? 0;
    r[k] = v;
    sk += v;
    r['dr' + k] = w.skillDrills?.[k] ?? 0;
    r.drills = (r.drills ?? 0) + (w.skillDrills?.[k] ?? 0);
  }
  r.SK = sk;
  r.hp = w.derivedStats?.hp ?? 0;
  r.end = w.derivedStats?.endurance ?? 0;
  r.dmg = w.derivedStats?.damage ?? 0;
  r.age = w.age ?? 0;
  r.fights = fights(w);
  return r;
};

function onWeek(state: GameState, week: number) {
  const byId = new Map<string, Warrior>();
  const push = (ws?: readonly Warrior[]) => ws?.forEach((w) => byId.set(w.id, w));
  push(state.roster);
  state.rivals.forEach((r) => push(r.roster));
  push(state.graveyard);
  push(state.retired);

  for (const r of state.rivals)
    for (const w of r.roster) add((pop[w.style] ??= acc()), row(w));

  const era = week <= 100 ? 'w1-100' : week <= 300 ? 'w101-300' : week <= 600 ? 'w301-600' : 'w601+';
  for (const b of state.arenaHistory ?? []) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    if (b.winner == null) continue;
    const a = byId.get(b.warriorIdA);
    const d = byId.get(b.warriorIdD);
    for (const [self, opp, selfStyle, oppStyle, won] of [
      [a, d, b.styleA, b.styleD, b.winner === 'A'],
      [d, a, b.styleD, b.styleA, b.winner === 'D'],
    ] as const) {
      bump(mm, selfStyle, oppStyle, won);
      bump(byEra, selfStyle, era, won);
      if (!won) ((lossBy[selfStyle] ??= {})[b.by] = (lossBy[selfStyle]![b.by] ?? 0) + 1);
      if (!self) continue;
      add((atBout[selfStyle] ??= acc()), row(self));
      bump(byExp, selfStyle, expBucket(fights(self)), won);
      if (opp) {
        const diff = fights(self) - fights(opp);
        bump(byExpDiff, selfStyle, diff <= -5 ? 'greener' : diff >= 5 ? 'veteran' : 'even', won);
      }
    }
  }
}

const pct = (c?: [number, number]) => (c && c[1] ? ((100 * c[0]) / c[1]).toFixed(1).padStart(5) + `(${c[1]})` : '   -   ');
const avg = (a: Acc, k: string) => ((a.sum[k] ?? 0) / Math.max(1, a.n)).toFixed(1).padStart(6);

const origLog = console.log;
console.log = () => {};
const result = await runSimulation({ weeks: WEEKS, seed: SEED, logFrequency: 50, ignoreBankruptcy: true, onWeek });
console.log = origLog;

const styles = Object.keys(mm).sort();
const c = result.cumulative;
console.log(`\n=== weeks=${WEEKS} seed=${SEED} bouts=${c.totalBouts} ===`);
console.log('\n# Overall win rate');
for (const s of styles) {
  const w = c.styleWins[s] ?? 0;
  const l = c.styleLosses[s] ?? 0;
  console.log(s.padEnd(18), ((100 * w) / (w + l)).toFixed(2), `n=${w + l}`);
}

const cols = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF', 'TOT', 'ATT', 'PAR', 'DEF', 'INI', 'RIP', 'DEC', 'SK', 'drills', 'hp', 'end', 'dmg', 'age', 'fights'];
for (const [title, table] of [
  ['Fighter profile AT BOUT TIME (bout-weighted)', atBout],
  ['Living rival population (warrior-week weighted)', pop],
] as const) {
  console.log(`\n# ${title}`);
  console.log(''.padEnd(18), cols.map((k) => k.padStart(6)).join(''));
  for (const s of styles) if (table[s]) console.log(s.padEnd(18), cols.map((k) => avg(table[s]!, k)).join(''));
}

console.log('\n# World matchup matrix: row style win% vs column style (n)');
console.log(''.padEnd(18), styles.map((s) => s.slice(0, 11).padStart(12)).join(''));
for (const s of styles) console.log(s.padEnd(18), styles.map((o) => pct(mm[s]?.[o]).padStart(12)).join(''));

for (const [title, table, keys] of [
  ['Win% by own career fights', byExp, ['0-3', '4-10', '11-25', '26+']],
  ['Win% by experience vs opponent (±5 fights)', byExpDiff, ['greener', 'even', 'veteran']],
  ['Win% by era', byEra, ['w1-100', 'w101-300', 'w301-600', 'w601+']],
] as const) {
  console.log(`\n# ${title}`);
  console.log(''.padEnd(18), keys.map((k) => k.padStart(14)).join(''));
  for (const s of styles) console.log(s.padEnd(18), keys.map((k) => pct(table[s]?.[k]).padStart(14)).join(''));
}

console.log('\n# Loss method share');
for (const s of styles) {
  const t = lossBy[s] ?? {};
  const n = Object.values(t).reduce((x, y) => x + y, 0);
  console.log(s.padEnd(18), Object.entries(t).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${((100 * v) / n).toFixed(0)}%`).join('  '));
}
