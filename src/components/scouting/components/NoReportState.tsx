import { Target, Terminal, Eye, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import type { ScoutQuality } from '@/types/game';
import { getScoutCost } from '@/engine/scouting';

interface NoReportStateProps {
  warriorName: string;
  treasury: number;
  onScout: (quality: ScoutQuality) => void;
}

export function NoReportState({ warriorName, treasury, onScout }: NoReportStateProps) {
  const QUALITIES: ScoutQuality[] = ['Basic', 'Detailed', 'Expert'];

  return (
    <Surface variant="glass" className="border-border/40 shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-12 -bottom-12 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-1000">
        <Target className="h-48 w-48 text-primary" />
      </div>

      <div className="space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-primary/10 border border-primary/20">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary leading-none">
              Scouting Protocol Pending
            </h4>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed font-display max-w-md">
            Establish a tactical deep-scan on <span>{warriorName}</span> to uncover their combat
            signatures and metabolic thresholds.
          </p>
        </div>

        <div className="grid gap-3 pt-4">
          {QUALITIES.map((q) => {
            const cost = getScoutCost(q);
            const canAfford = treasury >= cost;
            return (
              <ScoutingButton
                key={q}
                quality={q}
                cost={cost}
                canAfford={canAfford}
                onClick={() => onScout(q)}
              />
            );
          })}
        </div>
      </div>
    </Surface>
  );
}

interface ScoutingButtonProps {
  quality: ScoutQuality;
  cost: number;
  canAfford: boolean;
  onClick: () => void;
}

function ScoutingButton({ quality, cost, canAfford, onClick }: ScoutingButtonProps) {
  const isExpert = quality === 'Expert';
  const precision = quality === 'Expert' ? '99.9%' : quality === 'Detailed' ? '85%' : '60%';

  return (
    <button
      disabled={!canAfford}
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-none border transition-all relative group/btn',
        canAfford
          ? isExpert
            ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02]'
            : 'bg-neutral-900/60 border-white/5 hover:border-primary/40 hover:bg-white/5'
          : 'bg-neutral-900/40 border-white/5 opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-2 rounded-none transition-colors border',
            isExpert
              ? 'bg-white/10 border-white/20'
              : 'bg-neutral-800 border-white/5 group-hover/btn:bg-primary/20 group-hover/btn:border-primary/20 group-hover/btn:text-primary'
          )}
        >
          <Eye className="h-4 w-4" />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none mb-1">
            {quality} SCAN
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
            Precision: {precision}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'px-3 py-1.5 rounded-none border flex items-center gap-2 font-mono font-black text-xs',
          isExpert
            ? 'bg-black/20 border-foreground/10 text-foreground'
            : 'bg-black border-white/5 text-arena-gold'
        )}
      >
        <Coins className="h-3.5 w-3.5" /> {cost}G
      </div>

      {isExpert && canAfford && (
        <div className="absolute inset-0 bg-white/5 animate-pulse rounded-none pointer-events-none" />
      )}
    </button>
  );
}
