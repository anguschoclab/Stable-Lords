/** §3 Championship lineage — reigns, defenses, crowns, grand champions, tournaments. */
import type { Warrior } from '@/types/warrior.types';
import { tryGetArenaById } from '@/data/arenas';
import {
  by,
  cap,
  career,
  mkBoard,
  numAsc,
  numDesc,
  stableByName,
  stableNameOf,
  strAsc,
  type AlmanacBoard,
  type AlmanacInput,
  type AlmanacRow,
} from './shared';

interface ReignLike {
  warriorId: string;
  warriorName?: string;
  stableName?: string;
  start: number;
  end: number;
  defenses: number;
  endReason?: string;
  arenaId: string;
  live: boolean;
}

interface Ctx {
  input: AlmanacInput;
  n: number;
  warriorById: Map<string, Warrior>;
  reigns: ReignLike[];
}

const arenaName = (id: string) => tryGetArenaById(id)?.name ?? id;
const reignWeeks = (r: ReignLike) => Math.max(0, r.end - r.start);

/** Flatten historical + live reigns from every arena's title record. */
function flattenReigns(input: AlmanacInput, warriorById: Map<string, Warrior>): ReignLike[] {
  const absNow = input.absoluteWeek ?? Number.MAX_SAFE_INTEGER;
  const reigns: ReignLike[] = [];
  for (const [arenaId, title] of Object.entries(input.arenaChampions ?? {})) {
    for (const r of title?.history ?? []) {
      reigns.push({
        warriorId: r.warriorId as string,
        warriorName: r.warriorName,
        stableName: r.stableName,
        start: r.startedAbsoluteWeek,
        end: r.endedAbsoluteWeek,
        defenses: r.defenses ?? 0,
        endReason: r.endReason,
        arenaId,
        live: false,
      });
    }
    const live = title?.champion;
    if (live) {
      const w = warriorById.get(live.warriorId as string);
      reigns.push({
        warriorId: live.warriorId as string,
        warriorName: w?.name,
        stableName: w ? stableNameOf(w, input) : undefined,
        start: live.startedAbsoluteWeek,
        end: absNow,
        defenses: live.defenses ?? 0,
        arenaId,
        live: true,
      });
    }
  }
  return reigns;
}

const reignRow = (ctx: Ctx, r: ReignLike, value: number, label: string): AlmanacRow => ({
  key: `${r.warriorId}-${r.arenaId}-${r.start}`,
  name: r.warriorName ?? ctx.warriorById.get(r.warriorId)?.name ?? 'Unknown',
  warriorId: r.warriorId,
  sub: arenaName(r.arenaId),
  detail: r.endReason ? `${r.endReason}` : r.live ? 'reigning' : undefined,
  status: r.live ? 'Active' : undefined,
  isPlayer: ctx.warriorById.get(r.warriorId)?.stableId === ctx.input.playerStableId,
  value,
  valueLabel: label,
  extra: { defenses: r.defenses, reignWeeks: reignWeeks(r) },
});

const currentChampionsBoard = (ctx: Ctx): AlmanacBoard =>
  mkBoard(
    'currentChampions',
    'Current Champions',
    'warrior',
    cap(
      ctx.reigns
        .filter((r) => r.live)
        .sort(
          by(
            numDesc(reignWeeks),
            strAsc((r) => r.arenaId),
            strAsc((r) => r.warriorId)
          )
        )
        .map((r) => reignRow(ctx, r, reignWeeks(r), 'weeks')),
      ctx.n
    )
  );

const longestReignsBoard = (ctx: Ctx): AlmanacBoard =>
  mkBoard(
    'longestReigns',
    'Longest Reigns',
    'warrior',
    cap(
      [...ctx.reigns]
        .sort(
          by(
            numDesc(reignWeeks),
            strAsc((r) => r.warriorId),
            numAsc((r) => r.start)
          )
        )
        .map((r) => reignRow(ctx, r, reignWeeks(r), 'weeks')),
      ctx.n
    )
  );

const mostDefensesBoard = (ctx: Ctx): AlmanacBoard =>
  mkBoard(
    'mostDefenses',
    'Most Title Defenses',
    'warrior',
    cap(
      [...ctx.reigns]
        .sort(
          by(
            numDesc((r) => r.defenses),
            numDesc(reignWeeks),
            strAsc((r) => r.warriorId),
            numAsc((r) => r.start)
          )
        )
        .map((r) => reignRow(ctx, r, r.defenses, 'defenses')),
      ctx.n
    )
  );

const crownsByWarriorBoard = (ctx: Ctx): AlmanacBoard => {
  const counts = new Map<string, { count: number; name: string }>();
  for (const r of ctx.reigns) {
    const e = counts.get(r.warriorId) ?? {
      count: 0,
      name: r.warriorName ?? ctx.warriorById.get(r.warriorId)?.name ?? 'Unknown',
    };
    e.count++;
    counts.set(r.warriorId, e);
  }
  return mkBoard(
    'crownsWarriors',
    'Most Crowns — Warriors',
    'warrior',
    cap(
      [...counts.entries()]
        .sort(by(numDesc(([, e]) => e.count), strAsc(([id]) => id)))
        .map(([id, e]) => ({
          key: id,
          name: e.name,
          warriorId: id,
          isPlayer: ctx.warriorById.get(id)?.stableId === ctx.input.playerStableId,
          value: e.count,
          valueLabel: 'crowns',
          detail: `${career(ctx.warriorById.get(id) ?? ({} as Warrior)).wins ?? 0}W career`,
        })),
      ctx.n
    )
  );
};

