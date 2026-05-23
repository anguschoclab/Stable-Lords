import { cn } from '@/lib/utils';
import type { FightOutcomeBy } from '@/types/game';
import { Skull, Swords, Zap, Shield, Activity, Crosshair } from 'lucide-react';

interface BoutResolutionProps {
  isComplete: boolean;
  winner: 'A' | 'D' | null;
  winnerName: string | null;
  by: FightOutcomeBy;
  minutes: number;
  totalEvents: number;
  announcement?: string;
}

function getOutcomeStyles(by: FightOutcomeBy) {
  switch (by) {
    case 'Kill':
      return {
        bg: 'bg-arena-blood/20 border-arena-blood/40',
        text: 'text-arena-blood',
        icon: <Skull className="h-4 w-4" />,
      };
    case 'KO':
      return {
        bg: 'bg-arena-gold/20 border-arena-gold/40',
        text: 'text-arena-gold',
        icon: <Zap className="h-4 w-4" />,
      };
    case 'Exhaustion':
      return {
        bg: 'bg-neutral-800 border-white/5',
        text: 'text-muted-foreground',
        icon: <Activity className="h-4 w-4" />,
      };
    case 'Stoppage':
      return {
        bg: 'bg-primary/10 border-primary/20',
        text: 'text-primary',
        icon: <Shield className="h-4 w-4" />,
      };
    default:
      return {
        bg: 'bg-neutral-900 border-white/5',
        text: 'text-muted-foreground',
        icon: <Swords className="h-4 w-4" />,
      };
  }
}/**
  * Bout resolution.
  * @param  - {
  is complete,
  winner,
  winner name,
  by,
  minutes,
  total events,
  announcement,
}.
  * @returns The result.
  */


/**
 * Bout resolution.
 * @param  - {
  is complete,
  winner,
  winner name,
  by,
  minutes,
  total events,
  announcement,
}.
 * @returns The result.
 */
export default function BoutResolution({
  isComplete,
  winner,
  winnerName,
  by,
  minutes,
  totalEvents,
  announcement,
}: BoutResolutionProps) {
  if (!isComplete) return null;

  const outcomeStyle = getOutcomeStyles(by);

  return (
    <>
      {/* Cinematic Resolution Banner */}
      {winner && (
        <div
          className={cn(
            'p-8 border-t flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 duration-1000 bg-neutral-950/80 backdrop-blur-3xl relative overflow-hidden',
            outcomeStyle.bg
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="flex items-center gap-8 relative z-10 w-full justify-center">
            <div className={outcomeStyle.text}>{outcomeStyle.icon}</div>
            <div className="text-center space-y-2">
              <h2
                className={cn(
                  'font-display font-black text-3xl uppercase tracking-tighter italic',
                  outcomeStyle.text
                )}
              >
                {winnerName} VICTORY
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-white/10" />
                <div className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">
                  BY WAY OF {(by ?? 'RESOLUTION').toUpperCase()}
                </div>
                <span className="h-px w-8 bg-white/10" />
              </div>
            </div>
            <div className={outcomeStyle.text}>{outcomeStyle.icon}</div>
          </div>

          <div className="flex items-center gap-8 relative z-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mb-1">
                Resolution Time
              </span>
              <span>{minutes}:00</span>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mb-1">
                Engagements
              </span>
              <span>{totalEvents}</span>
            </div>
          </div>
        </div>
      )}

      {!winner && (
        <div className="p-12 border-t border-white/5 flex flex-col items-center gap-4 bg-neutral-900 animate-in slide-in-from-bottom-8 duration-1000">
          <Crosshair className="h-10 w-10 text-muted-foreground opacity-40 mb-2" />
          <h2 className="font-display font-black text-3xl uppercase tracking-tighter italic text-muted-foreground/60">
            MUTUAL_DEPLETION_DRAW
          </h2>
          <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">
            {minutes} MINUTES // NO RESOLUTION
          </div>
        </div>
      )}

      {/* Comms Link Overlay */}
      {announcement && (
        <div className="px-8 py-6 border-t border-white/5 bg-black relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-px bg-arena-gold/30 animate-pulse" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2 rounded-none bg-arena-gold/10 border border-arena-gold/20 shrink-0">
              <Activity className="h-4 w-4 text-arena-gold" />
            </div>
            <p className="text-[13px] italic text-muted-foreground/80 leading-relaxed font-serif py-0.5">
              " {announcement} "
            </p>
          </div>
        </div>
      )}
    </>
  );
}
