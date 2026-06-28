import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/shared.types';

interface StyleCompositionDonutProps {
  styles: FightingStyle[];
  size?: number;
  className?: string;
}

const STYLE_COLORS: string[] = [
  'hsl(var(--primary))',
  'hsl(var(--arena-gold))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
  'hsl(var(--arena-fame))',
  'hsl(var(--arena-blood))',
  'hsl(var(--muted-foreground) / 0.6)',
  'hsl(var(--primary) / 0.5)',
  'hsl(var(--arena-gold) / 0.5)',
  'hsl(var(--accent) / 0.5)',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/**
 * Miniature donut SVG showing roster fighting-style composition as arc segments.
 * Each distinct style gets one path. Empty roster renders nothing.
 */
export function StyleCompositionDonut({ styles, size = 44, className }: StyleCompositionDonutProps) {
  const segments = useMemo(() => {
    if (styles.length === 0) return [];
    const counts = new Map<FightingStyle, number>();
    for (const s of styles) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    const total = styles.length;
    const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    let cursor = 0;
    return entries.map(([style, count], index) => {
      const sweep = (count / total) * 360;
      const start = cursor;
      cursor += sweep;
      return { style, count, sweep, start, index };
    });
  }, [styles]);

  if (segments.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 5;
  const strokeWidth = 6;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0', className)}
      aria-label="Roster style composition"
    >
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-white/5" strokeWidth={strokeWidth} />
      {segments.map(({ style, count, sweep, start, index }) => {
        const key = style.replace(/\s+/g, '-');
        const gapDeg = segments.length > 1 ? 2 : 0;
        const adjustedSweep = Math.max(0, sweep - gapDeg);
        const d = describeArc(cx, cy, r, start + gapDeg / 2, start + gapDeg / 2 + adjustedSweep);
        return (
          <path
            key={style}
            data-testid={`style-arc-${key}`}
            data-sweep={adjustedSweep.toFixed(2)}
            d={d}
            fill="none"
            stroke={STYLE_COLORS[index % STYLE_COLORS.length]}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          >
            <title>{STYLE_DISPLAY_NAMES[style]}: {count}</title>
          </path>
        );
      })}
    </svg>
  );
}
