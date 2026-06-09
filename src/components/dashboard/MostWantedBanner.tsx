import { Skull, Target } from 'lucide-react';

interface MostWantedBannerProps {
  name: string;
  stable: string;
  wins: number;
  kills: number;
}

/**
 *
 */
export function MostWantedBanner({ name, stable, wins, kills }: MostWantedBannerProps) {
  return (
    <div className="border-t border-white/5 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-3.5 w-3.5 text-destructive opacity-60" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          High Priority Target
        </span>
      </div>
      <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/10 rounded-none group/wanted hover:bg-destructive/10 transition-all">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-none bg-destructive/20 flex items-center justify-center border border-destructive/30">
            <Skull className="h-5 w-5 text-destructive animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tight text-foreground transition-colors group-wanted:text-destructive">
              {name}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              Stable: {stable}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-black text-destructive">
            {wins} VICTORIES <span className="text-foreground/10 mx-1">|</span> {kills} TERMINATIONS
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-destructive/40">
            AGGRESSION RATING: EXTREME
          </span>
        </div>
      </div>
    </div>
  );
}
