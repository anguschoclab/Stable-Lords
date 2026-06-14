import { useMemo } from 'react';
import type { GameState } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';
import { getRecentFights } from '@/engine/core/historyUtils';
import type { DerivedRivalry } from '@/types/rivalry.types';

type RivalryStateSlice = Pick<
  GameState,
  'roster' | 'graveyard' | 'rivals' | 'arenaHistory' | 'week'
>;

function buildNameResolver(state: RivalryStateSlice): Map<WarriorId, string> {
  const map = new Map<WarriorId, string>();
  for (const w of state.roster ?? []) map.set(w.id, w.name);
  for (const w of state.graveyard ?? []) map.set(w.id, w.name);
  for (const r of state.rivals ?? []) {
    for (const w of r.roster ?? []) map.set(w.id, w.name);
  }
  return map;
}

// Custom Hook to gather player roster IDs
/**
 *
 */
export function usePlayerRosterIds(state: RivalryStateSlice): Set<WarriorId> {
  return useMemo(
    () =>
      new Set(
        (state.roster || []).map((w) => w.id).concat(state.graveyard?.map((w) => w.id) ?? [])
      ),
    [state.roster, state.graveyard]
  );
}

// Custom Hook to map rival warrior IDs to their stable
/**
 *
 */
export function useRivalWarriorStable(
  state: RivalryStateSlice
): Map<WarriorId, { stableName: string; ownerId: string }> {
  return useMemo(() => {
    const m = new Map<WarriorId, { stableName: string; ownerId: string }>();
    for (const r of state.rivals ?? []) {
      if (r.roster) {
        const info = { stableName: r.owner.stableName, ownerId: r.owner.id };
        for (const w of r.roster) m.set(w.id, info);
      }
    }
    return m;
  }, [state.rivals]);
}

// Custom Hook to compute ongoing rivalries
/**
 *
 */
export function useRivalriesList(
  state: RivalryStateSlice,
  rosterIds: Set<WarriorId>,
  rivalWarriorStable: Map<WarriorId, { stableName: string; ownerId: string }>
): DerivedRivalry[] {
  return useMemo(() => {
    const nameResolver = buildNameResolver(state);
    const map = new Map<string, DerivedRivalry>();
    const recentHistory = getRecentFights(state.arenaHistory || [], Math.max(1, state.week - 13));

    for (const bout of recentHistory) {
      const aIsPlayer = rosterIds.has(bout.warriorIdA);
      const dIsPlayer = rosterIds.has(bout.warriorIdD);
      if (!aIsPlayer && !dIsPlayer) continue;

      const rivalId = aIsPlayer ? bout.warriorIdD : bout.warriorIdA;
      const stableInfo = rivalWarriorStable.get(rivalId);
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
        const playerName = playerIsA
          ? (nameResolver.get(bout.warriorIdA) ?? 'Unknown')
          : (nameResolver.get(bout.warriorIdD) ?? 'Unknown');
        const rivalName = nameResolver.get(rivalId) ?? 'Unknown';
        r.kills.push({
          killer: killerIsPlayer ? playerName : rivalName,
          victim: killerIsPlayer ? rivalName : playerName,
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
  }, [
    state.arenaHistory,
    state.week,
    rosterIds,
    rivalWarriorStable,
    state.roster,
    state.graveyard,
    state.rivals,
  ]);
}

// Custom Hook to calculate the most wanted rival
/**
 *
 */
export function useMostWantedRival(
  state: RivalryStateSlice,
  rosterIds: Set<WarriorId>,
  rivalWarriorStable: Map<WarriorId, { stableName: string; ownerId: string }>
) {
  return useMemo(() => {
    const nameResolver = buildNameResolver(state);
    const winCounts = new Map<
      WarriorId,
      { name: string; stable: string; wins: number; kills: number }
    >();
    const recentHistory = getRecentFights(state.arenaHistory || [], Math.max(1, state.week - 13));
    for (const bout of recentHistory) {
      const aIsPlayer = rosterIds.has(bout.warriorIdA);
      const dIsPlayer = rosterIds.has(bout.warriorIdD);
      if (!aIsPlayer && !dIsPlayer) continue;

      const playerWon = (aIsPlayer && bout.winner === 'A') || (dIsPlayer && bout.winner === 'D');
      if (playerWon || !bout.winner) continue;

      const rivalId = aIsPlayer ? bout.warriorIdD : bout.warriorIdA;
      const stable = rivalWarriorStable.get(rivalId)?.stableName ?? 'Unknown';
      const rivalName = nameResolver.get(rivalId) ?? 'Unknown';
      const entry = winCounts.get(rivalId) ?? { name: rivalName, stable, wins: 0, kills: 0 };
      entry.wins++;
      if (bout.by === 'Kill') entry.kills++;
      winCounts.set(rivalId, entry);
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
  }, [
    state.arenaHistory,
    state.week,
    rosterIds,
    rivalWarriorStable,
    state.roster,
    state.graveyard,
    state.rivals,
  ]);
}