const crownsByStableBoard = (ctx: Ctx): AlmanacBoard => {
  const counts = new Map<string, number>();
  for (const r of ctx.reigns) {
    if (!r.stableName) continue;
    counts.set(r.stableName, (counts.get(r.stableName) ?? 0) + 1);
  }
  const byName = stableByName(ctx.input);
  return mkBoard(
    'crownsStables',
    'Most Crowns — Stables',
    'stable',
    cap(
      [...counts.entries()]
        .sort(by(numDesc(([, c]) => c), strAsc(([name]) => name)))
        .map(([name, c]) => ({
          key: name,
          name,
          value: c,
          valueLabel: 'crowns',
          isPlayer: byName.get(name)?.isPlayer ?? false,
        })),
      ctx.n
    )
  );
};

const grandChampionsBoard = (ctx: Ctx): AlmanacBoard =>
  mkBoard(
    'grandChampions',
    'Grand Champions',
    'scroll',
    cap(
      [...(ctx.input.grandChampions ?? [])]
        .sort(
          by(
            numDesc((g) => g.year),
            strAsc((g) => g.warriorId as string)
          )
        )
        .map((g) => ({
          key: `${g.year}-${g.warriorId}`,
          name: g.warriorName ?? 'Unknown',
          warriorId: g.warriorId as string,
          sub: `Year ${g.year}`,
          detail: g.stableName,
          value: g.year,
        })),
      ctx.n
    )
  );

const mostGrandChampionshipsBoard = (ctx: Ctx): AlmanacBoard => {
  const counts = new Map<string, { count: number; name: string }>();
  for (const g of ctx.input.grandChampions ?? []) {
    const id = g.warriorId as string;
    const e = counts.get(id) ?? { count: 0, name: g.warriorName ?? 'Unknown' };
    e.count++;
    counts.set(id, e);
  }
  return mkBoard(
    'mostGrandChampionships',
    'Most Grand Championships',
    'warrior',
    cap(
      [...counts.entries()]
        .sort(by(numDesc(([, e]) => e.count), strAsc(([id]) => id)))
        .map(([id, e]) => ({
          key: id,
          name: e.name,
          warriorId: id,
          value: e.count,
          valueLabel: 'titles',
        })),
      ctx.n
    )
  );
};

const tournamentVictorsBoard = (ctx: Ctx, completed: AlmanacInput['tournaments']): AlmanacBoard =>
  mkBoard(
    'tournamentVictors',
    'Tournament Victors',
    'scroll',
    cap(
      [...(completed ?? [])].reverse().map((t, i) => ({
        key: `t-${i}-${t.id}`,
        name: t.name ?? 'Tournament',
        sub: t.champion,
        detail: `${t.season ?? ''} W${t.week ?? '?'} · ${t.tierId ?? ''}`.trim(),
        value: 0,
      })),
      ctx.n
    )
  );

const mostTournamentTitlesBoard = (
  ctx: Ctx,
  completed: AlmanacInput['tournaments']
): AlmanacBoard => {
  const counts = new Map<string, number>();
  for (const t of completed ?? []) {
    if (!t.champion) continue;
    counts.set(t.champion, (counts.get(t.champion) ?? 0) + 1);
  }
  return mkBoard(
    'mostTournamentTitles',
    'Most Tournament Titles',
    'scroll',
    cap(
      [...counts.entries()]
        .sort(by(numDesc(([, c]) => c), strAsc(([name]) => name)))
        .map(([name, c]) => ({ key: name, name, value: c, valueLabel: 'titles' })),
      ctx.n
    )
  );
};

const reignEndingsBoard = (ctx: Ctx): AlmanacBoard => {
  const counts = new Map<string, number>();
  for (const r of ctx.reigns) {
    if (!r.endReason) continue;
    counts.set(r.endReason, (counts.get(r.endReason) ?? 0) + 1);
  }
  return mkBoard(
    'reignEndings',
    'How Reigns End',
    'stable',
    cap(
      [...counts.entries()]
        .sort(by(numDesc(([, c]) => c), strAsc(([reason]) => reason)))
        .map(([reason, c]) => ({ key: reason, name: reason, value: c, valueLabel: 'reigns' })),
      ctx.n
    )
  );
};

/** §3 Championship lineage — reigns, defenses, crowns per warrior/stable, grand champions. */
export function computeChampionshipBoards(input: AlmanacInput): AlmanacBoard[] {
  const warriorById = new Map(input.warriors.map((w) => [w.id as string, w]));
  const ctx: Ctx = {
    input,
    n: input.boardN ?? 25,
    warriorById,
    reigns: flattenReigns(input, warriorById),
  };
  const completed = (input.tournaments ?? []).filter((t) => t.completed && t.champion);

  return [
    currentChampionsBoard(ctx),
    longestReignsBoard(ctx),
    mostDefensesBoard(ctx),
    crownsByWarriorBoard(ctx),
    crownsByStableBoard(ctx),
    grandChampionsBoard(ctx),
    mostGrandChampionshipsBoard(ctx),
    tournamentVictorsBoard(ctx, completed),
    mostTournamentTitlesBoard(ctx, completed),
    reignEndingsBoard(ctx),
  ].filter((b) => b.rows.length > 0);
}
