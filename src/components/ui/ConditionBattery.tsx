import { cn } from '@/lib/utils';

interface ConditionBatteryProps {
  value: number; // 0-100
  className?: string;
  showText?: boolean;
}

export function ConditionBattery({ value, className, showText = false }: ConditionBatteryProps) {
  // Determine color segment
  const color = value > 70 ? 'bg-primary' : value > 30 ? 'bg-arena-gold' : 'bg-destructive';
  const opacity = value > 70 ? 'opacity-100' : value > 30 ? 'opacity-80' : 'opacity-90';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        {showText && (
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              value < 30 ? 'text-destructive' : 'text-muted-foreground/60'
            )}
          >
            Condition · {Math.round(value)}%
          </span>
        )}
      </div>
      <div className="relative w-full h-[3px] bg-neutral-950/40 ring-1 ring-white/5 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-700 ease-out', color, opacity)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
