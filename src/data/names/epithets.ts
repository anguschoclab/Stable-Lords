/**
 * Earned epithets — permanent honorific suffixes appended to a warrior's
 * display name (`warriorDisplayName`). The canonical `Warrior.name` is never
 * mutated; the epithet rides alongside it.
 *
 * Epithets are picked deterministically by hashing `cause:warriorId` — no RNG
 * draws — so engine paths stay replay-safe.
 */
import { hashStr } from '@/utils/random';

/** The career event that earns an epithet. */
/** Milestone/award causes that can grant an epithet. */
export type EpithetCause =
  | 'kill_3'
  | 'kill_5'
  | 'kill_10'
  | 'undefeated_10'
  | 'arena_champion'
  | 'grand_champion'
  | 'legend';

export const EPITHET_TABLES: Record<EpithetCause, readonly string[]> = {
  kill_3: ['the Bloody', 'the Grim', 'Skulltaker', 'the Red', 'Bloodedge'],
  kill_5: ['the Reaper', 'the Butcher', 'Deathdealer', 'the Merciless', 'Gravedigger'],
  kill_10: ['the Slayer', 'Bloodsworn', 'the Destroyer', 'the Deathless', 'Soulreaver'],
  undefeated_10: ['the Unbeaten', 'the Undefeated', 'the Peerless', 'the Unbowed'],
  arena_champion: [
    'the Invincible',
    'the Crowned',
    'the Throneholder',
    'Lion of the Arena',
    'Champion of the Sands',
    'the Arena King',
  ],
  grand_champion: [
    'the Grand Champion',
    'the Immortal',
    'the Eternal',
    'the Supreme',
    'Lord of Champions',
  ],
  legend: ['the Elder', 'the Venerable', 'the Grey', 'the Founder', 'the Wise', 'the Storied'],
};

/** Higher rank wins — a warrior's epithet only ever upgrades. */
export const EPITHET_RANK: Record<EpithetCause, number> = {
  legend: 1,
  kill_3: 2,
  kill_5: 3,
  undefeated_10: 4,
  kill_10: 5,
  arena_champion: 6,
  grand_champion: 7,
};

const RANK_BY_EPITHET = new Map<string, number>(
  (Object.entries(EPITHET_TABLES) as [EpithetCause, readonly string[]][]).flatMap(
    ([cause, table]) => table.map((e) => [e, EPITHET_RANK[cause]] as const)
  )
);

/** Deterministic epithet for (cause, warriorId) — pure, no RNG draw. */
export function epithetFor(cause: EpithetCause, warriorId: string): string {
  const table = EPITHET_TABLES[cause];
  return table[hashStr(`${cause}:${warriorId}`) % table.length] ?? 'the Bold';
}

/** Rank of a stored epithet string; 0 when unknown/absent. */
export function epithetRankOf(epithet: string | undefined | null): number {
  return epithet ? (RANK_BY_EPITHET.get(epithet) ?? 0) : 0;
}

/**
 * Returns the epithet to award for `cause`, respecting rank — never
 * downgrades an existing higher-ranked epithet.
 */
export function earnEpithet(
  cause: EpithetCause,
  warriorId: string,
  current?: string
): string | undefined {
  if (epithetRankOf(current) >= EPITHET_RANK[cause]) return undefined;
  return epithetFor(cause, warriorId);
}

/**
 * Evaluates career milestones and returns the epithet earned, or undefined.
 * Only upgrades — returns undefined when the current epithet already
 * outranks the milestone.
 */
export function milestoneEpithet(
  warriorId: string,
  career: { wins: number; losses: number; kills: number },
  currentEpithet?: string
): string | undefined {
  let cause: EpithetCause | undefined;
  if (career.kills >= 10) cause = 'kill_10';
  else if (career.wins >= 10 && career.losses === 0) cause = 'undefeated_10';
  else if (career.kills >= 5) cause = 'kill_5';
  else if (career.kills >= 3) cause = 'kill_3';
  if (!cause) return undefined;
  return earnEpithet(cause, warriorId, currentEpithet);
}

/** Whether a retiring warrior's career is distinguished enough for 'legend'. */
export function qualifiesForLegend(w: {
  fame?: number;
  titles?: string[];
  career?: { wins: number; kills: number };
}): boolean {
  return (
    (w.career?.wins ?? 0) >= 50 ||
    (w.career?.kills ?? 0) >= 10 ||
    (w.fame ?? 0) >= 1500 ||
    (w.titles?.length ?? 0) > 0
  );
}
