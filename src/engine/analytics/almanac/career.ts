/** §1 Career boards — one builder per list; each returns a single board. */
import type { Warrior } from '@/types/warrior.types';
import { boutsOf, by, cap, career, medalsOf, mkBoard, numDesc, strAsc, warriorRow } from './shared';
import type { AlmanacBoard, AlmanacInput, AlmanacRow } from './shared';

type Row = (w: Warrior, value: number, label: string, extra?: AlmanacRow['extra']) => AlmanacRow;

const winsBoard = (ws: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'wins',
    'Most Wins',
    'warrior',
    cap(
      ws
        .filter((w) => career(w).wins > 0)
        .sort(
          by(
            numDesc((w) => career(w).wins),
            numDesc((w) => career(w).kills),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, career(w).wins, 'wins')),
      n
    )
  );

const boutsBoard = (ws: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'bouts',
    'Most Bouts',
    'warrior',
    cap(
      [...ws]
        .sort(
          by(
            numDesc(boutsOf),
            numDesc((w) => career(w).wins),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, boutsOf(w), 'bouts')),
      n
    )
  );

const winRateBoard = (ws: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'winRate',
    'Best Win Rate',
    'warrior',
    cap(
      ws
        .filter((w) => boutsOf(w) >= 10)
        .sort(
          by(
            numDesc((w) => career(w).wins / boutsOf(w)),
            numDesc((w) => career(w).wins),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) =>
          row(w, Math.round((career(w).wins / boutsOf(w)) * 1000) / 10, '%', {
            wins: career(w).wins,
            bouts: boutsOf(w),
          })
        ),
      n
    )
  );

const killsBoard = (ws: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'kills',
    'Most Kills',
    'warrior',
    cap(
      ws
        .filter((w) => career(w).kills > 0)
        .sort(
          by(
            numDesc((w) => career(w).kills),
            numDesc((w) => career(w).wins),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, career(w).kills, 'kills')),
      n
    )
  );

const killEfficiencyBoard = (ws: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'killEfficiency',
    'Kill Efficiency',
    'warrior',
    cap(
      ws
        .filter((w) => career(w).kills >= 2 && boutsOf(w) >= 10)
        .sort(
          by(
            numDesc((w) => career(w).kills / boutsOf(w)),
            numDesc((w) => career(w).kills),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) =>
          row(w, Math.round((career(w).kills / boutsOf(w)) * 1000) / 10, '%', {
            kills: career(w).kills,
            bouts: boutsOf(w),
          })
        ),
      n
    )
  );

const fameBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'fame',
    'Highest Fame',
    'warrior',
    cap(
      all
        .filter((w) => (w.fame ?? 0) > 0)
        .sort(
          by(
            numDesc((w) => w.fame ?? 0),
            numDesc((w) => career(w).wins),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, w.fame ?? 0, 'fame')),
      n
    )
  );

const popularityBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'popularity',
    'Most Popular',
    'warrior',
    cap(
      all
        .filter((w) => (w.popularity ?? 0) > 0)
        .sort(
          by(
            numDesc((w) => w.popularity ?? 0),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, w.popularity ?? 0, 'popularity')),
      n
    )
  );

const medalsBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'medals',
    'Most Decorated',
    'warrior',
    cap(
      all
        .filter((w) => {
          const m = medalsOf(w);
          return m.gold + m.silver + m.bronze > 0;
        })
        .sort(
          by(
            numDesc((w) => medalsOf(w).gold),
            numDesc((w) => medalsOf(w).silver),
            numDesc((w) => medalsOf(w).bronze),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => {
          const m = medalsOf(w);
          return row(w, m.gold + m.silver + m.bronze, 'medals', {
            gold: m.gold,
            silver: m.silver,
            bronze: m.bronze,
          });
        }),
      n
    )
  );

const honorsBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'honors',
    'Most Honored',
    'warrior',
    cap(
      all
        .filter((w) => (w.awards?.length ?? 0) > 0 || (w.titles?.length ?? 0) > 0)
        .sort(
          by(
            numDesc((w) => w.awards?.length ?? 0),
            numDesc((w) => w.titles?.length ?? 0),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) =>
          row(w, w.awards?.length ?? 0, 'awards', {
            awards: w.awards?.length ?? 0,
            titles: w.titles?.length ?? 0,
          })
        ),
      n
    )
  );

const titlesBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'titles',
    'Most Titles',
    'warrior',
    cap(
      all
        .filter((w) => (w.titles?.length ?? 0) > 0)
        .sort(
          by(
            numDesc((w) => w.titles?.length ?? 0),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, w.titles?.length ?? 0, 'titles')),
      n
    )
  );

const undefeatedBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'undefeated',
    'Undefeated',
    'warrior',
    cap(
      all
        .filter((w) => career(w).losses === 0 && career(w).wins >= 3)
        .sort(
          by(
            numDesc((w) => career(w).wins),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, career(w).wins, 'wins')),
      n
    )
  );

const longestCareerBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'longestCareer',
    'Longest Career',
    'warrior',
    cap(
      all
        .filter((w) => (w.age ?? 0) > 0)
        .sort(
          by(
            numDesc((w) => w.age ?? 0),
            numDesc(boutsOf),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, w.age ?? 0, 'years')),
      n
    )
  );

const careerLengthBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'careerLength',
    'Seasons Fought',
    'warrior',
    cap(
      all
        .filter((w) => Object.keys(w.yearlySnapshots ?? {}).length > 0)
        .sort(
          by(
            numDesc((w) => Object.keys(w.yearlySnapshots ?? {}).length),
            numDesc((w) => career(w).wins),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, Object.keys(w.yearlySnapshots ?? {}).length, 'seasons')),
      n
    )
  );

const seasonPointsBoard = (all: Warrior[], row: Row, n: number): AlmanacBoard =>
  mkBoard(
    'seasonPoints',
    'Season Points',
    'warrior',
    cap(
      all
        .filter((w) => (w.seasonPoints ?? 0) > 0)
        .sort(
          by(
            numDesc((w) => w.seasonPoints ?? 0),
            numDesc((w) => w.fame ?? 0),
            strAsc((w) => w.id as string)
          )
        )
        .map((w) => row(w, w.seasonPoints ?? 0, 'pts')),
      n
    ),
    'Current season'
  );

/** §1 Career boards — wins, win rate, kills, fame, medals, awards, titles, longevity. */
export function computeCareerBoards(input: AlmanacInput): AlmanacBoard[] {
  const n = input.topN ?? 100;
  const row: Row = (w, value, valueLabel, extra) =>
    warriorRow({ w, input, value, valueLabel, extra });
  const withBouts = input.warriors.filter((w) => boutsOf(w) > 0);
  const all = input.warriors;

  return [
    winsBoard(withBouts, row, n),
    boutsBoard(withBouts, row, n),
    winRateBoard(withBouts, row, n),
    killsBoard(withBouts, row, n),
    killEfficiencyBoard(withBouts, row, n),
    fameBoard(all, row, n),
    popularityBoard(all, row, n),
    medalsBoard(all, row, n),
    honorsBoard(all, row, n),
    titlesBoard(all, row, n),
    undefeatedBoard(all, row, n),
    longestCareerBoard(all, row, n),
    careerLengthBoard(all, row, n),
    seasonPointsBoard(all, row, n),
  ];
}
