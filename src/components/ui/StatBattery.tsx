import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface StatBatteryProps {
  label: string;
  value: number;
  max?: number;
  labelValue?: string | number; // Optional explicit display string for the value
  colorClass?: string; // Tailwind class for the progress bar color
  className?: string; // Optional wrapper class
}

export const StatBattery = React.forwardRef<HTMLDivElement, StatBatteryProps>(function StatBattery(
  { label, value, max = 100, labelValue, colorClass, className },
  ref
) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const displayValue = labelValue !== undefined ? labelValue : value;

  return (
    <div ref={ref} className={cn('flex items-center gap-3', className)}>
      <span className="text-[10px] text-muted-foreground w-10 font-black uppercase tracking-widest opacity-60">
        {label}
      </span>
      <div className="flex-1 relative">
        <Progress
          value={pct}
          className={cn('h-[2px] bg-neutral-950/40 ring-1 ring-white/5', colorClass)}
        />
      </div>
      <span className="text-[11px] font-mono font-black w-6 text-right text-foreground/80">
        {displayValue}
      </span>
    </div>
  );
});
