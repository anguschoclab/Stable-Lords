/**
 * Derived data for the Hall of Fights page: hall entries, a fight lookup map,
 * week-grouped recent fights, and per-style win statistics.
 */
import { useMemo } from 'react';
import { LoreArchive } from '../LoreArchive';
import type { FightSummary } from '@/types/state.types';
import type { GameState } from '@/types/state.types';

/** Derives hall entries, fight lookups, week groups, and style stats from state. */
export function useHallData(state: GameState) {
  // Hall entries from LoreArchive
  const hallEntries = useMemo(() => {
    // state.week is used as a dependency to ensure hall entries are refreshed when time advances
    void state.week;
    return LoreArchive.allHall().slice().reverse();
  }, [state.week]);

  // Build fight lookup from game state
  const fightMap = useMemo(() => {
    const map = new Map<string, FightSummary>();
    for (const f of state.arenaHistory) {
      map.set(f.id, f);
    }
    return map;
  }, [state.arenaHistory]);

  // Recent fights grouped by week
  const fightsByWeek = useMemo(() => {
    const groups = new Map<number, typeof state.arenaHistory>();
    for (const f of state.arenaHistory.slice(-50)) {
      const list = groups.get(f.week) ?? [];
      list.push(f);
      groups.set(f.week, list);
    }
    return [...groups.entries()].sort(([a], [b]) => b - a);
  }, [state]);

  // Style stats from all history
  const styleStats = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number; kills: number; fights: number }> =
      {};
    for (const f of state.arenaHistory) {
      const sA = stats[f.styleA] ?? { wins: 0, losses: 0, kills: 0, fights: 0 };
      stats[f.styleA] = sA;
      const sD = stats[f.styleD] ?? { wins: 0, losses: 0, kills: 0, fights: 0 };
      stats[f.styleD] = sD;
      sA.fights++;
      sD.fights++;
      if (f.winner === 'A') {
        sA.wins++;
        sD.losses++;
      }
      if (f.winner === 'D') {
        sD.wins++;
        sA.losses++;
      }
      if (f.by === 'Kill') {
        if (f.winner === 'A') sA.kills++;
        if (f.winner === 'D') sD.kills++;
      }
    }
    return Object.entries(stats)
      .map(([style, s]) => ({
        style,
        ...s,
        winRate: s.fights ? Math.round((s.wins / s.fights) * 100) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [state.arenaHistory]);

  return { hallEntries, fightMap, fightsByWeek, styleStats };
}
