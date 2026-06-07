import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/game';

/** A single ranked warrior row in the global arena leaderboard. */
export interface ArenaLeaderboardEntry {
  warrior: Warrior;
  stableName: string;
  isPlayer: boolean;
}

/**
 * Computes the top N active warriors by fame across the player roster and all
 * rival stables. Uses a bounded insertion sort (O(N·limit)) to avoid sorting
 * the full population.
 */
export function calculateArenaLeaderboard(
  roster: Warrior[],
  rivals: RivalStableData[] | undefined,
  playerStableName: string,
  limit = 10
): ArenaLeaderboardEntry[] {
  if (limit <= 0) return [];

  const top: ArenaLeaderboardEntry[] = [];

  const insert = (entry: ArenaLeaderboardEntry) => {
    const fame = entry.warrior.fame;
    if (top.length === limit && fame <= top[limit - 1]!.warrior.fame) {
      return;
    }

    let i = top.length - 1;
    while (i >= 0 && top[i]!.warrior.fame < fame) {
      i--;
    }

    top.splice(i + 1, 0, entry);
    if (top.length > limit) {
      top.pop();
    }
  };

  const allActive: ArenaLeaderboardEntry[] = [
    ...roster
      .filter((w) => w.status === 'Active')
      .map((w) => ({ warrior: w, stableName: playerStableName, isPlayer: true as const })),
    ...(rivals ?? []).flatMap((r) =>
      r.roster
        .filter((w) => w.status === 'Active')
        .map((w) => ({ warrior: w, stableName: r.owner.stableName, isPlayer: false as const }))
    ),
  ];

  for (const entry of allActive) {
    insert(entry);
  }

  return top;
}
