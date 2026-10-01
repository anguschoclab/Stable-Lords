/**
 * World diagnostic — an instrumented run of the world simulation that explains
 * style balance in the DEPLOYED population (developed warriors, AI plans,
 * matchmaking), not on a fixture. Prints per-style win rate, fighter profile at
 * bout time, the world matchup matrix, win rate by career stage / experience
 * gap / era, loss methods, population share by era (the emergent meta), kill
 * rates, and a one-line SUMMARY for comparing runs.
 *
 *   bun run scripts/world-diag.ts [weeks=1000] [seed=12345]
 *   SNAP=snap.json bun run scripts/world-diag.ts   # also dump living warriors
 *                                                  # for scripts/balance-lab.ts
 *   LAB='{"floor":{"WS":[11,3,1,16,1,1]}}' bun run scripts/world-diag.ts
 *                                                  # what-if (see lab-overrides.ts)
 */
import { runSimulation } from './simulation-harness';
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
// era -> style -> warrior-weeks (population share = the emergent meta)
const share: Record<string, Record<string, number>> = {};
// kills by killer style / bouts by style
const killsBy: Record<string, number> = {};
const snapshots: unknown[] = [];
// style -> exp bucket -> profile
const profByExp: Record<string, Record<string, Acc>> = {};
// ── megaplan world-health metrics ──────────────────────────────────────────
// rival stable count per week (floor/soft-cap/hard-cap behavior)
const stableSeries: number[] = [];
// arenaId -> bout count (registered-arena coverage)
const arenaBouts: Record<string, number> = {};
// weekly rival roster fill (warriors) vs stable count
let rosterFillSum = 0;
let rosterFillWeeks = 0;

const bump = (
  t: Record<string, Record<string, [number, number]>>,
  a: string,
  b: string,
  win: boolean
) => {
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

  const era =
    week <= 100 ? 'w1-100' : week <= 300 ? 'w101-300' : week <= 600 ? 'w301-600' : 'w601+';
  for (const r of state.rivals)
    for (const w of r.roster) {
      add((pop[w.style] ??= acc()), row(w));
      (share[era] ??= {})[w.style] = (share[era]![w.style] ?? 0) + 1;
    }
  if (process.env.SNAP && week % 125 === 0 && week >= 250) {
    for (const r of state.rivals)
      for (const w of r.roster)
        if (w.status === 'Active')
          snapshots.push({
            w: structuredClone(w),
            personality: r.owner.personality,
            philosophy: r.philosophy,
          });
  }
  stableSeries.push(state.rivals.length);
  rosterFillSum += state.rivals.reduce((n, r) => n + r.roster.length, 0) / Math.max(1, state.rivals.length);
  rosterFillWeeks++;

  for (const b of state.arenaHistory ?? []) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    if (b.winner == null) continue;
    if (b.arenaId) arenaBouts[b.arenaId] = (arenaBouts[b.arenaId] ?? 0) + 1;
    const a = byId.get(b.warriorIdA);
    const d = byId.get(b.warriorIdD);
    for (const [self, opp, selfStyle, oppStyle, won] of [
      [a, d, b.styleA, b.styleD, b.winner === 'A'],
      [d, a, b.styleD, b.styleA, b.winner === 'D'],
    ] as const) {
      bump(mm, selfStyle, oppStyle, won);
      bump(byEra, selfStyle, era, won);
      if (!won)
        (lossBy[selfStyle] ??= {})[String(b.by)] = (lossBy[selfStyle]![String(b.by)] ?? 0) + 1;
      if (won && b.by === 'Kill') killsBy[selfStyle] = (killsBy[selfStyle] ?? 0) + 1;
      if (!self) continue;
      add((atBout[selfStyle] ??= acc()), row(self));
      bump(byExp, selfStyle, expBucket(fights(self)), won);
      add(((profByExp[selfStyle] ??= {})[expBucket(fights(self))] ??= acc()), row(self));
      if (opp) {
        const diff = fights(self) - fights(opp);
        bump(byExpDiff, selfStyle, diff <= -5 ? 'greener' : diff >= 5 ? 'veteran' : 'even', won);
      }
    }
  }
}

