import { useMemo, useState } from 'react';
import type { TournamentBout, TournamentEntry } from '@/types/game';
import { isByeMatch } from '@/engine/matchmaking/tournamentHelpers';
import type { FilterStatus } from '@/components/tournaments/schedule';

interface UseTournamentScheduleResult {
  filter: FilterStatus;
  setFilter: (f: FilterStatus) => void;
  expandedRounds: Set<number>;
  totalRounds: number;
  stats: { total: number; completed: number; byes: number; upcoming: number };
  filteredRounds: Array<[number, TournamentBout[]]>;
  toggleRound: (round: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

/** Sorted round list filtered by the schedule filter mode. */
function filterRounds(
  roundsMap: Map<number, TournamentBout[]>,
  filter: FilterStatus
): Array<[number, TournamentBout[]]> {
  const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

  if (filter === 'all') return rounds;

  // One pass: per-round status flags plus the first round still pending —
  // scanned in roundsMap insertion order, matching the previous find().
  const roundFlags = new Map<number, { completed: boolean; pending: boolean }>();
  let firstPendingRound: number | undefined;
  for (const [round, bouts] of roundsMap) {
    const flags = { completed: false, pending: false };
    for (const b of bouts) {
      if (b.winner === undefined) flags.pending = true;
      else flags.completed = true;
    }
    roundFlags.set(round, flags);
    if (flags.pending && firstPendingRound === undefined) firstPendingRound = round;
  }

  return rounds.filter(([round]) => {
    const flags = roundFlags.get(round);
    switch (filter) {
      case 'completed':
        return flags?.completed ?? false;
      case 'upcoming':
        return flags?.pending ?? false;
      case 'current-round':
        return round === firstPendingRound;
      default:
        return true;
    }
  });
}

/**
 *
 */
export function useTournamentSchedule(tournament: TournamentEntry): UseTournamentScheduleResult {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));

  const totalRounds = useMemo(() => {
    const rounds = tournament.bracket.map((b) => b.round);
    return Math.max(...rounds, 1);
  }, [tournament.bracket]);

  const roundsMap = useMemo(() => {
    const map = new Map<number, TournamentBout[]>();
    tournament.bracket.forEach((bout) => {
      const existing = map.get(bout.round) || [];
      existing.push(bout);
      map.set(bout.round, existing);
    });
    return map;
  }, [tournament.bracket]);

  const stats = useMemo(() => {
    const total = tournament.bracket.length;
    const { completed, byes } = tournament.bracket.reduce(
      (acc, b) => {
        if (b.winner !== undefined) acc.completed++;
        if (isByeMatch(b)) acc.byes++;
        return acc;
      },
      { completed: 0, byes: 0 }
    );
    const upcoming = total - completed;

    return { total, completed, byes, upcoming };
  }, [tournament.bracket]);

  const filteredRounds = useMemo(() => filterRounds(roundsMap, filter), [roundsMap, filter]);

  const toggleRound = (round: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  const expandAll = () => {
    setExpandedRounds(new Set(roundsMap.keys()));
  };

  const collapseAll = () => {
    setExpandedRounds(new Set());
  };

  return {
    filter,
    setFilter,
    expandedRounds,
    totalRounds,
    stats,
    filteredRounds,
    toggleRound,
    expandAll,
    collapseAll,
  };
}
