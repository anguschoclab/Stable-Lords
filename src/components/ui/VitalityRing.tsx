import { cn } from '@/lib/utils';
import { BATTERY_THRESHOLDS } from '@/constants/core/ui';

interface VitalityRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Circular arc ring showing vitality 0–100.
 * Colors: stroke-primary (>70), stroke-arena-gold (30–70), stroke-destructive (<30).
 */
export function VitalityRing({ value, size = 40, strokeWidth = 4, className }: VitalityRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const strokeClass =
    clamped > BATTERY_THRESHOLDS.HIGH
      ? 'stroke-primary'
      : clamped > BATTERY_THRESHOLDS.MEDIUM
        ? 'stroke-arena-gold'
        : 'stroke-destructive';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Vitality: ${clamped}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-white/10"
          strokeWidth={strokeWidth}
        />
        <circle
          data-testid="vitality-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn('transition-all duration-700', strokeClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="butt"
          style={{ strokeDashoffset: offset, transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <span className="absolute text-[9px] font-mono font-black text-foreground/70">
        {clamped}
      </span>
    </div>
  );
}
