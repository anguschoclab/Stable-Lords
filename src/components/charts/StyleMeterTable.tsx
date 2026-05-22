/**
 * StyleMeterTable — win rate per fighting style for the player's roster.
 * Horizontal bar chart ranked by win rate.
 */
import { useGameStore } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
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

export function StyleMeterTable({ className }: StyleMeterTableProps) {
  const styleStats = useGameStore((s) => {
    const map = new Map<string, { wins: number; losses: number }>();
    for (const w of s.roster) {
      const entry = map.get(w.style) ?? { wins: 0, losses: 0 };
      entry.wins += w.career?.wins ?? 0;
      entry.losses += w.career?.losses ?? 0;
      map.set(w.style, entry);
    }
    return Array.from(map.entries())
      .map(([style, { wins, losses }]) => ({
        style,
        wins,
        losses,
        winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  });

  const rows: StyleRow[] = styleStats.map((stat) => ({
    ...stat,
    abbrev: STYLE_ABBREV[stat.style as keyof typeof STYLE_ABBREV] ?? stat.style,
  }));

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
        {rows.map((row) => {
          const pct = Math.round(row.winRate * 100);
          const barColor =
            pct >= 60 ? 'bg-primary' : pct >= 45 ? 'bg-arena-gold' : 'bg-destructive';

          return (
            <div key={row.style} className="flex items-center gap-3">
              <div className="w-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 shrink-0 text-right">
                {row.abbrev}
              </div>
              <div className="flex-1 h-1.5 bg-white/5 rounded-none overflow-hidden">
                <div
                  className={cn('h-full rounded-none transition-all duration-500', barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div
                className={cn(
                  'w-10 text-right font-mono font-black text-[10px] shrink-0',
                  pct >= 60 ? 'text-primary' : pct >= 45 ? 'text-arena-gold' : 'text-destructive'
                )}
              >
                {pct}%
              </div>
              <div className="w-12 text-right text-[8px] text-muted-foreground/30 font-mono shrink-0">
                {row.wins}W/{row.losses}L
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
