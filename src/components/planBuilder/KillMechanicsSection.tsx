import { Flame } from 'lucide-react';
import type { FightPlan } from '@/types/game';
import { getKillMechanic } from '@/engine/stylePassives';

interface KillMechanicsSectionProps {
  plan: FightPlan;
}

const DEFAULT_KILL_CONTEXT = {
  phase: 'OPENING' as const,
  hitsLanded: 0,
  consecutiveHits: 0,
  hitLocation: 'body',
};

export default function KillMechanicsSection({ plan }: KillMechanicsSectionProps) {
  const mechanic = getKillMechanic(plan.style, DEFAULT_KILL_CONTEXT);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <Flame className="w-3 h-3 text-destructive" />
        <span>Kill Mechanics</span>
      </div>
      <div className="bg-white/5 p-3 text-[9px] space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground/60">Kill Bonus</span>
          <span className="font-mono font-bold text-destructive">
            {(mechanic.killBonus * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground/60">Decisiveness Bonus</span>
          <span className="font-mono font-bold text-arena-gold">+{mechanic.decBonus}</span>
        </div>
        <div className="text-muted-foreground/60 italic mt-2">"{mechanic.killNarrative}"</div>
      </div>
    </div>
  );
}
