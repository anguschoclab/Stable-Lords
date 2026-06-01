import { useMemo } from 'react';
import type { GameState } from '@/types/game';
import { getRecentFights } from '@/engine/core/historyUtils';
import type { DerivedRivalry } from '@/types/rivalry.types';

// Custom Hook to gather player roster names
export function usePlayerRosterNames(state: GameState): Set<string> {
  return useMemo(
    () =>
      new Set(
        (state.roster || []).map((w) => w.name).concat(state.graveyard?.map((w) => w.name) ?? [])
      ),
    [state.roster, state.graveyard]
  );
}

// Custom Hook to map rival warrior names to their stable
export function useRivalWarriorStable(
  state: GameState
): Map<string, { stableName: string; ownerId: string }> {
  return useMemo(() => {
    const m = new Map<string, { stableName: string; ownerId: string }>();
    for (const r of state.rivals ?? []) {
      if (r.roster) {
        const info = { stableName: r.owner.stableName, ownerId: r.owner.id };
        for (const w of r.roster) m.set(w.name, info);
      }
    }
    return m;
  }, [state.rivals]);
}

// Custom Hook to compute ongoing rivalries
export function useRivalriesList(
  state: GameState,
  rosterNames: Set<string>,
  rivalWarriorStable: Map<string, { stableName: string; ownerId: string }>
): DerivedRivalry[] {
  return useMemo(() => {
    const map = new Map<string, DerivedRivalry>();
    const recentHistory = getRecentFights(state.arenaHistory || [], Math.max(1, state.week - 13));

    for (const bout of recentHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stableInfo = rivalWarriorStable.get(rivalName);
      if (!stableInfo) continue;
      const stable = stableInfo.stableName;

      if (!map.has(stable)) {
        map.set(stable, {
          stableName: stable,
          ownerId: stableInfo.ownerId,
          intensity: 0,
          kills: [],
          bouts: 0,
          playerWins: 0,
          playerLosses: 0,
        });
      }

      const r = map.get(stable);
      if (!r) continue;
      r.bouts++;

      const playerIsA = aIsPlayer;
      const playerWon = (playerIsA && bout.winner === 'A') || (!playerIsA && bout.winner === 'D');
      if (playerWon) r.playerWins++;
      else if (bout.winner) r.playerLosses++;

      if (bout.by === 'Kill' && bout.winner) {
        const killerIsPlayer = playerWon;
        r.kills.push({
          killer: killerIsPlayer ? (playerIsA ? bout.a : bout.d) : rivalName,
          victim: killerIsPlayer ? rivalName : playerIsA ? bout.a : bout.d,
          week: bout.week,
        });
      }
    }

    for (const r of map.values()) {
      let intensity = 0;
      intensity += Math.min(r.kills.length * 2, 4);
      intensity += r.bouts >= 5 ? 1 : 0;
      r.intensity = Math.max(1, Math.min(5, intensity));
    }

    return [...map.values()].filter((r) => r.bouts > 0).sort((a, b) => b.intensity - a.intensity);
  }, [state.arenaHistory, state.week, rosterNames, rivalWarriorStable]);
}

// Custom Hook to calculate the most wanted rival
export function useMostWantedRival(
  state: GameState,
  rosterNames: Set<string>,
  rivalWarriorStable: Map<string, { stableName: string; ownerId: string }>
) {
  return useMemo(() => {
    const winCounts = new Map<
      string,
      { name: string; stable: string; wins: number; kills: number }
    >();
    const recentHistory = getRecentFights(state.arenaHistory || [], Math.max(1, state.week - 13));
    for (const bout of recentHistory) {
      const aIsPlayer = rosterNames.has(bout.a);
      const dIsPlayer = rosterNames.has(bout.d);
      if (!aIsPlayer && !dIsPlayer) continue;

      const playerWon = (aIsPlayer && bout.winner === 'A') || (dIsPlayer && bout.winner === 'D');
      if (playerWon || !bout.winner) continue;

      const rivalName = aIsPlayer ? bout.d : bout.a;
      const stable = rivalWarriorStable.get(rivalName)?.stableName ?? 'Unknown';
      const entry = winCounts.get(rivalName) ?? { name: rivalName, stable, wins: 0, kills: 0 };
      entry.wins++;
      if (bout.by === 'Kill') entry.kills++;
      winCounts.set(rivalName, entry);
    }

    // ⚡ Bolt Optimization: Use a single O(N) scan to find the max entry instead of converting to array and sorting.
    // Reduces array allocations and O(N log N) GC pressure inside this useMemo hook.
    let maxEntry: { name: string; stable: string; wins: number; kills: number } | null = null;
    for (const entry of winCounts.values()) {
      if (
        !maxEntry ||
        entry.wins > maxEntry.wins ||
        (entry.wins === maxEntry.wins && entry.kills > maxEntry.kills)
      ) {
        maxEntry = entry;
      }
    }
    return maxEntry;
  }, [state.arenaHistory, state.week, rosterNames, rivalWarriorStable]);
}
