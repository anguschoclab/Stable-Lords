import { cn } from '@/lib/utils';

interface SeasonPhaseTicksProps {
  currentWeek: number;
  className?: string;
}

const PHASE_BOUNDARIES: Record<number, string> = {
  4: 'Opening',
  9: 'Championship',
};

const TOTAL_WEEKS = 13;

/**
 * 13-tick season phase timeline. Phase boundaries at wk 4 and wk 9.
 * Current week = filled active tick; past = filled dim; future = empty.
 */
export function SeasonPhaseTicks({ currentWeek, className }: SeasonPhaseTicksProps) {
  return (
    <div className={cn('relative select-none', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
          const week = i + 1;
          const isActive = week === currentWeek;
          const isPast = week < currentWeek;
          const boundaryLabel = PHASE_BOUNDARIES[week];

          return (
            <div key={week} className="relative flex flex-col items-center flex-1">
              {boundaryLabel && (
                <div
                  data-testid={`phase-marker-${week}`}
                  className="absolute -top-5 text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                  {boundaryLabel}
                </div>
              )}
              <div
                data-testid={`week-tick-${week}`}
                data-active={isActive ? 'true' : undefined}
                data-past={isPast ? 'true' : undefined}
                className={cn(
                  'h-2 w-full rounded-none transition-all motion-reduce:transition-none motion-reduce:transform-none duration-300',
                  isActive
                    ? 'bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.8)]'
                    : isPast
                      ? 'bg-primary/30'
                      : 'bg-white/10'
                )}
                title={`Week ${week}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[7px] font-mono text-muted-foreground/30 uppercase tracking-widest">
        <span>Wk 1</span>
        <span>Wk 13</span>
      </div>
    </div>
  );
}
