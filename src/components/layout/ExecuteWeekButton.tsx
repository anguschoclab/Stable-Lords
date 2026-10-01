import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * Self-contained advance button — runs the week/day pipeline via
 * useWeekExecution. `ctaLabel` overrides the idle label for route-aware
 * contexts (e.g. "BEGIN CYCLE", "CLOSE SEASON"); pass the EXECUTE WEEK
 * sentinel to keep the dynamic week counter.
 */
export function ExecuteWeekButton({ ctaLabel }: { ctaLabel?: string }) {
  const { week, day, isTournamentWeek, isSimulating } = useGameStore(
    useShallow((s) => ({
      week: s.week,
      day: s.day,
      isTournamentWeek: s.isTournamentWeek,
      isSimulating: s.isSimulating,
    }))
  );

  const { executeWeek, running } = useWeekExecution();
  const { unresolvedDirectives } = useStableAdvisor();
  const pendingCount = unresolvedDirectives.length;

  const disabled = running || isSimulating;

  const disabledReason = running
    ? 'Resolving bouts in progress'
    : isSimulating
      ? 'Simulation running'
      : undefined;

  const label = running
    ? 'Resolving Bouts…'
    : isTournamentWeek
      ? `ADVANCE DAY ${day + 1}`
      : !ctaLabel || ctaLabel === 'EXECUTE WEEK'
        ? `EXECUTE WEEK ${week}`
        : ctaLabel;

  return (
    <Button
      onClick={executeWeek}
      disabled={disabled}
      aria-label={label}
      tooltip={disabledReason}
      className="flex items-center gap-3 h-10 px-6 font-black text-[10px] uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-none shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all motion-reduce:transition-none motion-reduce:transform-none duration-300 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-black"
    >
      {running ? (
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <Zap className="h-4 w-4 fill-current" />
      )}
      {label}
      {pendingCount > 0 && !running && (
        <span
          aria-label={`${pendingCount} unresolved council directives`}
          className="ml-1 px-1.5 py-0.5 bg-arena-gold/20 text-arena-gold text-[9px] font-black rounded-sm"
        >
          {pendingCount}
        </span>
      )}
    </Button>
  );
}