const pct = (c?: [number, number]) =>
  c && c[1] ? ((100 * c[0]) / c[1]).toFixed(1).padStart(5) + `(${c[1]})` : '   -   ';
const avg = (a: Acc, k: string) => ((a.sum[k] ?? 0) / Math.max(1, a.n)).toFixed(1).padStart(6);

const { applyLabOverrides, STYLE_CODE } = await import('./lab-overrides');
applyLabOverrides();
const origLog = console.log;
console.log = () => {};
const simStarted = performance.now();
const result = await runSimulation({
  weeks: WEEKS,
  seed: SEED,
  logFrequency: 50,
  ignoreBankruptcy: true,
  onWeek,
});
const simMs = performance.now() - simStarted;
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

const cols = [
  'ST',
  'CN',
  'SZ',
  'WT',
  'WL',
  'SP',
  'DF',
  'TOT',
  'ATT',
  'PAR',
  'DEF',
  'INI',
  'RIP',
  'DEC',
  'SK',
  'drills',
  'hp',
  'end',
  'dmg',
  'age',
  'fights',
];
for (const [title, table] of [
  ['Fighter profile AT BOUT TIME (bout-weighted)', atBout],
  ['Living rival population (warrior-week weighted)', pop],
] as const) {
  console.log(`\n# ${title}`);
  console.log(''.padEnd(18), cols.map((k) => k.padStart(6)).join(''));
  for (const s of styles)
    if (table[s]) console.log(s.padEnd(18), cols.map((k) => avg(table[s]!, k)).join(''));
}

console.log('\n# World matchup matrix: row style win% vs column style (n)');
console.log(''.padEnd(18), styles.map((s) => s.slice(0, 11).padStart(12)).join(''));
for (const s of styles)
  console.log(s.padEnd(18), styles.map((o) => pct(mm[s]?.[o]).padStart(12)).join(''));

for (const [title, table, keys] of [
  ['Win% by own career fights', byExp, ['0-3', '4-10', '11-25', '26+']],
  ['Win% by experience vs opponent (±5 fights)', byExpDiff, ['greener', 'even', 'veteran']],
  ['Win% by era', byEra, ['w1-100', 'w101-300', 'w301-600', 'w601+']],
] as const) {
  console.log(`\n# ${title}`);
  console.log(''.padEnd(18), keys.map((k) => k.padStart(14)).join(''));
  for (const s of styles)
    console.log(s.padEnd(18), keys.map((k) => pct(table[s]?.[k]).padStart(14)).join(''));
}

console.log('\n# Loss method share');
for (const s of styles) {
  const t = lossBy[s] ?? {};
  const n = Object.values(t).reduce((x, y) => x + y, 0);
  console.log(
    s.padEnd(18),
    Object.entries(t)
      .sort((x, y) => y[1] - x[1])
      .map(([k, v]) => `${k} ${((100 * v) / n).toFixed(0)}%`)
      .join('  ')
  );
}

console.log('\n# Development at equal experience: TOT / WT / SK / drills / age');
for (const s of [
  'WALL OF STEEL',
  'TOTAL PARRY',
  'BASHING ATTACK',
  'STRIKING ATTACK',
  'PARRY-LUNGE',
  'LUNGING ATTACK',
]) {
  console.log(
    s.padEnd(18),
    ['0-3', '4-10', '11-25', '26+']
      .map((k) => {
        const a = profByExp[s]?.[k];
        return a
          ? `${k}: ${avg(a, 'TOT')}${avg(a, 'WT')}${avg(a, 'SK')}${avg(a, 'drills')}${avg(a, 'age')}`
          : '';
      })
      .join(' | ')
  );
}

console.log('\n# Population share by era (%) — the emergent meta');
const eras = ['w1-100', 'w101-300', 'w301-600', 'w601+'];
console.log(''.padEnd(18), eras.map((k) => k.padStart(10)).join(''));
for (const s of styles)
  console.log(
    s.padEnd(18),
    eras
      .map((e) => {
        const t = Object.values(share[e] ?? {}).reduce((x, y) => x + y, 0);
        return ((100 * (share[e]?.[s] ?? 0)) / Math.max(1, t)).toFixed(1).padStart(10);
      })
      .join('')
  );
