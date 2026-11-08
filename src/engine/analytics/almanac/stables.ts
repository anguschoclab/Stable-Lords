/** §7 Stable records — W/L/K/fame aggregates, crowns, rivalries. */
import {
  by,
  cap,
  career,
  mkBoard,
  numDesc,
  stableByName,
  strAsc,
  type AlmanacBoard,
  type AlmanacInput,
  type AlmanacRow,
  type AlmanacStableInput,
} from './shared';

interface StableAgg {
  wins: number;
  losses: number;
  kills: number;
  fighters: number;
}

/**
 * Aggregate career records per LIVE stable — dead/retired warriors still
 * count toward the stable they fought for (stableId persists), while
 * warriors of folded stables drop out (their stable isn't in the list).
 */
function aggregateStables(input: AlmanacInput): Map<string, StableAgg> {
  const liveIds = new Set((input.stables ?? []).map((s) => s.id));
  const agg = new Map<string, StableAgg>();
  for (const w of input.warriors) {
    const sid = w.stableId as string | undefined;
    if (!sid || !liveIds.has(sid)) continue;
    const c = career(w);
    const a = agg.get(sid) ?? { wins: 0, losses: 0, kills: 0, fighters: 0 };
    a.wins += c.wins;
    a.losses += c.losses;
    a.kills += c.kills;
    a.fighters++;
    agg.set(sid, a);
  }
  return agg;
}

const stableRow = (
  s: AlmanacStableInput,
  value: number,
  label: string,
  detail?: string,
  extra?: AlmanacRow['extra']
): AlmanacRow => ({
  key: s.id,
  name: s.name,
  value,
  valueLabel: label,
  detail,
  isPlayer: s.isPlayer,
  extra,
});

interface StableMetric {
  value: number;
  detail?: string;
  extra?: AlmanacRow['extra'];
}

interface StableBoardOpts {
  stables: AlmanacStableInput[];
  n: number;
  id: string;
  title: string;
  metric: (s: AlmanacStableInput) => StableMetric;
  label: string;
}

const stableBoard = (opts: StableBoardOpts): AlmanacBoard => {
  const { stables, n, id, title, metric, label } = opts;
  return mkBoard(
    id,
    title,
    'stable',
    cap(
      [...stables]
        .sort(
          by(
            numDesc((s) => metric(s).value),
            strAsc((s) => s.id)
          )
        )
        .filter((s) => metric(s).value > 0)
        .map((s) => {
          const m = metric(s);
          return stableRow(s, m.value, label, m.detail, m.extra);
        }),
      n
    )
  );
};

/** Crown counts per live stable — historical reigns match by stamped stableName. */
function crownCounts(input: AlmanacInput, liveIds: Set<string>): Map<string, number> {
  const counts = new Map<string, number>();
  const byName = stableByName(input);
  const warriorById = new Map(input.warriors.map((w) => [w.id as string, w]));
  for (const title of Object.values(input.arenaChampions ?? {})) {
    for (const r of title?.history ?? []) {
      if (!r.stableName) continue;
      const s = byName.get(r.stableName);
      if (s) counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
    }
    const live = title?.champion;
    if (live) {
      const sid = warriorById.get(live.warriorId as string)?.stableId as string | undefined;
      if (sid && liveIds.has(sid)) counts.set(sid, (counts.get(sid) ?? 0) + 1);
    }
  }
  return counts;
}

const crownsBoard = (
  input: AlmanacInput,
  stables: AlmanacStableInput[],
  n: number
): AlmanacBoard => {
  const counts = crownCounts(input, new Set(stables.map((s) => s.id)));
  return mkBoard(
    'stableCrowns',
    'Crowned Stables',
    'stable',
    cap(
      stables
        .filter((s) => (counts.get(s.id) ?? 0) > 0)
        .sort(by(numDesc((s) => counts.get(s.id) ?? 0), strAsc((s) => s.id)))
        .map((s) => stableRow(s, counts.get(s.id) ?? 0, 'crowns')),
      n
    )
  );
};

const rivalriesBoard = (
  input: AlmanacInput,
  stables: AlmanacStableInput[],
  n: number
): AlmanacBoard => {
  const stableById = new Map(stables.map((s) => [s.id, s]));
  const rows = (input.rivalries ?? [])
    .map((rv, i) => {
      const a = stableById.get(rv.stableIdA as string);
      const b = stableById.get(rv.stableIdB as string);
      return {
        key: `rv-${i}-${rv.id}`,
        name: `${a?.name ?? (rv.stableIdA as string)} vs ${b?.name ?? (rv.stableIdB as string)}`,
        value: rv.intensity ?? 0,
        valueLabel: 'intensity',
        detail: rv.reason,
        isPlayer: a?.isPlayer || b?.isPlayer,
        extra: { startWeek: rv.startWeek ?? 0 },
      };
    })
    .sort(by(numDesc((r) => r.value), strAsc((r) => r.key)));
  return mkBoard('stableRivalries', 'Fiercest Rivalries', 'stable', cap(rows, n));
};

/** §7 Stable records — winningest / deadliest / most-famous stables, crown counts, rivalries. */
export function computeStableBoards(input: AlmanacInput): AlmanacBoard[] {
  const n = input.boardN ?? 25;
  const stables = input.stables ?? [];
  if (stables.length === 0) return [];
  const agg = aggregateStables(input);

  return [
    stableBoard({
      stables,
      n,
      id: 'stableWins',
      title: 'Winningest Stables',
      metric: (s) => {
        const a = agg.get(s.id) ?? { wins: 0, losses: 0, kills: 0, fighters: 0 };
        return {
          value: a.wins,
          detail: `${a.wins}W · ${a.losses}L · ${a.kills}K · ${a.fighters} fighters`,
          extra: { ...a },
        };
      },
      label: 'wins',
    }),
    stableBoard({
      stables,
      n,
      id: 'stableKills',
      title: 'Deadliest Stables',
      metric: (s) => ({ value: agg.get(s.id)?.kills ?? 0 }),
      label: 'kills',
    }),
    stableBoard({
      stables,
      n,
      id: 'stableFame',
      title: 'Most Famous Stables',
      metric: (s) => ({ value: s.fame }),
      label: 'fame',
    }),
    crownsBoard(input, stables, n),
    rivalriesBoard(input, stables, n),
  ].filter((b) => b.rows.length > 0);
}
