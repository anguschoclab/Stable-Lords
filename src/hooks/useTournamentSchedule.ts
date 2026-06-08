import { useMemo, useState } from 'react';
import type { TournamentBout, TournamentEntry } from '@/types/game';
import { isByeMatch } from '@/utils/tournamentHelpers';
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

  const filteredRounds = useMemo(() => {
    const rounds = Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);

    if (filter === 'all') return rounds;

    return rounds.filter(([round, bouts]) => {
      const hasCompleted = bouts.some((b) => b.winner !== undefined);
      const hasPending = bouts.some((b) => b.winner === undefined);

      switch (filter) {
        case 'completed':
          return hasCompleted;
        case 'upcoming':
          return hasPending;
        case 'current-round': {
          const firstPendingRound = Array.from(roundsMap.entries()).find(([_, bs]) =>
            bs.some((b) => b.winner === undefined)
          );
          return round === firstPendingRound?.[0];
        }
        default:
          return true;
      }
    });
  }, [roundsMap, filter]);

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
