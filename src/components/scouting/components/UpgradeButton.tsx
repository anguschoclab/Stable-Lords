import { ArrowUp, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoutQuality } from '@/types/game';
import { getScoutCost } from '@/engine/scouting';

interface UpgradeButtonProps {
  currentQuality: ScoutQuality;
  onUpgrade: () => void;
}

export function UpgradeButton({ currentQuality, onUpgrade }: UpgradeButtonProps) {
  const upgradePath: Record<ScoutQuality, ScoutQuality | null> = {
    Basic: 'Detailed',
    Detailed: 'Expert',
    Expert: null,
  };

  const nextQuality = upgradePath[currentQuality];
  if (!nextQuality) return null;

  const cost = getScoutCost(nextQuality);

  return (
    <button
      onClick={onUpgrade}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-none border transition-all group',
        'bg-arena-gold/5 border-arena-gold/20 hover:bg-arena-gold/10 hover:border-arena-gold/40'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-none bg-arena-gold/10 border border-arena-gold/20 group-hover:bg-arena-gold/20 transition-colors">
          <ArrowUp className="h-4 w-4 text-arena-gold" />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-arena-gold block leading-none mb-1">
            UPGRADE TO {nextQuality.toUpperCase()}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-arena-gold/60">
            Enhanced Precision & Detail
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 rounded-none border flex items-center gap-2 font-mono font-black text-xs bg-arena-gold/10 border-arena-gold/30 text-arena-gold">
        <Coins className="h-3.5 w-3.5" /> {cost}G
      </div>
    </button>
  );
}
