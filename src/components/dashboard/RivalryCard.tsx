import { Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { intensityLabel, intensityColor, intensityBgColor } from '@/engine/rivals/rivalryDisplay';
import type { DerivedRivalry } from '@/types/rivalry.types';

interface RivalryCardProps {
  rivalry: DerivedRivalry;
  rosterNames: Set<string>;
}

/**
 *
 */
export function RivalryCard({ rivalry, rosterNames }: RivalryCardProps) {
  const r = rivalry;

  return (
    <div className="space-y-4 p-4 bg-white/2 rounded-none border border-white/5 hover:border-destructive/20 transition-all group/item">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover/item:text-destructive transition-colors">
            {r.stableName}
          </span>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-1 w-1 rounded-none',
                intensityBgColor(r.intensity),
                r.intensity >= 4 && 'animate-pulse'
              )}
            />
            <span
              className={cn(
                'text-[8px] font-black uppercase tracking-widest',
                intensityColor(r.intensity)
              )}
            >
              {intensityLabel(r.intensity)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono font-black text-foreground opacity-60">
            {r.playerWins}W <span className="text-foreground/10 mx-0.5">/</span> {r.playerLosses}L
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
            Bout Record
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1 h-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-none transition-all duration-500',
                i <= r.intensity
                  ? cn(
                      intensityBgColor(i),
                      i >= 4 && 'shadow-[0_0_8px_rgba(var(--destructive-rgb),0.5)]'
                    )
                  : 'bg-white/5'
              )}
            />
          ))}
        </div>
      </div>

      {r.bouts > 0 && (() => {
        const draws = Math.max(0, r.bouts - r.playerWins - r.playerLosses);
        const playerPct = (r.playerWins / r.bouts) * 100;
        const drawPct = (draws / r.bouts) * 100;
        const rivalPct = (r.playerLosses / r.bouts) * 100;
        return (
          <div data-testid="h2h-bar" className="flex h-1 rounded-none overflow-hidden gap-px">
            <div
              data-testid="h2h-player"
              className="bg-primary transition-all duration-500"
              style={{ width: `${playerPct}%` }}
            />
            <div
              data-testid="h2h-draw"
              className="bg-muted-foreground/20 transition-all duration-500"
              style={{ width: `${drawPct}%` }}
            />
            <div
              data-testid="h2h-rival"
              className="bg-destructive transition-all duration-500"
              style={{ width: `${rivalPct}%` }}
            />
          </div>
        );
      })()}

      {r.kills.length > 0 && (
        <div className="space-y-1.5">
          {r.kills.slice(-2).map((k) => (
            <div
              key={`${k.killer}-${k.victim}`}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
            >
              <Skull
                className={cn(
                  'h-3 w-3',
                  rosterNames.has(k.killer) ? 'text-primary' : 'text-destructive'
                )}
              />
              <span className="text-muted-foreground/60">{k.killer}</span>
              <span className="text-foreground/10">→</span>
              <span className="text-foreground/80">{k.victim}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
