import type { FightSummary } from '@/types/game';

interface WeeklyDigestMiniProps {
  week: number;
  arenaHistory: FightSummary[];
  currentWeek: number;
}

export function WeeklyDigestMini({ week, arenaHistory, currentWeek }: WeeklyDigestMiniProps) {
  const fightsThisWeek = arenaHistory.filter((f) => f.week === currentWeek).length;

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-none">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <span className="text-lg font-black">{week}</span>
      </div>
      <div>
        <p className="text-sm font-bold">Week {week} Summary</p>
        <p className="text-xs text-muted-foreground">
          {fightsThisWeek > 0 ? `${fightsThisWeek} fights recorded` : 'No fights yet'}
        </p>
      </div>
    </div>
  );
}
