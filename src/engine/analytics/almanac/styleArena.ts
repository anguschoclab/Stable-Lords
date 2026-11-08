/** §5 Style & arena boards — per-style legends/standings and per-arena leaders. */
import type { Warrior } from '@/types/warrior.types';
import { tryGetArenaById } from '@/data/arenas';
import { by, cap, career, mkBoard, numDesc, strAsc, warriorRow } from './shared';
import type { AlmanacBoard, AlmanacInput, AlmanacRow } from './shared';

const arenaName = (id: string) => tryGetArenaById(id)?.name ?? id;

interface StyleAgg {
  wins: number;
  losses: number;
  kills: number;
  count: number;
}

/** Per-style: legendary warrior (top career wins) + aggregate W/L/K standings. */
function scanStyles(input: AlmanacInput): {
  legendByStyle: Map<string, Warrior>;
  styleAgg: Map<string, StyleAgg>;
} {
  const legendByStyle = new Map<string, Warrior>();
  const styleAgg = new Map<string, StyleAgg>();
  for (const w of input.warriors) {
    const c = career(w);
    if (c.wins + c.losses === 0) continue;
    const style = w.style ?? 'Unknown';
    const cur = legendByStyle.get(style);
    if (
      !cur ||
      c.wins > career(cur).wins ||
      (c.wins === career(cur).wins && (w.id as string) < (cur.id as string))
    ) {
      legendByStyle.set(style, w);
    }
    const agg = styleAgg.get(style) ?? { wins: 0, losses: 0, kills: 0, count: 0 };
    agg.wins += c.wins;
    agg.losses += c.losses;
    agg.kills += c.kills;
    agg.count++;
    styleAgg.set(style, agg);
  }
  return { legendByStyle, styleAgg };
}

const styleLegendsBoard = (
  legendByStyle: Map<string, Warrior>,
  input: AlmanacInput,
  n: number
): AlmanacBoard =>
  mkBoard(
    'styleLegends',
    'Style Legends',
    'warrior',
    cap(
      [...legendByStyle.entries()]
        .sort(
          by(
            numDesc(([, w]) => career(w).wins),
            strAsc(([style]) => style)
          )
        )
        .map(([style, w]) => ({
          ...warriorRow({ w, input, value: career(w).wins, valueLabel: 'wins' }),
          sub: style,
        })),
      n
    )
  );

const styleStandingsBoard = (styleAgg: Map<string, StyleAgg>, n: number): AlmanacBoard =>
  mkBoard(
    'styleStandings',
    'Style Standings',
    'stable',
    cap(
      [...styleAgg.entries()]
        .sort(by(numDesc(([, a]) => a.wins), strAsc(([style]) => style)))
        .map(([style, a]) => ({
          key: style,
          name: style,
          value: a.wins,
          valueLabel: 'wins',
          detail: `${a.wins}W · ${a.losses}L · ${a.kills}K · ${a.count} fighters`,
          extra: { wins: a.wins, losses: a.losses, kills: a.kills, fighters: a.count },
        })),
      n
    )
  );

/** Per-arena top winner / top killer from `career.byArena` records. */
function arenaLeaders(input: AlmanacInput): {
  legendRows: AlmanacRow[];
  killRows: AlmanacRow[];
} {
  const arenaIds = new Set<string>();
  for (const w of input.warriors) {
    for (const id of Object.keys(w.career?.byArena ?? {})) arenaIds.add(id);
  }

  const legendRows: AlmanacRow[] = [];
  const killRows: AlmanacRow[] = [];
  for (const arenaId of arenaIds) {
    let topWins: Warrior | undefined;
    let topKills: Warrior | undefined;
    for (const w of input.warriors) {
      const rec = w.career?.byArena?.[arenaId];
      if (!rec) continue;
      const better = (
        cand: Warrior | undefined,
        metric: 'wins' | 'kills'
      ): boolean =>
        rec[metric] > 0 &&
        (!cand ||
          rec[metric] > (cand.career?.byArena?.[arenaId]?.[metric] ?? 0) ||
          (rec[metric] === (cand.career?.byArena?.[arenaId]?.[metric] ?? 0) &&
            (w.id as string) < (cand.id as string)));
      if (better(topWins, 'wins')) topWins = w;
      if (better(topKills, 'kills')) topKills = w;
    }
    if (topWins) {
      const rec = topWins.career?.byArena?.[arenaId];
      legendRows.push({
        ...warriorRow({ w: topWins, input, value: rec?.wins ?? 0, valueLabel: 'wins' }),
        key: `${arenaId}-${topWins.id}`,
        name: arenaName(arenaId),
        sub: topWins.name,
      });
    }
    if (topKills) {
      const rec = topKills.career?.byArena?.[arenaId];
      killRows.push({
        ...warriorRow({ w: topKills, input, value: rec?.kills ?? 0, valueLabel: 'kills' }),
        key: `${arenaId}-${topKills.id}`,
        name: arenaName(arenaId),
        sub: topKills.name,
      });
    }
  }
  legendRows.sort(by(numDesc((r) => r.value), strAsc((r) => r.key)));
  killRows.sort(by(numDesc((r) => r.value), strAsc((r) => r.key)));
  return { legendRows, killRows };
}

/** §5 Style & arena boards — per-style legends and per-arena dominance. */
export function computeStyleArenaBoards(input: AlmanacInput): AlmanacBoard[] {
  const n = input.boardN ?? 25;
  const { legendByStyle, styleAgg } = scanStyles(input);
  const { legendRows, killRows } = arenaLeaders(input);

  return [
    styleLegendsBoard(legendByStyle, input, n),
    styleStandingsBoard(styleAgg, n),
    mkBoard('arenaLegends', 'Arena Legends', 'warrior', cap(legendRows, n)),
    mkBoard('arenaKills', 'Arena Kill Leaders', 'warrior', cap(killRows, n)),
  ].filter((b) => b.rows.length > 0);
}
