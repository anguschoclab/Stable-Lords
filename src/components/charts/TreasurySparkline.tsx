/**
 * TreasurySparkline — inline SVG sparkline of treasury over weekly snapshots.
 * Reads from state.ledger (weekly entries) or falls back to current value only.
 */
import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import type { LedgerEntry } from '@/types/game';

interface TreasurySparklineProps {
  className?: string;
  height?: number;
  showLabel?: boolean;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function buildWeeklyPoints(
  ledger: LedgerEntry[],
  week: number,
  treasury: number
): { week: number; value: number }[] {
  if (!ledger || ledger.length === 0) {
    return [{ week, value: treasury }];
  }

  const series: { week: number; value: number }[] = [];
  let currentWeek = -1;
  let cum = 0;

  for (const entry of ledger) {
    const w = entry.week ?? 0;
    if (w !== currentWeek) {
      if (currentWeek !== -1) {
        series.push({ week: currentWeek, value: cum });
      }
      currentWeek = w;
    }
    cum += entry.amount ?? 0;
  }
  // Add final week
  if (currentWeek !== -1) {
    series.push({ week: currentWeek, value: cum });
  }

  // Ensure current week is represented
  const lastSeries = series[series.length - 1];
  if (series.length === 0 || !lastSeries || lastSeries.week !== week) {
    series.push({ week, value: treasury });
  }
  return series.slice(-12); // last 12 weeks
}

function buildSparklinePath(
  points: { week: number; value: number }[],
  min: number,
  range: number,
  H: number,
  W: number,
  PAD: number
): string {
  if (points.length < 2) return '';
  return points
    .map((p, i) => {
      const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SparklineLabelProps {
  treasury: number;
  delta: number;
  isUp: boolean;
}

function SparklineLabel({ treasury, delta, isUp }: SparklineLabelProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-3.5 w-3.5 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Treasury
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-[9px] font-black uppercase tracking-widest',
            isUp ? 'text-primary' : 'text-destructive'
          )}
        >
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta >= 0 ? '+' : ''}
          {delta.toLocaleString()}g
        </div>
      </div>

      <div className="font-display font-black text-2xl tracking-tighter text-arena-gold leading-none">
        {treasury.toLocaleString()}g
      </div>
    </>
  );
}

interface SparklineDotProps {
  points: { week: number; value: number }[];
  min: number;
  range: number;
  H: number;
  W: number;
  PAD: number;
  isUp: boolean;
}

function SparklineDot({ points, min, range, H, W, PAD, isUp }: SparklineDotProps) {
  const last = points[points.length - 1];
  if (!last || points.length === 0) return null;
  const i = points.length - 1;
  const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const y = H - PAD - ((last.value - min) / range) * (H - PAD * 2);
  // TODO: verify isUp color — both branches currently render red
  const color = isUp ? 'rgb(255,0,0)' : 'rgb(239,68,68)';
  return (
    <circle
      cx={x}
      cy={y}
      r={3}
      fill={color}
      className="drop-shadow-[0_0_4px_rgba(255,0,0,0.8)]"
    />
  );
}

interface SparklineSVGProps {
  pathD: string;
  areaD: string;
  points: { week: number; value: number }[];
  min: number;
  range: number;
  H: number;
  W: number;
  PAD: number;
  isUp: boolean;
  height: number;
}

function SparklineSVG({ pathD, areaD, points, min, range, H, W, PAD, isUp, height }: SparklineSVGProps) {
  // TODO: verify isUp color — both branches currently render red
  const strokeColor = isUp ? 'rgb(255,0,0)' : 'rgb(239,68,68)';
  const gradientColor = isUp ? 'rgb(255,0,0)' : 'rgb(239,68,68)';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={height}
      className="overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="treasury-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaD && <path d={areaD} fill="url(#treasury-grad)" />}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SparklineDot points={points} min={min} range={range} H={H} W={W} PAD={PAD} isUp={isUp} />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Treasury sparkline.
 * @param  - {
  class name,
  height = 40,
  show label = true,
}.
 * @returns The result.
 */
export function TreasurySparkline({
  className,
  height = 40,
  showLabel = true,
}: TreasurySparklineProps) {
  const { treasury, ledger, week } = useGameStore(
    useShallow((s) => ({
      treasury: s.treasury,
      ledger: s.ledger,
      week: s.week,
    }))
  );

  // Build weekly treasury snapshots from ledger entries in chronological order
  const points = useMemo(
    () => buildWeeklyPoints(ledger, week, treasury),
    [ledger, treasury, week]
  );

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 200;
  const H = height;
  const PAD = 4;

  const pathD = useMemo(
    () => buildSparklinePath(points, min, range, H, W, PAD),
    [points, min, range, H, W]
  );

  const areaD = pathD
    ? `${pathD} L ${(PAD + (W - PAD * 2)).toFixed(1)} ${(H - PAD).toFixed(1)} L ${PAD} ${(H - PAD).toFixed(1)} Z`
    : '';

  const last = values[values.length - 1] ?? 0;
  const prev = values[values.length - 2] ?? last;
  const delta = last - prev;
  const isUp = delta >= 0;

  return (
    <Surface variant="glass" className={cn('p-4 flex flex-col gap-2', className)}>
      {showLabel && <SparklineLabel treasury={treasury} delta={delta} isUp={isUp} />}

      {points.length >= 2 && (
        <SparklineSVG
          pathD={pathD}
          areaD={areaD}
          points={points}
          min={min}
          range={range}
          H={H}
          W={W}
          PAD={PAD}
          isUp={isUp}
          height={height}
        />
      )}

      {points.length < 2 && (
        <div className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-widest">
          No history yet
        </div>
      )}
    </Surface>
  );
}
