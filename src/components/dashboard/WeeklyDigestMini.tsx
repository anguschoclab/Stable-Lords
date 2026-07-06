import { useMemo } from 'react';
import type { WarriorId } from '@/types/game';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useDigestSummary } from '@/hooks/useDigestSummary';

/**
 *
 */
export function WeeklyDigestMini() {
  const { week, arenaHistory, boutOffers, roster } = useGameStore(
    useShallow((s) => ({
      week: s.week,
      arenaHistory: s.arenaHistory,
      boutOffers: s.boutOffers,
      roster: s.roster,
    }))
  );

  const playerWarriorIds = useMemo(() => new Set<WarriorId>(roster.map((w) => w.id)), [roster]);

  const summary = useDigestSummary({
    arenaHistory,
    boutOffers,
    currentWeek: week,
    playerWarriorIds,
  });

  const hasFights = summary.totalFights > 0 && (summary.wins > 0 || summary.losses > 0);
  const hasPending = summary.pendingOffers > 0;
  const hasActivity = hasFights || hasPending;

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-none">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <span className="text-lg font-black">{week}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold">Week {week} Summary</p>
        {hasActivity ? (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {hasFights && (
              <span>
                W:{summary.wins} L:{summary.losses} K:{summary.kills}
              </span>
            )}
            {hasPending && <span>{summary.pendingOffers} pending</span>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No activity</p>
        )}
      </div>
    </div>
  );
}
