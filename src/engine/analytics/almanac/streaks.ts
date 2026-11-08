/** §4 Streak boards — best/current win, loss, and kill streaks over the fight window. */
import type { Warrior } from '@/types/warrior.types';
import {
  by,
  cap,
  mkBoard,
  numDesc,
  strAsc,
  warriorRow,
  warriorStatus,
  type AlmanacBoard,
  type AlmanacInput,
  type AlmanacRow,
} from './shared';

const STREAK_CAVEAT = 'Recorded fight window only — arena history is bounded';

interface StreakStat {
  cur: number;
  bestWin: number;
  bestLoss: number;
  curKill: number;
  bestKill: number;
}

/** Walk the recorded fight window, accumulating per-warrior streak state. */
function computeStreakStats(input: AlmanacInput): Map<string, StreakStat> {
  const stats = new Map<string, StreakStat>();
  const get = (id: string) => {
    let s = stats.get(id);
    if (!s) {
      s = { cur: 0, bestWin: 0, bestLoss: 0, curKill: 0, bestKill: 0 };
      stats.set(id, s);
    }
    return s;
  };

  for (const f of input.arenaHistory ?? []) {
    const a = get(f.warriorIdA as string);
    const d = get(f.warriorIdD as string);
    if (f.winner === 'A') {
      a.cur = a.cur >= 0 ? a.cur + 1 : 1;
      d.cur = d.cur <= 0 ? d.cur - 1 : -1;
      if (f.by === 'Kill') {
        a.curKill++;
        a.bestKill = Math.max(a.bestKill, a.curKill);
      } else a.curKill = 0;
      d.curKill = 0;
    } else if (f.winner === 'D') {
      d.cur = d.cur >= 0 ? d.cur + 1 : 1;
      a.cur = a.cur <= 0 ? a.cur - 1 : -1;
      if (f.by === 'Kill') {
        d.curKill++;
        d.bestKill = Math.max(d.bestKill, d.curKill);
      } else d.curKill = 0;
      a.curKill = 0;
    } else {
      a.cur = 0;
      d.cur = 0;
      a.curKill = 0;
      d.curKill = 0;
    }
    a.bestWin = Math.max(a.bestWin, a.cur);
    a.bestLoss = Math.max(a.bestLoss, -a.cur);
    d.bestWin = Math.max(d.bestWin, d.cur);
    d.bestLoss = Math.max(d.bestLoss, -d.cur);
  }
  return stats;
}

/** §4 Streaks — best/current win + loss streaks over the recorded fight window. */
export function computeStreakBoards(input: AlmanacInput): AlmanacBoard[] {
  const n = input.boardN ?? 25;
  const stats = computeStreakStats(input);
  const byId = new Map(input.warriors.map((w) => [w.id as string, w]));

  const rows = (
    pick: (s: StreakStat) => number,
    label: string,
    gate?: (id: string) => boolean
  ): AlmanacRow[] =>
    cap(
      [...stats.entries()]
        .filter(([id, s]) => pick(s) > 0 && (gate ? gate(id) : true))
        .sort(by(numDesc(([, s]) => pick(s)), strAsc(([id]) => id)))
        .map(([id, s]) => {
          const w = byId.get(id);
          return w ? warriorRow({ w, input, value: pick(s), valueLabel: label }) : null;
        })
        .filter((r): r is AlmanacRow => r !== null),
      n
    );

  const isActive = (id: string) => warriorStatus(byId.get(id) ?? ({} as Warrior)) === 'Active';

  return [
    mkBoard('winStreaks', 'Best Win Streaks', 'warrior', rows((s) => s.bestWin, 'streak'), STREAK_CAVEAT),
    mkBoard(
      'currentStreaks',
      'Active Win Streaks',
      'warrior',
      rows((s) => s.cur, 'streak', isActive),
      STREAK_CAVEAT
    ),
    mkBoard('losingStreaks', 'Longest Slumps', 'warrior', rows((s) => s.bestLoss, 'streak'), STREAK_CAVEAT),
    mkBoard('killStreaks', 'Kill Streaks', 'warrior', rows((s) => s.bestKill, 'kills'), STREAK_CAVEAT),
  ].filter((b) => b.rows.length > 0);
}
