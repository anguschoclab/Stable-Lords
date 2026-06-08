import { Timer, Heart } from 'lucide-react';
import type { FightPlan } from '@/types/game';
import { getTempoBonus, getEnduranceMult } from '@/engine/stylePassives';

interface TempoSectionProps {
  plan: FightPlan;
}

export default function TempoSection({ plan }: TempoSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <Timer className="w-3 h-3" />
        <span>Tempo</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[9px]">
        <div className="bg-white/5 p-2">
          <div className="text-muted-foreground/60 uppercase">Opening</div>
          <div className="font-mono font-bold text-arena-gold">
            {getTempoBonus(plan.style, 'OPENING') > 0 ? '+' : ''}
            {getTempoBonus(plan.style, 'OPENING')}
          </div>
        </div>
        <div className="bg-white/5 p-2">
          <div className="text-muted-foreground/60 uppercase">Mid</div>
          <div className="font-mono font-bold text-arena-gold">
            {getTempoBonus(plan.style, 'MID') > 0 ? '+' : ''}
            {getTempoBonus(plan.style, 'MID')}
          </div>
        </div>
        <div className="bg-white/5 p-2">
          <div className="text-muted-foreground/60 uppercase">Late</div>
          <div className="font-mono font-bold text-arena-gold">
            {getTempoBonus(plan.style, 'LATE') > 0 ? '+' : ''}
            {getTempoBonus(plan.style, 'LATE')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
        <Heart className="w-3 h-3" />
        <span>Endurance Multiplier: {(getEnduranceMult(plan.style) * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
