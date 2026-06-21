import { cn } from '@/lib/utils';
import { BATTERY_THRESHOLDS } from '@/constants/core/ui';

interface ConditionBatteryProps {
  value: number; // 0-100
  className?: string;
  showText?: boolean;
} /**
 * Condition battery.
 * @param - { value, class name, show text = false }.
 */

/**
 * Condition battery.
 * @param - { value, class name, show text = false }.
 */
export function ConditionBattery({ value, className, showText = false }: ConditionBatteryProps) {
  // Determine color segment
  const color =
    value > BATTERY_THRESHOLDS.HIGH
      ? 'bg-primary'
      : value > BATTERY_THRESHOLDS.MEDIUM
        ? 'bg-arena-gold'
        : 'bg-destructive';
  const opacity =
    value > BATTERY_THRESHOLDS.HIGH
      ? 'opacity-100'
      : value > BATTERY_THRESHOLDS.MEDIUM
        ? 'opacity-80'
        : 'opacity-90';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        {showText && (
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              value < BATTERY_THRESHOLDS.MEDIUM ? 'text-destructive' : 'text-muted-foreground/60'
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
