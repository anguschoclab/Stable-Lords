/**
 * StyleMeterTable — win rate per fighting style for the player's roster.
 * Horizontal bar chart ranked by win rate.
 */
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { WIN_RATE_THRESHOLDS } from '@/constants/core/ui';
import { STYLE_ABBREV } from '@/types/shared.types';

interface StyleMeterTableProps {
  className?: string;
}

interface StyleRow {
  style: string;
  abbrev: string;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * Style meter table.
 * @param - { class name }.
 */
export function StyleMeterTable({ className }: StyleMeterTableProps) {
  // ⚡ Bolt: Prevent heavy re-renders on every warrior state change by extracting
  // only the static fields needed for the style aggregation into a 1D primitive array.
  // Using flatMap avoids string concatenation bugs (e.g. pipe chars in styles)
  // while ensuring useShallow performs a 1-level deep primitive comparison.
  const rosterStats = useGameStore(
    useShallow((s) =>
      s.roster.flatMap((w) => [w.style, w.career?.wins ?? 0, w.career?.losses ?? 0])
    )
  );

  const rows: StyleRow[] = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number }>();
    for (let i = 0; i < rosterStats.length; i += 3) {
      const style = rosterStats[i] as string;
      const wins = rosterStats[i + 1] as number;
      const losses = rosterStats[i + 2] as number;

      if (!style) continue;

      const entry = map.get(style) ?? { wins: 0, losses: 0 };
      entry.wins += wins;
      entry.losses += losses;
      map.set(style, entry);
    }
    const result: StyleRow[] = [];
    for (const [style, { wins, losses }] of map) {
      result.push({
        style,
        wins,
        losses,
        winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
        abbrev: STYLE_ABBREV[style as keyof typeof STYLE_ABBREV] ?? style,
      });
    }
    result.sort((a, b) => b.winRate - a.winRate);
    return result;
  }, [rosterStats]);

  return (
    <Surface variant="glass" className={cn('p-4 flex flex-col gap-3', className)}>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        Style Win Rates
      </span>

      {rows.length === 0 && (
        <div className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-widest py-4 text-center">
          No bout data yet
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <StyleMeterRow key={row.style} row={row} />
        ))}
      </div>
    </Surface>
  );
}

/** One style's win-rate bar: abbrev, meter, percentage, record. */
function StyleMeterRow({ row }: { row: StyleRow }) {
  const pct = Math.round(row.winRate * 100);
  const tier =
    pct >= WIN_RATE_THRESHOLDS.HIGH ? 'high' : pct >= WIN_RATE_THRESHOLDS.MID ? 'mid' : 'low';
  const barColor = { high: 'bg-primary', mid: 'bg-arena-gold', low: 'bg-destructive' }[tier];
  const textColor = { high: 'text-primary', mid: 'text-arena-gold', low: 'text-destructive' }[tier];

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 shrink-0 text-right">
        {row.abbrev}
      </div>
      <div className="flex-1 h-1.5 bg-white/5 rounded-none overflow-hidden">
        <div
          className={cn(
            'h-full rounded-none transition-all motion-reduce:transition-none motion-reduce:transform-none duration-500',
            barColor
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={cn('w-10 text-right font-mono font-black text-[10px] shrink-0', textColor)}>
        {pct}%
      </div>
      <div className="w-12 text-right text-[8px] text-muted-foreground/30 font-mono shrink-0">
        {row.wins}W/{row.losses}L
      </div>
    </div>
  );
}
