import { useState, useMemo } from 'react';
import type { WarriorRow } from '@/types/leaderboard';

/**
 *
 */
export function useWarriorLeaderboard(rows: WarriorRow[]) {
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<'kills' | 'wins' | 'winRate' | null>(null);
  const [myWarriorsOnly, setMyWarriorsOnly] = useState(false);

  const classes = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((r) => {
      if (r.style) seen.add(r.style);
    });
    return Array.from(seen).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = myWarriorsOnly ? rows.filter((r) => r.isPlayer) : rows;
    if (classFilter) result = result.filter((r) => r.style === classFilter);
    if (quickFilter === 'kills') result = [...result].sort((a, b) => b.kills - a.kills);
    else if (quickFilter === 'wins') result = [...result].sort((a, b) => b.wins - a.wins);
    else if (quickFilter === 'winRate') result = [...result].sort((a, b) => b.winRate - a.winRate);
    return result;
  }, [rows, classFilter, quickFilter, myWarriorsOnly]);

  const isFiltered = classFilter !== null || quickFilter !== null || myWarriorsOnly;

  const clearFilters = () => {
    setClassFilter(null);
    setQuickFilter(null);
    setMyWarriorsOnly(false);
  };

  return {
    classFilter,
    setClassFilter,
    quickFilter,
    setQuickFilter,
    myWarriorsOnly,
    setMyWarriorsOnly,
    classes,
    filtered,
    isFiltered,
    clearFilters,
  };
}
