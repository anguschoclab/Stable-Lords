import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Warrior } from '@/types/state.types';

interface OfferMatchupPanelProps {
  playerWarrior?: Warrior;
  fatigueStatus: { label: string; color: string };
  injuryBadge: { label: string; color: string } | null;
  opponent: (Warrior & { stableName: string }) | null;
}

/**
 * Matchup panel: your fighter (with fatigue/injury badges) versus the
 * opponent's name and stable.
 */
export function OfferMatchupPanel({
  playerWarrior,
  fatigueStatus,
  injuryBadge,
  opponent,
}: OfferMatchupPanelProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1 text-center space-y-2">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40">
          YOUR FIGHTER
        </span>
        <div className="text-xs font-display font-black uppercase text-foreground">
          {playerWarrior?.name}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span
            className={cn('text-[8px] font-black uppercase tracking-widest', fatigueStatus.color)}
          >
            {fatigueStatus.label} [{100 - (playerWarrior?.fatigue ?? 0)}%]
          </span>
          {injuryBadge && (
            <span
              className={cn('text-[8px] font-black uppercase tracking-widest', injuryBadge.color)}
            >
              / {injuryBadge.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 opacity-20">
        <Zap className="h-4 w-4" />
        <div className="h-8 w-px bg-white/20" />
      </div>

      <div className="flex-1 text-center space-y-2">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
          OPPONENT
        </span>
        <div className="text-xs font-display font-black uppercase text-muted-foreground/80">
          {opponent?.name || 'UNKNOWN'}
        </div>
        <div className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
          {opponent?.stableName || 'UNKNOWN STABLE'}
        </div>
      </div>
    </div>
  );
}
