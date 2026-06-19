import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Self-contained Execute Week button. Drop it anywhere — it reads all
 * required state internally via useWeekExecution and the game store.
 */
export function ExecuteWeekButton() {
  const { week, day, isTournamentWeek, isSimulating } = useGameStore(
    useShallow((s) => ({
      week: s.week,
      day: s.day,
      isTournamentWeek: s.isTournamentWeek,
      isSimulating: s.isSimulating,
    }))
  );

  const { executeWeek, running } = useWeekExecution();

  const disabled = running || isSimulating;

  const label = running
    ? 'Resolving Bouts…'
    : isTournamentWeek
      ? `EXECUTE DAY ${day + 1}`
      : `EXECUTE WEEK ${week}`;

  return (
    <Button
      onClick={executeWeek}
      disabled={disabled}
      className="flex items-center gap-3 h-10 px-6 font-black text-[10px] uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-none shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
    >
      {running ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4 fill-current" />
      )}
      {label}
    </Button>
  );
}