const lastPulse = result.pulses[result.pulses.length - 1];
const living = result.finalState.rivals.reduce((n, r) => n + r.roster.length, 0);
console.log(
  `\n# Kills: weekly ${c.weeklyKills}/${c.weeklyBouts} = ${((100 * c.weeklyKills) / c.weeklyBouts).toFixed(2)}%  tournament ${c.tournamentKills}/${c.tournamentBouts} = ${((100 * c.tournamentKills) / Math.max(1, c.tournamentBouts)).toFixed(2)}%  deaths=${c.deaths} retired=${c.retired} rivals=${result.finalState.rivals.length} living=${living} rivalGoldMean=${lastPulse?.avgRivalTreasury}`
);
console.log(
  '# Kill share of wins by style: ' +
    styles
      .map(
        (s) =>
          `${s.slice(0, 9)} ${((100 * (killsBy[s] ?? 0)) / Math.max(1, c.styleWins[s] ?? 0)).toFixed(1)}`
      )
      .join(' | ')
);
// ── Megaplan world health ────────────────────────────────────────────────────
const fs0 = result.finalState;
const { getAllArenas } = await import('@/data/arenas/registry');
const allArenas = getAllArenas();
const darkArenas = allArenas.filter((a) => !arenaBouts[a.id]);
const legacyFounded = fs0.rivals.filter((r) => r.owner.foundedByWarriorId);
const generations = legacyFounded.reduce<Record<number, number>>((m, r) => {
  const g = r.owner.generation ?? 1;
  m[g] = (m[g] ?? 0) + 1;
  return m;
}, {});
const crownCounts = new Map<string, number>();
let occupiedCrowns = 0;
for (const t of Object.values(fs0.arenaChampions ?? {})) {
  if (!t.champion) continue;
  occupiedCrowns++;
  crownCounts.set(t.champion.warriorId, (crownCounts.get(t.champion.warriorId) ?? 0) + 1);
}
const maxCrowns = Math.max(0, ...crownCounts.values());

console.log('\n# Megaplan world health');
console.log(
  `stables: start=${stableSeries[0]} end=${fs0.rivals.length} min=${Math.min(...stableSeries)} max=${Math.max(...stableSeries)}`
);
console.log(`roster fill: avg ${(rosterFillSum / Math.max(1, rosterFillWeeks)).toFixed(1)} warriors/stable`);
console.log(
  `legacy-founded stables: ${legacyFounded.length} (generations: ${Object.entries(generations)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([g, n]) => `gen${g}=${n}`)
    .join(' ') || 'none'})`
);
console.log(`freeAgents=${fs0.freeAgents?.length ?? 0} recruitPool=${fs0.recruitPool?.length ?? 0} founderQueue=${fs0.legacyFounderQueue?.length ?? 0}`);
console.log(
  `arena coverage: ${allArenas.length - darkArenas.length}/${allArenas.length} arenas saw a bout` +
    (darkArenas.length ? ` — dark: ${darkArenas.map((a) => a.id).join(', ')}` : '')
);
console.log(
  `crowns: ${occupiedCrowns} reigning / ${crownCounts.size} unique champions / max ${maxCrowns} per warrior`
);
console.log(`perf: ${(simMs / WEEKS).toFixed(0)} ms/week (${(simMs / 1000).toFixed(1)}s total)`);

const wr = styles.map(
  (s) => (100 * (c.styleWins[s] ?? 0)) / ((c.styleWins[s] ?? 0) + (c.styleLosses[s] ?? 0))
);
console.log(
  `SUMMARY seed=${SEED} weeks=${WEEKS} kill=${((100 * c.weeklyKills) / c.weeklyBouts).toFixed(2)} min=${Math.min(...wr).toFixed(1)} max=${Math.max(...wr).toFixed(1)} | ` +
    styles.map((s, i) => `${STYLE_CODE[s as never]} ${wr[i]!.toFixed(1)}`).join(' ')
);
if (process.env.SNAP) {
  const fs = await import('fs');
  fs.writeFileSync(process.env.SNAP, JSON.stringify(snapshots));
  console.log(`snapshot: ${snapshots.length} warriors -> ${process.env.SNAP}`);
}
