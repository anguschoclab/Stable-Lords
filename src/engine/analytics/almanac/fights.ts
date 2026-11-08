/** §6 Fight records — hall archive, upsets, flashiest, fastest kills, pairings. */
import type { HallEntry } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import { getNamesFromTitle } from '@/utils/fightTitle';
import {
  by,
  cap,
  mkBoard,
  numAsc,
  numDesc,
  strAsc,
  type AlmanacBoard,
  type AlmanacInput,
  type AlmanacRow,
} from './shared';

const fightRow = (f: FightSummary, extra: Partial<AlmanacRow>): AlmanacRow => ({
  key: f.id as string,
  name: f.title,
  fightId: f.id as string,
  fightTitle: f.title,
  fightBy: f.by,
  fightWeek: f.week,
  value: 0,
  ...extra,
});

/** Hall-of-fame label archive — newest entries first, append order within a week. */
function hallBoard(input: AlmanacInput, label: HallEntry['label'], id: string, title: string): AlmanacBoard {
  const fightById = new Map((input.arenaHistory ?? []).map((f) => [f.id as string, f]));
  const entries = (input.hallOfFame ?? []).filter((e) => e.label === label);
  const rows = [...entries].reverse().map((e, i): AlmanacRow => {
    const f = fightById.get(e.fightId as string);
    return {
      key: `hof-${label}-${i}-${e.fightId}`,
      name: f ? f.title : `Week ${e.week} — lost to history`,
      fightId: e.fightId as string,
      fightTitle: f?.title,
      fightBy: f?.by,
      fightWeek: e.week,
      tags: f?.flashyTags,
      archived: !f,
      value: 0,
    };
  });
  return mkBoard(id, title, 'fight', rows);
}

const upsetsBoard = (fights: FightSummary[], n: number): AlmanacBoard =>
  mkBoard(
    'upsets',
    'Biggest Upsets',
    'fight',
    cap(
      fights
        .filter((f) => f.winner === 'A' || f.winner === 'D')
        .map((f) => {
          const winnerFame = f.winner === 'A' ? (f.fameA ?? 0) : (f.fameD ?? 0);
          const loserFame = f.winner === 'A' ? (f.fameD ?? 0) : (f.fameA ?? 0);
          return { f, gap: loserFame - winnerFame };
        })
        .filter(({ gap }) => gap > 0)
        .sort(by(numDesc(({ gap }) => gap), strAsc(({ f }) => f.id as string)))
        .map(({ f, gap }) => fightRow(f, { detail: `fame gap ${gap}`, value: gap })),
      n
    )
  );

const fastestKillsBoard = (fights: FightSummary[], n: number): AlmanacBoard =>
  mkBoard(
    'fastestKills',
    'Fastest Kills',
    'fight',
    cap(
      fights
        .filter((f) => f.by === 'Kill' && f.analysis?.decisiveExchange?.minute != null)
        .sort(
          by(
            numAsc((f) => f.analysis?.decisiveExchange?.minute ?? Number.MAX_SAFE_INTEGER),
            strAsc((f) => f.id as string)
          )
        )
        .map((f) =>
          fightRow(f, { value: f.analysis?.decisiveExchange?.minute ?? 0, valueLabel: 'minute' })
        ),
      n
    )
  );

const flashiestBoard = (fights: FightSummary[], n: number): AlmanacBoard =>
  mkBoard(
    'flashiest',
    'Flashiest Bouts',
    'fight',
    cap(
      fights
        .filter((f) => (f.flashyTags?.length ?? 0) > 0)
        .sort(
          by(
            numDesc((f) => f.flashyTags?.length ?? 0),
            numDesc((f) => f.week ?? 0),
            strAsc((f) => f.id as string)
          )
        )
        .map((f) =>
          fightRow(f, { tags: f.flashyTags, value: f.flashyTags?.length ?? 0, valueLabel: 'tags' })
        ),
      n
    )
  );

const fameBoutsBoard = (fights: FightSummary[], n: number): AlmanacBoard =>
  mkBoard(
    'fameBouts',
    'Highest-Stakes Bouts',
    'fight',
    cap(
      fights
        .map((f) => ({ f, delta: (f.fameDeltaA ?? 0) + (f.fameDeltaD ?? 0) }))
        .filter(({ delta }) => delta > 0)
        .sort(by(numDesc(({ delta }) => delta), strAsc(({ f }) => f.id as string)))
        .map(({ f, delta }) => fightRow(f, { value: delta, valueLabel: 'fame' })),
      n
    )
  );

interface PairCount {
  a: string;
  d: string;
  count: number;
  lastWeek: number;
}

/**
 * Most-fought pairings (3+ recorded bouts). Warrior names resolve from the
 * known-warrior map, falling back to the fight title's stamped names — the
 * first-fight index keeps that fallback O(1) instead of an in-loop scan.
 */
function rivalriesBoard(input: AlmanacInput, fights: FightSummary[], n: number): AlmanacBoard {
  const nameOf = new Map<string, string>();
  for (const w of input.warriors) nameOf.set(w.id as string, w.name);

  const firstFightOf = new Map<string, FightSummary>();
  const pairCounts = new Map<string, PairCount>();
  for (const f of fights) {
    const a = f.warriorIdA as string;
    const d = f.warriorIdD as string;
    if (!firstFightOf.has(a)) firstFightOf.set(a, f);
    if (!firstFightOf.has(d)) firstFightOf.set(d, f);
    const key = a < d ? `${a}|${d}` : `${d}|${a}`;
    const p = pairCounts.get(key) ?? { a, d, count: 0, lastWeek: 0 };
    p.count++;
    p.lastWeek = Math.max(p.lastWeek, f.week ?? 0);
    pairCounts.set(key, p);
  }

  const nameFor = (id: string, side: 'a' | 'd') =>
    nameOf.get(id) ?? getNamesFromTitle(firstFightOf.get(id)?.title ?? '')[side];

  const rows = [...pairCounts.entries()]
    .filter(([, p]) => p.count >= 3)
    .sort(by(numDesc(([, p]) => p.count), strAsc(([key]) => key)))
    .map(([key, p]) => ({
      key: `pair-${key}`,
      name: `${nameFor(p.a, 'a')} vs ${nameFor(p.d, 'd')}`,
      value: p.count,
      valueLabel: 'bouts',
      detail: `last met W${p.lastWeek}`,
    }));
  return mkBoard('rivalriesBouts', 'Most-Fought Rivalries', 'fight', cap(rows, n));
}

/** §6 Fight records — FotW/FotT archive, upsets, flashiest, fastest kills, rivalries. */
export function computeFightBoards(input: AlmanacInput): AlmanacBoard[] {
  const n = input.boardN ?? 25;
  const fights = input.arenaHistory ?? [];

  return [
    hallBoard(input, 'Fight of the Week', 'fightOfWeek', 'Fight of the Week'),
    hallBoard(input, 'Fight of the Tournament', 'fightOfTournament', 'Fight of the Tournament'),
    upsetsBoard(fights, n),
    fastestKillsBoard(fights, n),
    flashiestBoard(fights, n),
    fameBoutsBoard(fights, n),
    rivalriesBoard(input, fights, n),
  ].filter((b) => b.rows.length > 0);
}
