/**
 * Tournament Schedule Component
 * Displays upcoming matches organized by round with filtering and sorting
 */
import { useGameStore } from '@/state/useGameStore';
import { useTournamentSchedule } from '@/hooks/useTournamentSchedule';
import { TournamentStatsHeader, TournamentFilterBar, TournamentRoundCard } from './schedule';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import type { TournamentEntry } from '@/types/game';

interface TournamentScheduleProps {
  tournament: TournamentEntry;
  currentWeek: number;
}

/**
 *
 */
export function TournamentSchedule({ tournament, currentWeek }: TournamentScheduleProps) {
  const state = useGameStore();
  const {
    filter,
    setFilter,
    expandedRounds,
    totalRounds,
    stats,
    filteredRounds,
    toggleRound,
    expandAll,
    collapseAll,
  } = useTournamentSchedule(tournament);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TournamentStatsHeader stats={stats} />
        <BookmarkButton entityType="tournament" entityId={tournament.id} size="sm" />
      </div>

      <TournamentFilterBar
        filter={filter}
        setFilter={setFilter}
        expandAll={expandAll}
        collapseAll={collapseAll}
      />

      <div className="space-y-3">
        {filteredRounds.map(([round, bouts]) => (
          <TournamentRoundCard
            key={round}
            round={round}
            bouts={bouts}
            isExpanded={expandedRounds.has(round)}
            tournamentWeek={tournament.week}
            currentWeek={currentWeek}
            totalRounds={totalRounds}
            toggleRound={toggleRound}
            state={state}
          />
        ))}
      </div>
    </div>
  );
}
